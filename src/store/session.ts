import { create } from 'zustand';

export interface AuditEvent {
  id: string;
  type: string;
  slots: Record<string, any>;
  at: string;
  reasonCodes: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  audio?: string; // base64 mp3 for assistant messages
  actionCard?: {
    title: string;
    details?: string;
    confirmLabel: string;
    onConfirmIntent: string;
    slots: Record<string, any>;
  };
}

interface SessionState {
  bankidVerified: boolean;
  auditLog: AuditEvent[];
  thread: Message[];
  
  setBankidVerified: (verified: boolean) => void;
  addAuditEvent: (event: Omit<AuditEvent, 'id' | 'at'>) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateLastAssistantMessageContent: (updater: (prev: string) => string) => void;
  clearThread: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  bankidVerified: false,
  auditLog: [],
  thread: [],
  
  setBankidVerified: (verified) => set({ bankidVerified: verified }),
  
  addAuditEvent: (event) => set((state) => ({
    auditLog: [
      {
        ...event,
        id: `audit-${(globalThis as any).crypto?.randomUUID ? (globalThis as any).crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)}`,
        at: new Date().toISOString(),
      },
      ...state.auditLog
    ].slice(0, 20) // Keep only last 20 events
  })),
  
  addMessage: (message) => set((state) => ({
    thread: [
      ...state.thread,
      {
        ...message,
        id: `msg-${(globalThis as any).crypto?.randomUUID ? (globalThis as any).crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)}`,
        timestamp: new Date().toISOString(),
      }
    ]
  })),

  updateLastAssistantMessageContent: (updater) => set((state) => {
    const thread = [...state.thread];
    // Find last assistant message
    for (let i = thread.length - 1; i >= 0; i--) {
      if (thread[i].role === 'assistant') {
        thread[i] = {
          ...thread[i],
          content: updater(thread[i].content || ''),
        } as Message;
        break;
      }
    }
    return { thread };
  }),
  
  clearThread: () => set({ thread: [] }),
}));