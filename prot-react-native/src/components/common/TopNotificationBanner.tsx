import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BellRing, X } from 'lucide-react-native';
import { SEMAR_COLORS } from '@/constants/colors';

interface TopNotificationBannerProps {
  visible: boolean;
  title: string;
  message: string;
  onPress?: () => void;
  onClose: () => void;
}

export default function TopNotificationBanner({
  visible,
  title,
  message,
  onPress,
  onClose,
}: TopNotificationBannerProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.bannerCard}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.iconCircle}>
          <BellRing size={18} color="#DC2626" />
        </View>

        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={styles.headerRow}>
            <Text style={styles.badgeText}>PEMBERITAHUAN PENJEMPUTAN</Text>
          </View>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.messageText} numberOfLines={2}>
            {message}
          </Text>
          <Text style={styles.actionPrompt}>Ketuk untuk melihat detail tong →</Text>
        </View>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  bannerCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#DC2626',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  headerRow: {
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 11.5,
    color: '#7F1D1D',
    lineHeight: 16,
  },
  actionPrompt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
  },
});
