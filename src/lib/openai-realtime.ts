// Get ephemeral token for WebRTC connection
export async function getRealtimeClientSecret(): Promise<{ key: string; model?: string }> {
  const resp = await fetch('/api/realtime/client_secret', { method: 'POST' });
  if (!resp.ok) throw new Error(`Failed to get client secret (${resp.status})`);
  const data = await resp.json();
  // Accept multiple shapes from API/proxy
  let key: any = data?.client_secret?.value
    || data?.client_secret
    || data?.value
    || data?.secret
    || data?.ephemeralKey?.secret
    || data?.ephemeral_key;

  if (typeof key !== 'string' || !key) {
    throw new Error('Invalid client secret response');
  }
  const model: string | undefined = data?.model || data?.session?.model || undefined;
  return { key, model };
}

import { PcmPlayer } from './pcm-player';

export class OpenAIRealtimeClient {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private isConnected = false;
  private sessionId: string | null = null;

  private onMessage?: (text: string) => void;
  private onAudio?: (audioData: ArrayBuffer) => void;
  private onError?: (error: string) => void;
  private onConnectionChange?: (connected: boolean) => void;
  private pcmPlayer: PcmPlayer | null = null;

  constructor() {}

  async connect(options: {
    onMessage?: (text: string) => void;
    onAudio?: (audioData: ArrayBuffer) => void;
    onError?: (error: string) => void;
    onConnectionChange?: (connected: boolean) => void;
  }) {
    this.onMessage = options.onMessage;
    this.onAudio = options.onAudio;
    this.onError = options.onError;
    this.onConnectionChange = options.onConnectionChange;

    return new Promise<void>(async (resolve, reject) => {
      try {
        // Get ephemeral token
        console.log('Getting ephemeral token...');
        const { key: EPHEMERAL_KEY, model: serverModel } = await getRealtimeClientSecret();
        console.log('Got ephemeral token');

        // Create peer connection
        this.pc = new RTCPeerConnection();

        // Set up to play remote audio from the model
        this.audioElement = document.createElement("audio");
        this.audioElement.autoplay = true;
        this.pc.ontrack = (e) => {
          console.log('Received audio track from model');
          this.audioElement!.srcObject = e.streams[0];
        };

        // Add local audio track for microphone input
        console.log('Requesting microphone access...');
        const ms = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 24000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        this.pc.addTrack(ms.getTracks()[0]);
        console.log('Microphone access granted');

        // Set up data channel for sending and receiving events
        this.dc = this.pc.createDataChannel("oai-events");
        this.dc.onopen = async () => {
          console.log('Data channel opened');
          // Push demo accounts JSON into the session as a system message
          try {
            const r = await fetch('/mock/accounts.json');
            if (r.ok) {
              const demo = await r.json();
              const preload = {
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'system',
                  content: [
                    { type: 'input_text', text: `DEMO_ACCOUNTS_JSON: ${JSON.stringify(demo)}` }
                  ]
                }
              };
              this.dc!.send(JSON.stringify(preload));
            }
          } catch {}

          this.sendSessionUpdate();
        };
        this.dc.onmessage = (e) => {
          try {
            const event = JSON.parse(e.data);
            this.handleRealtimeEvent(event);
          } catch (err) {
            console.error('Failed to parse data channel message:', err);
          }
        };

        // Start the session using SDP
        console.log('Creating offer...');
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        const baseUrl = "https://api.openai.com/v1/realtime";
        const model = serverModel || "gpt-4o-realtime-preview-2024-10-01";

        console.log('Sending offer to OpenAI...');
        const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            "Content-Type": "application/sdp",
            "OpenAI-Beta": "realtime=v1",
          },
        });

        if (!sdpResponse.ok) {
          const errText = await sdpResponse.text().catch(() => '');
          throw new Error(`Failed to connect to Realtime API: ${sdpResponse.status}${errText ? ` - ${errText}` : ''}`);
        }

        const answer: RTCSessionDescriptionInit = {
          type: "answer" as RTCSdpType,
          sdp: await sdpResponse.text(),
        };
        await this.pc.setRemoteDescription(answer);

        this.isConnected = true;
        this.onConnectionChange?.(true);
        resolve();
      } catch (e: any) {
        console.error('Realtime connect error:', e);
        this.onError?.(e?.message || 'Failed to initialize realtime');
        this.isConnected = false;
        this.onConnectionChange?.(false);
        reject(e);
      }
    });
  }

  // Removed session.create; use session.update to configure the session

  private sendSessionUpdate() {
    if (!this.dc || this.dc.readyState !== 'open') return;

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: (window as any).AI_BANK_ASSISTANT_PROMPT || 'You are an AI Bank assistant. Be helpful, concise, and friendly. Respond to banking queries about balances, payments, and account information.',
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: null,
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        tools: [],
        tool_choice: 'auto',
        max_response_output_tokens: 4096
      }
    };

    this.dc.send(JSON.stringify(sessionConfig));
  }

  private handleRealtimeEvent(event: any) {
    switch (event.type) {
      case 'session.created':
        this.sessionId = event.session.id;
        console.log('Session created:', this.sessionId);
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          this.onMessage?.(event.transcript);
        }
        break;
        
      // Audio deltas (support legacy and modern event names)
      case 'response.audio.delta':
      case 'response.output_audio.delta': {
        const base64 = event.delta || event.audio || event.data;
        if (base64) {
          const audioData = this.base64ToArrayBuffer(base64);
          try {
            if (!this.pcmPlayer) this.pcmPlayer = new PcmPlayer(24000);
            this.pcmPlayer.enqueuePcm16(audioData);
          } catch {
            this.onAudio?.(audioData);
          }
        }
        break;
      }
        
      // Text deltas (support legacy and modern event names)
      case 'response.text.delta':
      case 'response.output_text.delta': {
        const deltaText = event.delta || event.text || event.data;
        if (deltaText) this.onMessage?.(deltaText);
        break;
      }
        
      case 'error':
        console.error('Realtime API error:', event.error);
        this.onError?.(event.error.message || 'Unknown error occurred');
        break;
        
      case 'response.audio.done':
        console.log('Audio response completed');
        break;
      case 'response.completed':
        // Reset PCM scheduler so the next response starts promptly
        if (this.pcmPlayer) {
          try { this.pcmPlayer.reset(); } catch { /* noop */ }
        }
        break;
        
      default:
        // console.log('Unhandled event:', event.type);
        break;
    }
  }

  async startRecording() {
    if (!this.isConnected) {
      throw new Error('Not connected to voice service');
    }

    // For WebRTC, audio streaming is handled automatically through the peer connection
    // We just need to ensure the microphone is active (already done in connect())
    console.log('Recording started - audio streaming through WebRTC');
  }

  stopRecording() {
    // For WebRTC, we send a response.create event to get the model's response
    if (this.dc && this.dc.readyState === 'open') {
      this.dc.send(JSON.stringify({
        type: 'response.create',
        response: {
          modalities: ['text', 'audio'],
          instructions: 'Please respond to the user\'s banking query.'
        }
      }));
    }

    console.log('Recording stopped - requesting response');
  }

  sendTextMessage(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Not connected to voice service');
    }

    const messageEvent = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    };

    this.dc.send(JSON.stringify(messageEvent));

    // Request response
    this.dc.send(JSON.stringify({
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
        instructions: 'Please respond to the user\'s banking query.'
      }
    }));
  }

  disconnect() {
    this.stopRecording();

    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.isConnected = false;
    this.sessionId = null;
    this.onConnectionChange?.(false);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  isConnectedToService(): boolean {
    return this.isConnected && this.pc?.connectionState === 'connected';
  }
}