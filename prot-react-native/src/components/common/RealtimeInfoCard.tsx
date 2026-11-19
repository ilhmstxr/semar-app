import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, User } from 'lucide-react-native';
import { SEMAR_COLORS } from '@/constants/colors';
import { useBinStore } from '@/stores/useBinStore';

export default function RealtimeInfoCard() {
  const { operator } = useBinStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTimeRealtime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    const secs = pad(d.getSeconds());
    return `${day} ${month} ${year} · ${hours}:${mins}:${secs} WIB`;
  };

  return (
    <View style={styles.infoCard}>
      <View style={styles.infoRow}>
        <View style={styles.labelRow}>
          <Clock size={12} color={SEMAR_COLORS.textMuted} />
          <Text style={styles.infoLabel}>Waktu Realtime Sekarang</Text>
        </View>
        <Text style={styles.infoValue}>{formatDateTimeRealtime(currentTime)}</Text>
      </View>
      <View style={[styles.infoRow, { alignItems: 'flex-end' }]}>
        <View style={styles.labelRow}>
          <User size={12} color={SEMAR_COLORS.textMuted} />
          <Text style={styles.infoLabel}>Petugas Operator</Text>
        </View>
        <Text style={styles.infoValue}>{operator || 'Rina'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: SEMAR_COLORS.cardBg,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    gap: 3,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: SEMAR_COLORS.textMuted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12.5,
    color: SEMAR_COLORS.textDark,
    fontWeight: '700',
  },
});
