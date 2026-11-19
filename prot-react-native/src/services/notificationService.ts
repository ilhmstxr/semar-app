import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set handler agar notifikasi tetap muncul di status bar atas saat aplikasi terbuka
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Minta izin notifikasi perangkat (Android 13+ & iOS)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('semar-alerts', {
        name: 'Pemberitahuan Penjemputan SEMAR',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#DC2626',
      });
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[Notification Permission]', err);
    return false;
  }
}

/**
 * Memicu Push Notification ke status bar atas HP
 */
export async function triggerPickupPushNotification(
  floor: string,
  weightKg: number,
  percent: number
) {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 SEMAR: Tong Perlu Dijemput!',
        body: `Tong di ${floor} telah terisi ${weightKg} kg (${percent}%). Segera ambil sampah untuk pemilahan.`,
        data: { floor, weightKg, percent },
        sound: true,
      },
      trigger: null, // tampilkan langsung detik ini juga
    });
  } catch (error) {
    console.warn('[Push Notification Error]', error);
  }
}
