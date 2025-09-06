import { useState, useRef } from 'react';
import { OpenAIRealtimeVoice } from '@/lib/openai-voice';
import { useSessionStore } from '@/store/session';
// import { mockAgentAPI } from '@/lib/mockApi';

export const useVoiceChat = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const voiceClientRef = useRef<OpenAIRealtimeVoice | null>(null);
  const { addMessage } = useSessionStore();

  // Initialize the voice client (no API key in client)
  const initVoiceClient = () => {
    voiceClientRef.current = new OpenAIRealtimeVoice();
  };

  const startRecording = async () => {
    if (!voiceClientRef.current) {
      initVoiceClient();
    }

    if (isRecording || isProcessing) return;

    try {
      setError(null);
      setIsRecording(true);
      await voiceClientRef.current!.startRecording();
    } catch (err) {
      setError('Failed to start recording');
      setIsRecording(false);
      console.error('Recording error:', err);
    }
  };

  const callOpenAI = async (userText: string) => {
    try {
      const response = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are an AI Bank assistant. Be helpful, concise, and friendly. Respond in English unless the user speaks another language. Output a short assistant_say and, if appropriate, a JSON action_card with fields: title, details, confirmLabel, onConfirmIntent, and slots.' },
            { role: 'user', content: userText }
          ]
        })
      });

      if (!response.ok) throw new Error('OpenAI chat proxy error');
      const data = await response.json();
      // OpenAI response format: { choices: [{ message: { content } }] }
      const content = data?.choices?.[0]?.message?.content || '';

      // Try to parse action card metadata if model returns JSON fenced block
      let assistantSay = content;
      let actionCard: any = undefined;

      // Heuristic: look for JSON block
      const jsonMatch = content.match(/\{[\s\S]*\}$/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.assistant_say) assistantSay = parsed.assistant_say;
          if (parsed.action_card) actionCard = parsed.action_card;
        } catch (_) {
          // ignore parse failure; treat as plain text
        }
      }

      return { assistant_say: assistantSay, action_card: actionCard } as { assistant_say: string; action_card?: any };
    } catch (e) {
      console.error('OpenAI call failed', e);
      return { assistant_say: "Sorry, I couldn't process that right now." } as { assistant_say: string };
    }
  };

  const stopRecording = async () => {
    if (!voiceClientRef.current || !isRecording) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);

      // Stop recording and get the audio blob
      const audioBlob = await voiceClientRef.current.stopRecording();
      
      // Process the audio through backend (OpenAI Whisper proxy)
      const result = await voiceClientRef.current.transcribeAndRespond(audioBlob);
      
      // Add user message (transcript)
      if (result.transcript) {
        addMessage({
          role: 'user',
          content: result.transcript
        });

        // Call OpenAI agent via backend
        const agentResponse = await callOpenAI(result.transcript);
        
        // Generate audio for the agent response
        const audioBase64 = await voiceClientRef.current.generateSpeechFromText(agentResponse.assistant_say);
        
        // Add assistant response with action card if applicable
        addMessage({
          role: 'assistant',
          content: agentResponse.assistant_say,
          actionCard: (agentResponse as any).action_card,
          audio: audioBase64
        });

        // Play the audio response
        if (audioBase64) {
          await voiceClientRef.current.playAudioBase64(audioBase64);
        }
      } else {
        // Fallback message
        const fallbackText = 'I heard you, but couldn\'t understand what you said. Please try again.';
        const fallbackAudio = await voiceClientRef.current.generateSpeechFromText(fallbackText);
        
        addMessage({
          role: 'assistant',
          content: fallbackText,
          audio: fallbackAudio
        });

        await voiceClientRef.current.playAudioBase64(fallbackAudio);
      }

    } catch (err) {
      setError('Failed to process voice input');
      console.error('Voice processing error:', err);
      
      // Add error message
      addMessage({
        role: 'assistant',
        content: 'Sorry, I had trouble processing your voice input. Please try again or type your message.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
    clearError: () => setError(null)
  };
};