import { create } from 'zustand';
import { initialDampakData, WeeklyImpactItem, FloorImpactItem } from '@/constants/mockData';

interface DampakState {
  weekNumber: number;
  totalOrganicKg: number;
  preventedEmissionTon: string;
  baselineKgPerWeek: number;
  weeklyData: WeeklyImpactItem[];
  floorsWeekly: FloorImpactItem[];
  selectedWeekCode: string | null;
  isDownloadModalOpen: boolean;

  // Actions
  setSelectedWeekCode: (code: string | null) => void;
  openDownloadModal: () => void;
  closeDownloadModal: () => void;
}

export const useDampakStore = create<DampakState>((set) => ({
  weekNumber: initialDampakData.weekNumber,
  totalOrganicKg: initialDampakData.totalOrganicKg,
  preventedEmissionTon: initialDampakData.preventedEmissionTon,
  baselineKgPerWeek: initialDampakData.baselineKgPerWeek,
  weeklyData: initialDampakData.weeklyData,
  floorsWeekly: initialDampakData.floorsWeekly,
  selectedWeekCode: null,
  isDownloadModalOpen: false,

  setSelectedWeekCode: (code: string | null) =>
    set((state) => ({
      selectedWeekCode: state.selectedWeekCode === code ? null : code,
    })),

  openDownloadModal: () => set({ isDownloadModalOpen: true }),
  closeDownloadModal: () => set({ isDownloadModalOpen: false }),
}));
