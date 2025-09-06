export class OpenAIRealtimeVoice {
  private isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  // No API key needed in the browser; requests go through our backend proxy
  constructor() {}

  async startRecording(): Promise<void> {
    if (this.isRecording) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      console.log('Recording started');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error('Failed to access microphone');
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || '';
  }

  async generateSpeechFromText(text: string): Promise<string> {
    // Convert text to speech via backend proxy
    const ttsResponse = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        text,
        voice: 'alloy',
        format: 'mp3'
      })
    });

    if (!ttsResponse.ok) {
      throw new Error(`TTS failed: ${ttsResponse.statusText}`);
    }

    const audioArrayBuffer = await ttsResponse.arrayBuffer();
    return this.arrayBufferToBase64(audioArrayBuffer);
  }

  async transcribeAndRespond(audioBlob: Blob): Promise<{ transcript: string; audioResponse?: string }> {
    try {
      // Just transcribe the audio - the agent response will be handled separately
      const transcript = await this.transcribeAudio(audioBlob);
      
      return {
        transcript
      };
      
    } catch (error) {
      console.error('Voice processing error:', error);
      throw new Error('Failed to process voice input');
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  async playAudioBase64(base64Audio: string): Promise<void> {
    const audioSrc = `data:audio/mpeg;base64,${base64Audio}`;
    const audio = new Audio(audioSrc);
    
    return new Promise((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Failed to play audio'));
      audio.play().catch(reject);
    });
  }
}