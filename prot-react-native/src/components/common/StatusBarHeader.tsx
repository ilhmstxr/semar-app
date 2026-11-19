import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SEMAR_COLORS } from '@/constants/colors';

export default function StatusBarHeader() {
  const [currentTime, setCurrentTime] = useState('08.05');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hrs}.${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.statusBar}>
      <Text style={styles.timeText}>{currentTime}</Text>
      <View style={styles.rightIcons}>
        <Text style={styles.networkText}>4G</Text>
        {/* Signal Bars */}
        <View style={styles.signalContainer}>
          <View style={[styles.signalBar, { height: 4 }]} />
          <View style={[styles.signalBar, { height: 6 }]} />
          <View style={[styles.signalBar, { height: 8 }]} />
          <View style={[styles.signalBar, { height: 10 }]} />
        </View>
        {/* Battery Icon */}
        <View style={styles.batteryContainer}>
          <View style={styles.batteryBody}>
            <View style={styles.batteryFill} />
          </View>
          <View style={styles.batteryTip} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    backgroundColor: SEMAR_COLORS.primaryDark,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    color: SEMAR_COLORS.white,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  networkText: {
    color: SEMAR_COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  signalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 10,
    gap: 1.5,
  },
  signalBar: {
    width: 2.5,
    backgroundColor: SEMAR_COLORS.white,
    borderRadius: 0.5,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryBody: {
    width: 16,
    height: 9,
    borderWidth: 1.2,
    borderColor: SEMAR_COLORS.white,
    borderRadius: 2.5,
    padding: 1,
  },
  batteryFill: {
    width: '75%',
    height: '100%',
    backgroundColor: SEMAR_COLORS.white,
    borderRadius: 1,
  },
  batteryTip: {
    width: 1.5,
    height: 4,
    backgroundColor: SEMAR_COLORS.white,
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
  },
});
