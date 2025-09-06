import { create } from 'zustand';

interface UIState {
  activeTab: 'accounts' | 'gov' | 'coupons' | 'audit';
  isRecording: boolean;
  isBankIdModalOpen: boolean;
  
  setActiveTab: (tab: 'accounts' | 'gov' | 'coupons' | 'audit') => void;
  setIsRecording: (recording: boolean) => void;
  setIsBankIdModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'accounts',
  isRecording: false,
  isBankIdModalOpen: false,
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsRecording: (recording) => set({ isRecording: recording }),
  setIsBankIdModalOpen: (open) => set({ isBankIdModalOpen: open }),
}));