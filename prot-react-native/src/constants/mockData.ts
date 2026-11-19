/**
 * DATA ARRAY MOCK SEMAR (In-Memory Data)
 * Tidak terhubung ke API / Database eksternal.
 * Semua manipulasi data (create, update, read) berjalan pada array in-memory.
 */

export interface BinItem {
  id: number;
  floor: string;
  status: 'Aman' | 'Segera' | 'Jemput' | 'Sensor off';
  weightKg: number;
  ageHours: number;
  tempC: number | null;
  percent: number;
  sensorActive: boolean;
  fixedSchedule: string;
}

export interface SetoranRecord {
  id: number;
  floor: string;
  time: string;
  formattedDateTime?: string;
  collectionDate?: string;
  totalWeight: number;
  maggotKg: number;
  composterKg?: number;
  komposterKg?: number;
  anorganikKg: number;
  corridorOdor?: string;
  operator: string;
  photoUri?: string | null;
  photoUrl?: string | null;
  createdAt?: string;
}

export interface DrumItem {
  id: number;
  name: string;
  status: string;
  tempC: number;
  humidityPercent: number;
  days: number;
  maturityPercent: number;
}

export interface HarvestLogItem {
  id: number;
  time: string;
  type: string;
  weightKg: number;
  note: string;
}

export interface TransactionItem {
  id: number;
  label: string;
  amount: number;
  date: string;
  category?: string;
  type: 'income' | 'expense';
}

export interface WeeklyImpactItem {
  code: string;
  label: string;
  kg: number;
  heightPercent: number;
}

export interface FloorImpactItem {
  floor: string;
  kg: number;
  plasticPercent: number;
}

// 1. DATA STATUS TONG PINTAR (status.html)
export const initialBinsData: BinItem[] = [
  {
    id: 1,
    floor: 'Lantai 1',
    status: 'Aman',
    weightKg: 4.1,
    ageHours: 12,
    tempC: 30,
    percent: 36,
    sensorActive: true,
    fixedSchedule: ''
  },
  {
    id: 2,
    floor: 'Lantai 2',
    status: 'Segera',
    weightKg: 7.9,
    ageHours: 30,
    tempC: 32,
    percent: 69,
    sensorActive: true,
    fixedSchedule: ''
  },
  {
    id: 3,
    floor: 'Lantai 3',
    status: 'Jemput',
    weightKg: 9.8,
    ageHours: 46,
    tempC: 34,
    percent: 85,
    sensorActive: true,
    fixedSchedule: ''
  },
  {
    id: 4,
    floor: 'Lantai 4',
    status: 'Aman',
    weightKg: 2.6,
    ageHours: 8,
    tempC: 30,
    percent: 23,
    sensorActive: true,
    fixedSchedule: ''
  },
  {
    id: 5,
    floor: 'Lantai 5',
    status: 'Sensor off',
    weightKg: 0,
    ageHours: 0,
    tempC: null,
    percent: 0,
    sensorActive: false,
    fixedSchedule: 'Jadwal tetap: jemput tiap 2 hari'
  }
];

// 2. DATA SENSOR PER LANTAI (catat.html)
export const sensorDataByFloor: Record<string, { active: boolean; weight: number }> = {
  'Lantai 1': { active: true, weight: 4.1 },
  'Lantai 2': { active: true, weight: 7.9 },
  'Lantai 3': { active: true, weight: 9.8 },
  'Lantai 4': { active: true, weight: 2.6 },
  'Lantai 5': { active: false, weight: 0 },
};

// RIWAYAT SETORAN TERSIMPAN AWAL (catat.html)
export const initialSavedHistory: SetoranRecord[] = [
  {
    id: 1,
    floor: 'Lantai 3',
    time: '07:45',
    totalWeight: 9.8,
    maggotKg: 7.6,
    komposterKg: 1.7,
    anorganikKg: 0.5,
    operator: 'Rina',
    photoUri: null,
  }
];

// 3. DATA PENGOLAHAN: DRUM & MAGGOT (olah.html)
export const initialDrumsData: DrumItem[] = [
  {
    id: 1,
    name: 'Drum 1',
    status: 'Fase Aktif',
    tempC: 54,
    humidityPercent: 62,
    days: 12,
    maturityPercent: 70
  },
  {
    id: 2,
    name: 'Drum 2',
    status: 'Pematangan',
    tempC: 38,
    humidityPercent: 50,
    days: 28,
    maturityPercent: 95
  }
];

export const initialMaggotStatus = {
  activeBioconversionKg: 85,
  prepupaHarvestEstimateKg: 14.5,
  kasgotReadyKg: 42,
  cycleDay: 14
};

export const initialHarvestLogs: HarvestLogItem[] = [
  {
    id: 1,
    time: '08:30',
    type: 'Panen prepupa / maggot segar',
    weightKg: 6.0,
    note: 'Kondisi gemuk & aktif'
  },
  {
    id: 2,
    time: 'Kemarin',
    type: 'Kasgot (pupuk bekas maggot)',
    weightKg: 40.0,
    note: 'Ayakan halus'
  }
];

// 4. DATA KAS & PENJUALAN (kas.html)
export const initialIncomes: TransactionItem[] = [
  { id: 1, label: 'Maggot segar 6 kg (lele)', amount: 42000, date: '18 Nov', type: 'income' },
  { id: 2, label: 'Prepupa maggot 10 kg', amount: 70000, date: '16 Nov', type: 'income' },
  { id: 3, label: 'Kasgot pupuk 40 kg', amount: 40000, date: '14 Nov', type: 'income' },
  { id: 4, label: 'Kardus & botol daur ulang', amount: 33500, date: '12 Nov', type: 'income' },
  { id: 5, label: 'Kompos matang 18 kg', amount: 27000, date: '10 Nov', type: 'income' }
];

export const initialExpenses: TransactionItem[] = [
  { id: 101, label: 'Beli dedak pakan maggot', amount: 25000, category: 'Pakan', date: '17 Nov', type: 'expense' },
  { id: 102, label: 'Sarung tangan & karung', amount: 18000, category: 'Alat', date: '11 Nov', type: 'expense' }
];

// 5. DATA DAMPAK LINGKUNGAN (dampak.html)
export const initialDampakData = {
  weekNumber: 6,
  totalOrganicKg: 560,
  preventedEmissionTon: '0,3',
  baselineKgPerWeek: 108,
  weeklyData: [
    { code: 'M1', label: 'Minggu 1', kg: 72, heightPercent: 66 },
    { code: 'M2', label: 'Minggu 2', kg: 84, heightPercent: 77 },
    { code: 'M3', label: 'Minggu 3', kg: 94, heightPercent: 86 },
    { code: 'M4', label: 'Minggu 4', kg: 97, heightPercent: 89 },
    { code: 'M5', label: 'Minggu 5', kg: 104, heightPercent: 95 },
    { code: 'M6', label: 'Minggu 6', kg: 109, heightPercent: 99 }
  ] as WeeklyImpactItem[],
  floorsWeekly: [
    { floor: 'Lantai 3', kg: 31, plasticPercent: 2 },
    { floor: 'Lantai 1', kg: 27, plasticPercent: 4 },
    { floor: 'Lantai 2', kg: 24, plasticPercent: 7 },
    { floor: 'Lantai 4', kg: 16, plasticPercent: 5 },
    { floor: 'Lantai 5', kg: 11, plasticPercent: 6 }
  ] as FloorImpactItem[]
};
