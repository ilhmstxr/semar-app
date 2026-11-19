import { ENDPOINTS, API_BASE_URL } from '../constants/api';

/**
 * Helper generic fetch dengan error handling standar
 */
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || `Request failed with status ${res.status}`);
    }

    return json;
  } catch (error: any) {
    console.warn(`[API Error] ${options.method || 'GET'} ${url}:`, error.message);
    throw error;
  }
}

// ==========================================
// 1. Modul Tong Sampah (IoT Telemetry)
// ==========================================

export async function fetchBinsApi() {
  return apiRequest<{ success: boolean; count: number; data: any[] }>(ENDPOINTS.BINS);
}

export async function fetchBinByIdApi(binId: number) {
  return apiRequest<{ success: boolean; data: any }>(`${ENDPOINTS.BINS}/${binId}`);
}

export async function markBinPickedUpApi(binId: number) {
  return apiRequest<{ success: boolean; message: string }>(`${ENDPOINTS.BINS}/${binId}/pickup`, {
    method: 'POST',
  });
}

export async function toggleBinSensorApi(binId: number) {
  return apiRequest<{ success: boolean; message: string; sensorActive: boolean }>(
    `${ENDPOINTS.BINS}/${binId}/toggle-sensor`,
    {
      method: 'PATCH',
    }
  );
}

// ==========================================
// 2. Modul Catat Setoran & Pemilahan
// ==========================================

export async function fetchSensorWeightsApi() {
  return apiRequest<{ success: boolean; data: Record<string, { active: boolean; weight: number }> }>(
    ENDPOINTS.CATAT_SENSOR_WEIGHTS
  );
}

export async function fetchSetoranHistoryApi() {
  return apiRequest<{ success: boolean; count: number; data: any[] }>(ENDPOINTS.CATAT_HISTORY);
}

export async function uploadSetoranPhotoApi(formData: FormData) {
  try {
    const res = await fetch(ENDPOINTS.CATAT_UPLOAD, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
        // Biarkan fetch membuat multipart header boundary sendiri
      },
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Gagal mengunggah foto');
    }
    return json;
  } catch (error: any) {
    console.warn('[API Error Upload Photo]:', error.message);
    throw error;
  }
}

export interface CreateSetoranPayload {
  floor: string;
  totalWeight: number;
  maggotKg: number;
  komposterKg: number;
  anorganikKg: number;
  corridorOdor: string;
  operator: string;
  photoUrl?: string | null;
}

export async function createSetoranApi(payload: CreateSetoranPayload) {
  return apiRequest<{ success: boolean; message: string; data: any }>(ENDPOINTS.CATAT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteSetoranApi(id: number) {
  return apiRequest<{ success: boolean; message: string }>(`${ENDPOINTS.CATAT}/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// 4. Modul Kas Keuangan (Pemasukan & Pengeluaran)
// ==========================================

export async function fetchKasSummaryApi() {
  return apiRequest<{
    success: boolean;
    summary: { totalIncome: number; totalExpense: number; balance: number };
    count: number;
    data: any[];
  }>(ENDPOINTS.KAS);
}

export interface CreateKasPayload {
  label: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  date?: string;
  operator?: string;
}

export async function createKasTransactionApi(payload: CreateKasPayload) {
  return apiRequest<{ success: boolean; message: string; data: any }>(ENDPOINTS.KAS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteKasTransactionApi(id: number) {
  return apiRequest<{ success: boolean; message: string }>(`${ENDPOINTS.KAS}/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Format relative photo URL ke full accessible URL
 */
export function getFullPhotoUrl(urlPath: string | null | undefined): string | null {
  if (!urlPath) return null;
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://') || urlPath.startsWith('file://')) {
    return urlPath;
  }
  return `${API_BASE_URL}${urlPath.startsWith('/') ? '' : '/'}${urlPath}`;
}
