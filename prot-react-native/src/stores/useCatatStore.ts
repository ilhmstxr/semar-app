import { create } from 'zustand';
import { initialSavedHistory, SetoranRecord, sensorDataByFloor } from '@/constants/mockData';
import {
  fetchSensorWeightsApi,
  fetchSetoranHistoryApi,
  createSetoranApi,
  deleteSetoranApi,
} from '@/services/api';

export type OdorType = 'Tidak' | 'Sedikit tercium' | 'Ya, menyengat';

interface CatatState {
  selectedFloor: string;
  totalWeight: number;
  maggotKg: number;
  komposterKg: number;
  anorganikKg: number;
  corridorOdor: OdorType;
  photoUri: string | null;
  photoUrl: string | null;
  history: SetoranRecord[];
  sensorWeights: Record<string, { active: boolean; weight: number }>;
  isHistoryModalOpen: boolean;
  isEditSortingModalOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  setSelectedFloor: (floor: string) => void;
  setTotalWeight: (weight: number) => void;
  setManualSorting: (
    maggot: number,
    komposter: number,
    anorganik: number
  ) => { success: boolean; message?: string };
  setCorridorOdor: (odor: OdorType) => void;
  setPhoto: (uri: string | null, url?: string | null) => void;
  fetchSensorWeights: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchFromSensor: () => Promise<{ success: boolean; message: string }>;
  saveSetoran: (operator: string) => Promise<{ success: boolean; message: string }>;
  deleteHistoryItem: (id: number) => Promise<void>;
  openHistoryModal: () => void;
  closeHistoryModal: () => void;
  openEditSortingModal: () => void;
  closeEditSortingModal: () => void;
  resetForm: () => void;
}

export const useCatatStore = create<CatatState>((set, get) => ({
  selectedFloor: 'Lantai 1',
  totalWeight: 0,
  maggotKg: 0,
  komposterKg: 0,
  anorganikKg: 0,
  corridorOdor: 'Tidak',
  photoUri: null,
  photoUrl: null,
  history: initialSavedHistory,
  sensorWeights: sensorDataByFloor,
  isHistoryModalOpen: false,
  isEditSortingModalOpen: false,
  isLoading: false,
  isSaving: false,

  setSelectedFloor: (floor: string) => set({ selectedFloor: floor }),

  setTotalWeight: (weight: number) => {
    const safeWeight = Math.max(0, Math.round(weight * 100) / 100);

    // Proporsi acuan default: ~77% maggot, ~17% komposter, sisa anorganik
    let maggot = Math.round(safeWeight * 0.77 * 10) / 10;
    let komposter = Math.round(safeWeight * 0.17 * 10) / 10;
    let anorganik = Math.max(0, Math.round((safeWeight - maggot - komposter) * 10) / 10);

    // Pastikan akumulasi hasil pemilahan tidak melebihi berat total masuk
    const sum = Math.round((maggot + komposter + anorganik) * 10) / 10;
    if (sum > safeWeight) {
      anorganik = Math.max(0, Math.round((safeWeight - maggot - komposter) * 10) / 10);
    }

    set({
      totalWeight: safeWeight,
      maggotKg: maggot,
      komposterKg: komposter,
      anorganikKg: anorganik,
    });
  },

  // 2b: Akumulasi pemilahan dikonfigurasikan dengan batas maksimal berat masuk
  setManualSorting: (maggot: number, komposter: number, anorganik: number) => {
    const m = Math.max(0, Math.round(maggot * 10) / 10);
    const k = Math.max(0, Math.round(komposter * 10) / 10);
    const a = Math.max(0, Math.round(anorganik * 10) / 10);
    const accumulated = Math.round((m + k + a) * 10) / 10;
    const maxWeight = get().totalWeight;

    if (maxWeight > 0 && accumulated > maxWeight + 0.05) {
      return {
        success: false,
        message: `Akumulasi pemilahan (${accumulated} kg) melebihi berat masuk maksimal (${maxWeight} kg)`,
      };
    }

    set({
      maggotKg: m,
      komposterKg: k,
      anorganikKg: a,
      // Jika berat awal adalah 0, total weight mengikuti akumulasi
      totalWeight: maxWeight > 0 ? maxWeight : accumulated,
      isEditSortingModalOpen: false,
    });

    return {
      success: true,
      message: 'Rincian pemilahan berhasil disesuaikan',
    };
  },

  setCorridorOdor: (odor: OdorType) => set({ corridorOdor: odor }),

  setPhoto: (uri: string | null, url: string | null = null) =>
    set({ photoUri: uri, photoUrl: url }),

  fetchSensorWeights: async () => {
    try {
      const res = await fetchSensorWeightsApi();
      if (res && res.data) {
        set({ sensorWeights: res.data });
      }
    } catch (err) {
      console.warn('[useCatatStore] Gagal ambil sensor weights dari API, pakai cache');
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true });
    try {
      const res = await fetchSetoranHistoryApi();
      if (res && res.data) {
        set({ history: res.data, isLoading: false });
      }
    } catch (err) {
      console.warn('[useCatatStore] Gagal ambil riwayat dari API, pakai data lokal');
      set({ isLoading: false });
    }
  },

  fetchFromSensor: async () => {
    // Selalu ambil bobot sensor paling segar dari backend
    let weights = get().sensorWeights;
    try {
      const res = await fetchSensorWeightsApi();
      if (res && res.data) {
        weights = res.data;
        set({ sensorWeights: weights });
      }
    } catch (e) {
      // lanjut dengan weights yang ada
    }

    const floor = get().selectedFloor;
    const sensor = weights[floor];

    if (!sensor || !sensor.active) {
      return {
        success: false,
        message: `Sensor ${floor} sedang nonaktif. Masukkan berat secara manual.`,
      };
    }

    get().setTotalWeight(sensor.weight);
    return {
      success: true,
      message: `Berhasil mengambil ${sensor.weight} kg dari sensor ${floor}`,
    };
  },

  // 2a: Realtime timestamp tahun, bulan, tanggal, jam, menit, detik serta operator dipost ke DB
  saveSetoran: async (operator: string) => {
    const state = get();
    if (state.totalWeight <= 0) {
      return {
        success: false,
        message: 'Masukkan berat total sampah terlebih dahulu',
      };
    }

    // Validasi akumulasi pemilahan maksimal adalah berat masuk
    const accumulated = Math.round((state.maggotKg + state.komposterKg + state.anorganikKg) * 10) / 10;
    if (accumulated > state.totalWeight + 0.05) {
      return {
        success: false,
        message: `Akumulasi pemilahan (${accumulated} kg) tidak boleh melebihi berat total masuk (${state.totalWeight} kg)`,
      };
    }

    set({ isSaving: true });
    try {
      const res = await createSetoranApi({
        floor: state.selectedFloor,
        totalWeight: state.totalWeight,
        maggotKg: state.maggotKg,
        komposterKg: state.komposterKg,
        anorganikKg: state.anorganikKg,
        corridorOdor: state.corridorOdor,
        operator: operator || 'Rina',
        photoUrl: state.photoUrl || state.photoUri || null,
      });

      // Refresh riwayat dari DB
      await get().fetchHistory();

      // Reset form setelah simpan
      get().resetForm();
      set({ isSaving: false });

      return {
        success: true,
        message: res.message || 'Setoran berhasil dicatat dan disimpan ke database',
      };
    } catch (error: any) {
      console.warn('[useCatatStore] Gagal simpan ke DB, simpan optimistik:', error.message);

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const fullDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const fallbackRecord: SetoranRecord = {
        id: Date.now(),
        floor: state.selectedFloor,
        time: timeStr,
        formattedDateTime: fullDateStr,
        collectionDate: fullDateStr.slice(0, 10),
        totalWeight: state.totalWeight,
        maggotKg: state.maggotKg,
        komposterKg: state.komposterKg,
        anorganikKg: state.anorganikKg,
        corridorOdor: state.corridorOdor,
        operator: operator || 'Rina',
        photoUri: state.photoUri,
        photoUrl: state.photoUrl,
        createdAt: fullDateStr,
      };

      set({
        history: [fallbackRecord, ...state.history],
        isSaving: false,
      });
      get().resetForm();

      return {
        success: true,
        message: 'Setoran berhasil dicatat (mode offline / lokal)',
      };
    }
  },

  deleteHistoryItem: async (id: number) => {
    try {
      await deleteSetoranApi(id);
      await get().fetchHistory();
    } catch (err) {
      console.warn('[useCatatStore] Gagal hapus di DB, hapus dari state lokal:', err);
      set((state) => ({
        history: state.history.filter((item) => item.id !== id),
      }));
    }
  },

  openHistoryModal: () => set({ isHistoryModalOpen: true }),
  closeHistoryModal: () => set({ isHistoryModalOpen: false }),

  openEditSortingModal: () => set({ isEditSortingModalOpen: true }),
  closeEditSortingModal: () => set({ isEditSortingModalOpen: false }),

  resetForm: () =>
    set({
      totalWeight: 0,
      maggotKg: 0,
      komposterKg: 0,
      anorganikKg: 0,
      corridorOdor: 'Tidak',
      photoUri: null,
      photoUrl: null,
    }),
}));
