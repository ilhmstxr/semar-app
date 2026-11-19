import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SEMAR_COLORS } from '@/constants/colors';

interface AppHeaderProps {
  subtitle?: string;
  title: string;
  onSubtitlePress?: () => void;
  rightAction?: {
    label: string;
    count?: number;
    icon?: React.ReactNode;
    onPress: () => void;
  };
}

export default function AppHeader({
  subtitle,
  title,
  onSubtitlePress,
  rightAction,
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        {subtitle ? (
          onSubtitlePress ? (
            <TouchableOpacity activeOpacity={0.7} onPress={onSubtitlePress}>
              <Text style={styles.subtitleText}>{subtitle}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.subtitleText}>{subtitle}</Text>
          )
        ) : <View />}

        {rightAction && (
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={rightAction.onPress}
          >
            {rightAction.icon ? (
              rightAction.icon
            ) : (
              <>
                <Text style={styles.actionBtnText}>{rightAction.label}</Text>
                {typeof rightAction.count === 'number' && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{rightAction.count}</Text>
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.titleText}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: SEMAR_COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  subtitleText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: SEMAR_COLORS.white,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: SEMAR_COLORS.white,
  },
  badge: {
    backgroundColor: SEMAR_COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: SEMAR_COLORS.primary,
  },
});
