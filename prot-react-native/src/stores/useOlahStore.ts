import { create } from 'zustand';
import { DrumItem, HarvestLogItem, initialDrumsData, initialHarvestLogs, initialMaggotStatus } from '@/constants/mockData';

interface OlahState {
  drums: DrumItem[];
  maggotStatus: typeof initialMaggotStatus;
  harvestLogs: HarvestLogItem[];
  isHarvestModalOpen: boolean;
  isLogModalOpen: boolean;

  // Actions
  openHarvestModal: () => void;
  closeHarvestModal: () => void;
  openLogModal: () => void;
  closeLogModal: () => void;
  addHarvestLog: (type: string, weightKg: number, note: string) => void;
  deleteHarvestLog: (id: number) => void;
}

export const useOlahStore = create<OlahState>((set) => ({
  drums: initialDrumsData,
  maggotStatus: initialMaggotStatus,
  harvestLogs: initialHarvestLogs,
  isHarvestModalOpen: false,
  isLogModalOpen: false,

  openHarvestModal: () => set({ isHarvestModalOpen: true }),
  closeHarvestModal: () => set({ isHarvestModalOpen: false }),
  openLogModal: () => set({ isLogModalOpen: true }),
  closeLogModal: () => set({ isLogModalOpen: false }),

  addHarvestLog: (type: string, weightKg: number, note: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newLog: HarvestLogItem = {
      id: Date.now(),
      time: timeStr,
      type,
      weightKg,
      note,
    };

    set((state) => ({
      harvestLogs: [newLog, ...state.harvestLogs],
      isHarvestModalOpen: false,
    }));
  },

  deleteHarvestLog: (id: number) =>
    set((state) => ({
      harvestLogs: state.harvestLogs.filter((log) => log.id !== id),
    })),
}));
