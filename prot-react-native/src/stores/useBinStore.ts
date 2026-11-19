import { create } from 'zustand';
import { BinItem, initialBinsData } from '@/constants/mockData';
import { fetchBinsApi, markBinPickedUpApi, toggleBinSensorApi } from '@/services/api';

interface BinState {
  blockName: string;
  operator: string;
  bins: BinItem[];
  selectedBin: BinItem | null;
  isDetailModalOpen: boolean;
  isEditBlockModalOpen: boolean;
  isLoading: boolean;
  lastFetchedAt: Date | null;

  // Actions
  fetchBins: (silent?: boolean) => Promise<void>;
  setBlockName: (name: string) => void;
  setOperator: (operator: string) => void;
  openDetailModal: (bin: BinItem) => void;
  closeDetailModal: () => void;
  openEditBlockModal: () => void;
  closeEditBlockModal: () => void;
  markPickedUp: (binId: number) => Promise<void>;
  toggleSensor: (binId: number) => Promise<void>;
  refreshSensor: () => Promise<void>;
}

export const useBinStore = create<BinState>((set, get) => ({
  blockName: 'Blok A',
  operator: 'Rina',
  bins: initialBinsData,
  selectedBin: null,
  isDetailModalOpen: false,
  isEditBlockModalOpen: false,
  isLoading: false,
  lastFetchedAt: null,

  setBlockName: (name: string) => set({ blockName: name }),
  setOperator: (operator: string) => set({ operator }),

  openDetailModal: (bin: BinItem) => set({ selectedBin: bin, isDetailModalOpen: true }),
  closeDetailModal: () => set({ selectedBin: null, isDetailModalOpen: false }),

  openEditBlockModal: () => set({ isEditBlockModalOpen: true }),
  closeEditBlockModal: () => set({ isEditBlockModalOpen: false }),

  fetchBins: async (silent = false) => {
    if (!silent) set({ isLoading: true });
    try {
      const res = await fetchBinsApi();
      if (res && res.data) {
        set({
          bins: res.data,
          lastFetchedAt: new Date(),
          isLoading: false,
        });

        // Jika modal sedang terbuka untuk suatu tong, sinkronkan selectedBin terbaru
        const currentSelected = get().selectedBin;
        if (currentSelected) {
          const updated = res.data.find((b) => b.id === currentSelected.id);
          if (updated) {
            set({ selectedBin: updated });
          }
        }
      }
    } catch (error) {
      console.warn('[useBinStore] Gagal mengambil data tong dari API, menggunakan data lokal:', error);
      set({ isLoading: false });
    }
  },

  markPickedUp: async (binId: number) => {
    try {
      await markBinPickedUpApi(binId);
      // Refresh data terbaru dari database
      await get().fetchBins(true);
    } catch (error) {
      console.warn('[useBinStore] Gagal markPickedUp di backend, lakukan update optimistik:', error);
      set((state) => ({
        bins: state.bins.map((b) =>
          b.id === binId
            ? {
                ...b,
                status: 'Aman',
                weightKg: 0.0,
                percent: 0,
                ageHours: 0,
              }
            : b
        ),
      }));
    } finally {
      set({ isDetailModalOpen: false, selectedBin: null });
    }
  },

  toggleSensor: async (binId: number) => {
    try {
      await toggleBinSensorApi(binId);
      await get().fetchBins(true);
    } catch (error) {
      console.warn('[useBinStore] Gagal toggleSensor di backend:', error);
    }
  },

  refreshSensor: async () => {
    await get().fetchBins(false);
  },
}));
