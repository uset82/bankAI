import { create } from 'zustand';
import { OpenAIRealtimeClient } from '@/lib/openai-realtime';

interface VoiceState {
  client: OpenAIRealtimeClient | null;
  isConnected: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  
  initializeClient: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  sendMessage: (text: string) => void;
  disconnect: () => void;
  clearError: () => void;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  client: null,
  isConnected: false,
  isRecording: false,
  isProcessing: false,
  error: null,

  initializeClient: async () => {
    const client = new OpenAIRealtimeClient();
    
    try {
      await client.connect({
        onConnectionChange: (connected) => {
          set({ isConnected: connected });
        },
        onError: (error) => {
          set({ error, isProcessing: false, isRecording: false });
        },
        onMessage: (text) => {
          // Messages will be handled by the component
          console.log('Voice message:', text);
        },
        onAudio: (audioData) => {
          // Audio will be handled by the component
          console.log('Voice audio received');
        }
      });
      
      set({ client, error: null });
    } catch (error) {
      set({ error: 'Failed to initialize voice service' });
    }
  },

  startRecording: async () => {
    const { client } = get();
    if (!client || !client.isConnectedToService()) {
      set({ error: 'Voice service not connected' });
      return;
    }

    try {
      set({ isRecording: true, error: null });
      await client.startRecording();
    } catch (error) {
      set({ 
        error: 'Failed to start recording', 
        isRecording: false 
      });
    }
  },

  stopRecording: () => {
    const { client } = get();
    if (!client) return;

    client.stopRecording();
    set({ isRecording: false, isProcessing: true });
  },

  sendMessage: (text: string) => {
    const { client } = get();
    if (!client || !client.isConnectedToService()) {
      set({ error: 'Voice service not connected' });
      return;
    }

    try {
      set({ isProcessing: true, error: null });
      client.sendTextMessage(text);
    } catch (error) {
      set({ error: 'Failed to send message', isProcessing: false });
    }
  },

  disconnect: () => {
    const { client } = get();
    if (client) {
      client.disconnect();
    }
    set({ 
      client: null, 
      isConnected: false, 
      isRecording: false, 
      isProcessing: false,
      error: null 
    });
  },

  clearError: () => set({ error: null }),
}));