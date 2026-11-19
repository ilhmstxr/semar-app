import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';
import { RefreshCw, Clock } from 'lucide-react-native';
import { SEMAR_COLORS } from '@/constants/colors';
import StatusBarHeader from '@/components/common/StatusBarHeader';
import AppHeader from '@/components/common/AppHeader';
import BottomSheetModal from '@/components/common/BottomSheetModal';
import Toast from '@/components/common/Toast';
import RealtimeInfoCard from '@/components/common/RealtimeInfoCard';
import TopNotificationBanner from '@/components/common/TopNotificationBanner';
import { useBinStore } from '@/stores/useBinStore';
import { BinItem } from '@/constants/mockData';
import {
  requestNotificationPermission,
  triggerPickupPushNotification,
} from '@/services/notificationService';

export default function StatusScreen() {
  const {
    blockName,
    operator,
    bins,
    selectedBin,
    isDetailModalOpen,
    isEditBlockModalOpen,
    isLoading,
    fetchBins,
    setBlockName,
    setOperator,
    openDetailModal,
    closeDetailModal,
    openEditBlockModal,
    closeEditBlockModal,
    markPickedUp,
    refreshSensor,
  } = useBinStore();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [tempBlock, setTempBlock] = useState(blockName);
  const [tempOperator, setTempOperator] = useState(operator);

  // State untuk notifikasi push jemput di atas
  const [isTopNotifVisible, setIsTopNotifVisible] = useState(false);
  const notifiedBinIdRef = useRef<number | null>(null);

  // Minta izin notifikasi perangkat saat pertama kali dimuat
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Live fetching setiap 30 detik dari IoT Database (background silent)
  useEffect(() => {
    fetchBins(false);

    const interval = setInterval(() => {
      fetchBins(true); // refresh live per 30 detik
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchBins]);

  // Cari tong yang berstatus 'Jemput' untuk notifikasi push di atas
  const jemputBin = bins.find((b) => b.status === 'Jemput');

  // Trigger push notification bila terdapat tong berstatus Jemput
  useEffect(() => {
    if (jemputBin) {
      setIsTopNotifVisible(true);

      // Kirim push notification ke status bar HP jika belum terkirim untuk tong ini
      if (notifiedBinIdRef.current !== jemputBin.id) {
        notifiedBinIdRef.current = jemputBin.id;
        triggerPickupPushNotification(jemputBin.floor, jemputBin.weightKg, jemputBin.percent);
      }
    } else {
      setIsTopNotifVisible(false);
      notifiedBinIdRef.current = null;
    }
  }, [jemputBin]);

  const handleManualRefresh = async () => {
    await refreshSensor();
    setToastMsg('Data sensor tong pintar berhasil diperbarui (Live)');
  };

  const handleSaveBlock = () => {
    setBlockName(tempBlock);
    setOperator(tempOperator);
    closeEditBlockModal();
    setToastMsg('Data blok & operator berhasil diperbarui');
  };

  const handlePickUp = async (binId: number) => {
    await markPickedUp(binId);
    setIsTopNotifVisible(false);
    notifiedBinIdRef.current = null;
    setToastMsg('Tong berhasil ditandai sudah dijemput & sensor direset');
  };

  return (
    <View style={styles.container}>
      <StatusBarHeader />
      <AppHeader
        subtitle={`Blok ${blockName} · Operator: ${operator}`}
        title="Status Tong Pintar"
        onSubtitlePress={openEditBlockModal}
        rightAction={{
          label: '',
          icon: <RefreshCw size={17} color={SEMAR_COLORS.white} />,
          onPress: handleManualRefresh,
        }}
      />

      {/* 4. Notifikasi Push Muncul di Atas untuk Keperluan Mengambil / Jemput */}
      {jemputBin && isTopNotifVisible && (
        <TopNotificationBanner
          visible={isTopNotifVisible}
          title={`Perlu Dijemput: ${jemputBin.floor}!`}
          message={`Sampah telah mencapai ${jemputBin.weightKg} kg (${jemputBin.percent}% penuh). Segera ambil untuk proses pemilahan.`}
          onPress={() => openDetailModal(jemputBin)}
          onClose={() => setIsTopNotifVisible(false)}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleManualRefresh}
            colors={[SEMAR_COLORS.primary]}
          />
        }
      >
        {/* 2. Card Waktu Realtime Sekarang & Operator (Di Bawah Nav Atas) */}
        <RealtimeInfoCard />

        {/* Daftar Kartu Status Lantai (Alert banner lama dihapus) */}
        <View style={styles.binsList}>
          {bins.map((bin) => {
            const isFull = bin.status === 'Jemput';
            const isWarning = bin.status === 'Segera';
            const isOff = bin.status === 'Sensor off';

            const badgeBg = isFull ? SEMAR_COLORS.redBadge : isWarning ? SEMAR_COLORS.amberBadge : isOff ? '#F3F4F6' : SEMAR_COLORS.primaryLight;
            const badgeColor = isFull ? SEMAR_COLORS.statusJemput : isWarning ? SEMAR_COLORS.statusSegera : isOff ? SEMAR_COLORS.statusOff : SEMAR_COLORS.statusAman;

            return (
              <TouchableOpacity
                key={bin.id}
                style={styles.binCard}
                activeOpacity={0.7}
                onPress={() => openDetailModal(bin)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.floorRow}>
                    <Text style={styles.floorTitle}>{bin.floor}</Text>
                    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.badgeText, { color: badgeColor }]}>{bin.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.weightText}>{isOff ? '-' : `${bin.weightKg} kg`}</Text>
                </View>

                {/* Progress Bar Kapasitas */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${bin.percent}%`,
                        backgroundColor: badgeColor,
                      },
                    ]}
                  />
                </View>

                {/* Info Bawah */}
                <View style={styles.cardFooter}>
                  {isOff ? (
                    <Text style={styles.footerNote}>{bin.fixedSchedule || 'Sensor nonaktif'}</Text>
                  ) : (
                    <>
                      <View style={styles.footerItem}>
                        <Clock size={13} color={SEMAR_COLORS.textMuted} />
                        <Text style={styles.footerItemText}>{bin.ageHours} jam</Text>
                      </View>
                      <View style={styles.footerItem}>
                        <Text style={styles.footerItemText}>Suhu: {bin.tempC !== null && bin.tempC !== undefined ? `${bin.tempC}°C` : '-'}</Text>
                      </View>
                      <Text style={styles.percentText}>{bin.percent}% penuh</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Modal Detail Tong & Aksi Jemput */}
      {selectedBin && (
        <BottomSheetModal
          visible={isDetailModalOpen}
          onClose={closeDetailModal}
          title={`Detail ${selectedBin.floor}`}
          subtitle="Informasi status sensor & tindakan penjemputan"
        >
          <View style={styles.modalBody}>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalLabel}>Status Tong</Text>
              <Text style={[styles.modalVal, { fontWeight: '700' }]}>{selectedBin.status}</Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalLabel}>Bobot Saat Ini</Text>
              <Text style={styles.modalVal}>{selectedBin.weightKg} kg</Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalLabel}>Kapasitas Terisi</Text>
              <Text style={styles.modalVal}>{selectedBin.percent}%</Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalLabel}>Waktu Simpan</Text>
              <Text style={styles.modalVal}>{selectedBin.ageHours} jam</Text>
            </View>
            {selectedBin.tempC !== null && selectedBin.tempC !== undefined && (
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Suhu Sensor</Text>
                <Text style={styles.modalVal}>{selectedBin.tempC}°C</Text>
              </View>
            )}

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={closeDetailModal}>
                <Text style={styles.secondaryBtnText}>Tutup</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => handlePickUp(selectedBin.id)}
              >
                <Text style={styles.primaryBtnText}>Tandai Dijemput</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetModal>
      )}

      {/* Modal Edit Nama Blok & Operator */}
      <BottomSheetModal
        visible={isEditBlockModalOpen}
        onClose={closeEditBlockModal}
        title="Ubah Blok & Operator"
        subtitle="Sesuaikan identitas operasional harian"
      >
        <View style={styles.modalBody}>
          <Text style={styles.inputLabel}>Nama Blok</Text>
          <TextInput
            style={styles.textInput}
            value={tempBlock}
            onChangeText={setTempBlock}
            placeholder="Contoh: Blok A"
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Nama Operator</Text>
          <TextInput
            style={styles.textInput}
            value={tempOperator}
            onChangeText={setTempOperator}
            placeholder="Contoh: Rina"
          />

          <View style={[styles.modalActionRow, { marginTop: 20 }]}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={closeEditBlockModal}>
              <Text style={styles.secondaryBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveBlock}>
              <Text style={styles.primaryBtnText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetModal>

      <Toast message={toastMsg} onHide={() => setToastMsg(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMAR_COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  binsList: {
    gap: 12,
  },
  binCard: {
    backgroundColor: SEMAR_COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  floorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  weightText: {
    fontSize: 16,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerItemText: {
    fontSize: 12,
    color: SEMAR_COLORS.textMuted,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600',
    color: SEMAR_COLORS.textDark,
  },
  footerNote: {
    fontSize: 12,
    color: SEMAR_COLORS.textMuted,
    fontStyle: 'italic',
  },
  modalBody: {
    gap: 10,
    paddingTop: 8,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalLabel: {
    fontSize: 14,
    color: SEMAR_COLORS.textMuted,
  },
  modalVal: {
    fontSize: 14,
    color: SEMAR_COLORS.textDark,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: SEMAR_COLORS.textDark,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: SEMAR_COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: SEMAR_COLORS.white,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: SEMAR_COLORS.textMuted,
  },
  textInput: {
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 4,
    color: SEMAR_COLORS.textDark,
    backgroundColor: '#FAFAFA',
  },
});
