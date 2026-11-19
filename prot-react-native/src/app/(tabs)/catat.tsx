import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Sliders,
  Camera,
  Trash2,
  CheckCircle2,
  ChevronRight,
  Layers,
  Clock,
  User,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react-native';
import { SEMAR_COLORS } from '@/constants/colors';
import StatusBarHeader from '@/components/common/StatusBarHeader';
import AppHeader from '@/components/common/AppHeader';
import BottomSheetModal from '@/components/common/BottomSheetModal';
import Toast from '@/components/common/Toast';
import { useCatatStore, OdorType } from '@/stores/useCatatStore';
import { useBinStore } from '@/stores/useBinStore';
import { uploadSetoranPhotoApi, getFullPhotoUrl } from '@/services/api';

const FLOORS = ['Lantai 1', 'Lantai 2', 'Lantai 3', 'Lantai 4', 'Lantai 5'];
const ODOR_OPTIONS: OdorType[] = ['Tidak', 'Sedikit tercium', 'Ya, menyengat'];

export default function CatatScreen() {
  const {
    selectedFloor,
    totalWeight,
    maggotKg,
    komposterKg,
    anorganikKg,
    corridorOdor,
    photoUri,
    photoUrl,
    history,
    isHistoryModalOpen,
    isEditSortingModalOpen,
    isLoading,
    isSaving,
    setSelectedFloor,
    setTotalWeight,
    setManualSorting,
    setCorridorOdor,
    setPhoto,
    fetchSensorWeights,
    fetchHistory,
    fetchFromSensor,
    saveSetoran,
    deleteHistoryItem,
    openHistoryModal,
    closeHistoryModal,
    openEditSortingModal,
    closeEditSortingModal,
  } = useCatatStore();

  const { operator } = useBinStore();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [inputWeightStr, setInputWeightStr] = useState(String(totalWeight).replace('.', ','));
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Realtime clock (Tahun, Bulan, Tanggal, Jam, Menit, Detik)
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchSensorWeights();
    fetchHistory();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchSensorWeights, fetchHistory]);

  // State untuk modal edit pemilahan manual
  const [editMaggot, setEditMaggot] = useState(String(maggotKg).replace('.', ','));
  const [editKomposter, setEditKomposter] = useState(String(komposterKg).replace('.', ','));
  const [editAnorganik, setEditAnorganik] = useState(String(anorganikKg).replace('.', ','));

  // Akumulasi pemilahan saat ini
  const accumulatedKg = Math.round((maggotKg + komposterKg + anorganikKg) * 10) / 10;
  const isAccumulationExceeded = totalWeight > 0 && accumulatedKg > totalWeight + 0.05;
  const remainingWeight = Math.max(0, Math.round((totalWeight - accumulatedKg) * 10) / 10);

  const handleFetchSensor = async () => {
    const res = await fetchFromSensor();
    setToastMsg(res.message);
    if (res.success) {
      setInputWeightStr(String(useCatatStore.getState().totalWeight).replace('.', ','));
    }
  };

  const handleWeightChange = (text: string) => {
    setInputWeightStr(text);
    const parsed = parseFloat(text.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      setTotalWeight(parsed);
    }
  };

  const handleOpenEditModal = () => {
    setEditMaggot(String(maggotKg).replace('.', ','));
    setEditKomposter(String(komposterKg).replace('.', ','));
    setEditAnorganik(String(anorganikKg).replace('.', ','));
    openEditSortingModal();
  };

  const handleSaveModalSorting = () => {
    const m = parseFloat(editMaggot.replace(',', '.')) || 0;
    const k = parseFloat(editKomposter.replace(',', '.')) || 0;
    const a = parseFloat(editAnorganik.replace(',', '.')) || 0;

    const res = setManualSorting(m, k, a);
    if (!res.success) {
      setToastMsg(res.message || 'Akumulasi melebihi berat masuk maksimal');
      return;
    }

    setToastMsg('Rincian hasil pemilahan berhasil disesuaikan');
  };

  // 2d: Ambil / unggah foto dengan max ukuran 5MB
  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin Ditolak', 'Mohon izinkan akses galeri untuk mengunggah foto setoran.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Validasi ukuran max 5MB (5 * 1024 * 1024 bytes)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Ukuran File Terlalu Besar', 'Maksimal ukuran file foto adalah 5MB.');
          return;
        }

        setIsUploadingPhoto(true);
        setPhoto(asset.uri, null);

        // Upload ke backend
        const formData = new FormData();
        const filename = asset.fileName || `setoran-${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('photo', {
          uri: asset.uri,
          name: filename,
          type,
        } as any);

        const uploadRes = await uploadSetoranPhotoApi(formData);
        if (uploadRes && uploadRes.photoUrl) {
          setPhoto(asset.uri, uploadRes.photoUrl);
          setToastMsg('Foto setoran berhasil diunggah (Max 5MB)');
        }
      }
    } catch (err: any) {
      console.warn('[Photo Upload]', err.message);
      // Fallback jika di emulator tetap simpan URI lokal
      setToastMsg('Foto tersimpan secara lokal');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null, null);
    setToastMsg('Foto dokumentasi dihapus');
  };

  // 2a: Simpan setoran dengan realtime timestamp & operator ke DB
  const handleSave = async () => {
    if (totalWeight <= 0) {
      setToastMsg('Masukkan berat setoran terlebih dahulu');
      return;
    }

    if (isAccumulationExceeded) {
      setToastMsg(`Akumulasi pemilahan (${accumulatedKg} kg) melebihi berat total (${totalWeight} kg)`);
      return;
    }

    const res = await saveSetoran(operator);
    setToastMsg(res.message);
    if (res.success) {
      setInputWeightStr('0');
    }
  };

  // Format tanggal & waktu realtime (Tahun, Bulan, Tanggal, Jam, Menit, Detik)
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

  // Modal preview accumulation state
  const modalM = parseFloat(editMaggot.replace(',', '.')) || 0;
  const modalK = parseFloat(editKomposter.replace(',', '.')) || 0;
  const modalA = parseFloat(editAnorganik.replace(',', '.')) || 0;
  const modalSum = Math.round((modalM + modalK + modalA) * 10) / 10;
  const isModalExceeded = totalWeight > 0 && modalSum > totalWeight + 0.05;

  return (
    <View style={styles.container}>
      <StatusBarHeader />
      <AppHeader
        subtitle="Formulir Operasional"
        title="Catat Setoran & Pilah"
        rightAction={{
          label: 'Riwayat',
          count: history.length,
          onPress: openHistoryModal,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header Informasi Operator & Realtime Timestamp (2a) */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={12} color={SEMAR_COLORS.textMuted} />
              <Text style={styles.infoLabel}>Waktu Realtime Sekarang</Text>
            </View>
            <Text style={styles.infoValue}>{formatDateTimeRealtime(currentTime)}</Text>
          </View>
          <View style={[styles.infoRow, { alignItems: 'flex-end' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <User size={12} color={SEMAR_COLORS.textMuted} />
              <Text style={styles.infoLabel}>Petugas Operator</Text>
            </View>
            <Text style={styles.infoValue}>{operator || 'Rina'}</Text>
          </View>
        </View>

        {/* 2. Pilihan Sumber Lantai */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pilih Sumber Lantai</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorScroll}>
            {FLOORS.map((f) => {
              const isSelected = selectedFloor === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.floorChip, isSelected && styles.floorChipActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedFloor(f)}
                >
                  <Text style={[styles.floorChipText, isSelected && styles.floorChipTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Input Berat Masuk & Tombol Ambil dari Sensor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Berat Total Masuk (kg)</Text>
          <View style={styles.weightInputRow}>
            <TextInput
              style={styles.weightInput}
              keyboardType="decimal-pad"
              value={inputWeightStr}
              onChangeText={handleWeightChange}
              placeholder="0,0"
            />
            <TouchableOpacity
              style={styles.sensorBtn}
              activeOpacity={0.8}
              onPress={handleFetchSensor}
            >
              <Text style={styles.sensorBtnText}>Ambil dari sensor</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Kartu Hasil Pemilahan & Akumulasi (2b) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Hasil Pemilahan Proporsional</Text>
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={handleOpenEditModal}
            >
              <Sliders size={13} color={SEMAR_COLORS.primary} />
              <Text style={styles.adjustBtnText}>Sesuaikan</Text>
            </TouchableOpacity>
          </View>

          {/* Bar Indikator Akumulasi vs Berat Masuk (2b) */}
          <View
            style={[
              styles.accumulationBanner,
              isAccumulationExceeded ? styles.accumulationBannerAlert : styles.accumulationBannerOk,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              {isAccumulationExceeded ? (
                <AlertCircle size={15} color="#DC2626" />
              ) : (
                <CheckCircle2 size={15} color="#16A34A" />
              )}
              <Text
                style={[
                  styles.accumulationText,
                  { color: isAccumulationExceeded ? '#B91C1C' : '#15803D' },
                ]}
              >
                Akumulasi: <Text style={{ fontWeight: '700' }}>{accumulatedKg} kg</Text> / Maksimal masuk:{' '}
                <Text style={{ fontWeight: '700' }}>{totalWeight} kg</Text>
              </Text>
            </View>
            {!isAccumulationExceeded && totalWeight > 0 && remainingWeight > 0 && (
              <Text style={styles.remainingText}>Sisa {remainingWeight} kg</Text>
            )}
          </View>

          <View style={styles.sortingCard}>
            <View style={styles.sortItem}>
              <View style={[styles.sortDot, { backgroundColor: '#16A34A' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sortName}>Organik Lemak / Daging (Pakan Maggot)</Text>
                <Text style={styles.sortDesc}>Sisa hewani, berminyak, sayur lunak</Text>
              </View>
              <Text style={styles.sortKg}>{maggotKg} kg</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.sortItem}>
              <View style={[styles.sortDot, { backgroundColor: '#CA8A04' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sortName}>Organik Berserat (Drum Komposter)</Text>
                <Text style={styles.sortDesc}>Kulit buah keras, daun kering, sisa sayur</Text>
              </View>
              <Text style={styles.sortKg}>{komposterKg} kg</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.sortItem}>
              <View style={[styles.sortDot, { backgroundColor: '#2563EB' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sortName}>Anorganik Terpilah (Daur Ulang)</Text>
                <Text style={styles.sortDesc}>Botol plastik, kardus, kaleng terselip</Text>
              </View>
              <Text style={styles.sortKg}>{anorganikKg} kg</Text>
            </View>
          </View>
        </View>

        {/* 5. Bau di Lorong? (2c) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bau di Lorong?</Text>
          <View style={styles.odorRow}>
            {ODOR_OPTIONS.map((opt) => {
              const isSelected = corridorOdor === opt;
              let activeColor = SEMAR_COLORS.primary;
              if (opt === 'Sedikit tercium') activeColor = '#D97706';
              if (opt === 'Ya, menyengat') activeColor = '#DC2626';

              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.odorChip,
                    isSelected && {
                      backgroundColor: activeColor,
                      borderColor: activeColor,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setCorridorOdor(opt)}
                >
                  <Text
                    style={[
                      styles.odorChipText,
                      isSelected && { color: SEMAR_COLORS.white, fontWeight: '700' },
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 6. Dokumentasi Foto (Max 5MB) (2c & 2d) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Dokumentasi Foto Bukti (Max 5MB)</Text>
            {photoUrl && <Text style={styles.photoPathBadge}>Tersimpan di DB</Text>}
          </View>

          <TouchableOpacity
            style={styles.photoBox}
            activeOpacity={0.8}
            onPress={handlePickPhoto}
            disabled={isUploadingPhoto}
          >
            {isUploadingPhoto ? (
              <View style={styles.photoLoadingRow}>
                <ActivityIndicator size="small" color={SEMAR_COLORS.primary} />
                <Text style={styles.photoEmptyText}>Mengunggah foto (maks. 5MB)...</Text>
              </View>
            ) : photoUri ? (
              <View style={styles.photoPreviewRow}>
                <Image
                  source={{ uri: getFullPhotoUrl(photoUrl) || photoUri }}
                  style={styles.thumbnail}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.photoAttachedText}>1 Foto Bukti Terlampir</Text>
                  <Text style={styles.photoSubText}>
                    {photoUrl ? photoUrl.split('/').pop() : 'Ukuran valid <= 5MB'}
                  </Text>
                  <Text style={styles.photoTapText}>Ketuk untuk mengganti</Text>
                </View>
                <TouchableOpacity
                  onPress={handleRemovePhoto}
                  style={{ padding: 6 }}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoEmptyRow}>
                <Camera size={20} color={SEMAR_COLORS.textMuted} />
                <Text style={styles.photoEmptyText}>Pilih / ambil foto setoran (Maksimal 5MB)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 7. Tombol Simpan Utama */}
        <TouchableOpacity
          style={[styles.submitBtn, isSaving && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={SEMAR_COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>Simpan Catatan Setoran</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Sesuaikan Hasil Pemilahan Manual (2b) */}
      <BottomSheetModal
        visible={isEditSortingModalOpen}
        onClose={closeEditSortingModal}
        title="Sesuaikan Hasil Pemilahan"
        subtitle="Alokasi bobot akumulasi dibatasi maksimal dari berat masuk"
      >
        <View style={{ gap: 12, paddingTop: 4 }}>
          {/* Status Akumulasi di Modal */}
          <View
            style={[
              styles.accumulationBanner,
              isModalExceeded ? styles.accumulationBannerAlert : styles.accumulationBannerOk,
            ]}
          >
            <Text
              style={[
                styles.accumulationText,
                { color: isModalExceeded ? '#B91C1C' : '#15803D' },
              ]}
            >
              Total Akumulasi: <Text style={{ fontWeight: '700' }}>{modalSum} kg</Text> / Maksimal masuk:{' '}
              <Text style={{ fontWeight: '700' }}>{totalWeight} kg</Text>
            </Text>
          </View>

          <View>
            <Text style={styles.modalInputLabel}>Organik Maggot (kg)</Text>
            <TextInput
              style={styles.modalTextInput}
              keyboardType="decimal-pad"
              value={editMaggot}
              onChangeText={setEditMaggot}
            />
          </View>
          <View>
            <Text style={styles.modalInputLabel}>Organik Komposter (kg)</Text>
            <TextInput
              style={styles.modalTextInput}
              keyboardType="decimal-pad"
              value={editKomposter}
              onChangeText={setEditKomposter}
            />
          </View>
          <View>
            <Text style={styles.modalInputLabel}>Anorganik Daur Ulang (kg)</Text>
            <TextInput
              style={styles.modalTextInput}
              keyboardType="decimal-pad"
              value={editAnorganik}
              onChangeText={setEditAnorganik}
            />
          </View>

          <View style={[styles.modalActionRow, { marginTop: 10 }]}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={closeEditSortingModal}>
              <Text style={styles.secondaryBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, isModalExceeded && { backgroundColor: '#EF4444' }]}
              onPress={handleSaveModalSorting}
            >
              <Text style={styles.primaryBtnText}>
                {isModalExceeded ? 'Melebihi Maksimal' : 'Terapkan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetModal>

      {/* Modal Riwayat Setoran */}
      <BottomSheetModal
        visible={isHistoryModalOpen}
        onClose={closeHistoryModal}
        title="Riwayat Setoran Tersimpan"
        subtitle={`Total tersimpan: ${history.length} catatan setoran di database`}
      >
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <ActivityIndicator size="small" color={SEMAR_COLORS.primary} style={{ marginVertical: 20 }} />
          ) : history.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada riwayat setoran tersimpan di database.</Text>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyCardTop}>
                  <Text style={styles.historyFloor}>{item.floor}</Text>
                  <Text style={styles.historyTime}>
                    {item.formattedDateTime || `${item.time} WIB`}
                  </Text>
                </View>
                <Text style={styles.historyWeight}>Total: {item.totalWeight} kg · Operator: {item.operator}</Text>
                <Text style={styles.historyDetail}>
                  Maggot: {item.maggotKg} kg · Kompos: {item.composterKg} kg · Anorganik: {item.anorganikKg} kg
                </Text>
                {item.corridorOdor && (
                  <Text style={styles.historyOdor}>Bau lorong: {item.corridorOdor}</Text>
                )}
                {item.photoUrl && (
                  <View style={styles.historyPhotoRow}>
                    <ImageIcon size={13} color={SEMAR_COLORS.primary} />
                    <Text style={styles.historyPhotoText} numberOfLines={1}>
                      Foto bukti: {item.photoUrl.split('/').pop()}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.historyDeleteBtn}
                  onPress={() => deleteHistoryItem(item.id)}
                >
                  <Text style={styles.historyDeleteText}>Hapus Catatan</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
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
    paddingBottom: 32,
  },
  infoCard: {
    backgroundColor: SEMAR_COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoRow: {
    gap: 3,
  },
  infoLabel: {
    fontSize: 11,
    color: SEMAR_COLORS.textMuted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: SEMAR_COLORS.textDark,
    fontWeight: '700',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: SEMAR_COLORS.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  adjustBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: SEMAR_COLORS.primary,
  },
  accumulationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  accumulationBannerOk: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  accumulationBannerAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  accumulationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  remainingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  floorScroll: {
    flexDirection: 'row',
  },
  floorChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: SEMAR_COLORS.cardBg,
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
    marginRight: 8,
  },
  floorChipActive: {
    backgroundColor: SEMAR_COLORS.primary,
    borderColor: SEMAR_COLORS.primary,
  },
  floorChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  floorChipTextActive: {
    color: SEMAR_COLORS.white,
    fontWeight: '700',
  },
  weightInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  weightInput: {
    flex: 1,
    backgroundColor: SEMAR_COLORS.cardBg,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  sensorBtn: {
    backgroundColor: SEMAR_COLORS.cardBg,
    borderWidth: 1.2,
    borderColor: SEMAR_COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: SEMAR_COLORS.primary,
  },
  sortingCard: {
    backgroundColor: SEMAR_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
    gap: 10,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sortName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  sortDesc: {
    fontSize: 11,
    color: SEMAR_COLORS.textMuted,
    marginTop: 1,
  },
  sortKg: {
    fontSize: 15,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  odorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  odorChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: SEMAR_COLORS.cardBg,
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  odorChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  photoPathBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: SEMAR_COLORS.primary,
    backgroundColor: SEMAR_COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  photoBox: {
    backgroundColor: SEMAR_COLORS.cardBg,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    padding: 14,
    borderStyle: 'dashed',
  },
  photoLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  photoEmptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  photoEmptyText: {
    fontSize: 13,
    color: SEMAR_COLORS.textMuted,
    fontWeight: '500',
  },
  photoPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  photoAttachedText: {
    fontSize: 13,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  photoSubText: {
    fontSize: 11,
    color: SEMAR_COLORS.textMuted,
    marginTop: 2,
  },
  photoTapText: {
    fontSize: 11,
    color: SEMAR_COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: SEMAR_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: SEMAR_COLORS.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: SEMAR_COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: SEMAR_COLORS.textMuted,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 4,
    color: SEMAR_COLORS.textDark,
    backgroundColor: '#FAFAFA',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
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
  emptyText: {
    textAlign: 'center',
    color: SEMAR_COLORS.textMuted,
    marginVertical: 24,
    fontSize: 13,
  },
  historyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyFloor: {
    fontSize: 14,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  historyTime: {
    fontSize: 11,
    color: SEMAR_COLORS.textMuted,
  },
  historyWeight: {
    fontSize: 13,
    fontWeight: '600',
    color: SEMAR_COLORS.primary,
    marginBottom: 2,
  },
  historyDetail: {
    fontSize: 11.5,
    color: '#4B5563',
  },
  historyOdor: {
    fontSize: 11,
    color: '#D97706',
    marginTop: 2,
    fontWeight: '500',
  },
  historyPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  historyPhotoText: {
    fontSize: 11,
    color: SEMAR_COLORS.primary,
  },
  historyDeleteBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  historyDeleteText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
});
