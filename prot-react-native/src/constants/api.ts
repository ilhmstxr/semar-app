import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Deteksi otomatis IP host dev machine saat Expo dijalankan di HP fisik
 */
const getDevHostIp = (): string => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }
  return '192.168.110.77';
};

/**
 * Base URL untuk SEMAR Web Service API
 * - Jika web: http://localhost:5000
 * - Jika HP fisik: otomatis mengambil IP komputer dev (misal: 192.168.110.77:5000)
 * - Dapat dioverride secara eksplisit lewat env EXPO_PUBLIC_API_URL
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'web'
    ? 'http://localhost:5000'
    : `http://${getDevHostIp()}:5000`);

export const ENDPOINTS = {
  BINS: `${API_BASE_URL}/api/bins`,
  CATAT: `${API_BASE_URL}/api/catat`,
  CATAT_SENSOR_WEIGHTS: `${API_BASE_URL}/api/catat/sensor-weights`,
  CATAT_HISTORY: `${API_BASE_URL}/api/catat/history`,
  CATAT_UPLOAD: `${API_BASE_URL}/api/catat/upload`,
  KAS: `${API_BASE_URL}/api/kas`,
  UPLOADS: `${API_BASE_URL}/uploads`,
};
