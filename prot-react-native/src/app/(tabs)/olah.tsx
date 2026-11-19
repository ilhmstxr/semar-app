import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { PlusCircle, RotateCw, Sparkles, Thermometer, Droplets, Calendar, Trash2 } from 'lucide-react-native';
import { SEMAR_COLORS } from '@/constants/colors';
import StatusBarHeader from '@/components/common/StatusBarHeader';
import AppHeader from '@/components/common/AppHeader';
import BottomSheetModal from '@/components/common/BottomSheetModal';
import Toast from '@/components/common/Toast';
import RealtimeInfoCard from '@/components/common/RealtimeInfoCard';
import { useOlahStore } from '@/stores/useOlahStore';

const HARVEST_TYPES = [
  'Panen prepupa / maggot segar',
  'Maggot kering (oven surya)',
  'Kasgot (pupuk bekas maggot)',
  'Kompos matang (drum komposter)',
];

export default function OlahScreen() {
  const {
    drums,
    maggotStatus,
    harvestLogs,
    isHarvestModalOpen,
    isLogModalOpen,
    openHarvestModal,
    closeHarvestModal,
    openLogModal,
    closeLogModal,
    addHarvestLog,
    deleteHarvestLog,
  } = useOlahStore();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState(HARVEST_TYPES[0]);
  const [harvestWeightStr, setHarvestWeightStr] = useState('2,5');
  const [harvestNote, setHarvestNote] = useState('');

  const handleStirDrum = (drumName: string) => {
    setToastMsg(`${drumName} berhasil diaduk. Sirkulasi udara terbarui!`);
  };

  const handleSaveHarvest = () => {
    const weight = parseFloat(harvestWeightStr.replace(',', '.')) || 0;
    if (weight <= 0) {
      setToastMsg('Masukkan berat panen yang valid');
      return;
    }
    addHarvestLog(selectedType, weight, harvestNote);
    setToastMsg(`Hasil panen ${weight} kg berhasil disimpan`);
    setHarvestWeightStr('2,5');
    setHarvestNote('');
  };

  return (
    <View style={styles.container}>
      <StatusBarHeader />
      <AppHeader
        subtitle="Pengolahan"
        title="Maggot & Komposter"
        rightAction={{
          label: 'Panen',
          count: harvestLogs.length,
          onPress: openLogModal,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Waktu Realtime Sekarang & Operator */}
        <RealtimeInfoCard />
        {/* Tombol Aksi Cepat Tambah Panen */}
        <TouchableOpacity
          style={styles.quickAddBtn}
          activeOpacity={0.85}
          onPress={openHarvestModal}
        >
          <PlusCircle size={18} color={SEMAR_COLORS.white} />
          <Text style={styles.quickAddBtnText}>Catat Hasil Panen Baru</Text>
        </TouchableOpacity>

        {/* 1. Status Drum Komposter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Drum Komposter (2 Unit)</Text>
          <View style={styles.drumsContainer}>
            {drums.map((drum) => (
              <View key={drum.id} style={styles.drumCard}>
                <View style={styles.drumCardHeader}>
                  <View>
                    <Text style={styles.drumName}>{drum.name}</Text>
                    <Text style={styles.drumStatusBadge}>{drum.status}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.stirBtn}
                    activeOpacity={0.7}
                    onPress={() => handleStirDrum(drum.name)}
                  >
                    <RotateCw size={12} color={SEMAR_COLORS.primary} />
                    <Text style={styles.stirBtnText}>Aduk</Text>
                  </TouchableOpacity>
                </View>

                {/* Sensor Kompos */}
                <View style={styles.drumStatsRow}>
                  <View style={styles.drumStatItem}>
                    <Thermometer size={14} color="#EA580C" />
                    <Text style={styles.drumStatText}>{drum.tempC}°C</Text>
                  </View>
                  <View style={styles.drumStatItem}>
                    <Droplets size={14} color="#0284C7" />
                    <Text style={styles.drumStatText}>{drum.humidityPercent}%</Text>
                  </View>
                  <View style={styles.drumStatItem}>
                    <Calendar size={14} color="#4B5563" />
                    <Text style={styles.drumStatText}>Hari ke-{drum.days}</Text>
                  </View>
                </View>

                {/* Progress Kematangan */}
                <View style={{ marginTop: 10 }}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Kematangan Kompos</Text>
                    <Text style={styles.progressVal}>{drum.maturityPercent}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${drum.maturityPercent}%`,
                          backgroundColor: drum.maturityPercent > 90 ? '#16A34A' : '#EAB308',
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Status Lemari Maggot BSF */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biokonversi Maggot BSF</Text>
          <View style={styles.maggotCard}>
            <View style={styles.maggotHeader}>
              <View style={styles.maggotIconBox}>
                <Sparkles size={20} color={SEMAR_COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.maggotTitle}>Siklus Biokonversi Aktif</Text>
                <Text style={styles.maggotSub}>Hari ke-{maggotStatus.cycleDay} · Siap panen berkala</Text>
              </View>
            </View>

            <View style={styles.maggotGrid}>
              <View style={styles.maggotGridItem}>
                <Text style={styles.maggotGridLabel}>Organik Diurai</Text>
                <Text style={styles.maggotGridVal}>{maggotStatus.activeBioconversionKg} kg</Text>
              </View>
              <View style={styles.maggotGridItem}>
                <Text style={styles.maggotGridLabel}>Prepupa Siap</Text>
                <Text style={[styles.maggotGridVal, { color: SEMAR_COLORS.primary }]}>
                  {maggotStatus.prepupaHarvestEstimateKg} kg
                </Text>
              </View>
              <View style={styles.maggotGridItem}>
                <Text style={styles.maggotGridLabel}>Kasgot Tersedia</Text>
                <Text style={styles.maggotGridVal}>{maggotStatus.kasgotReadyKg} kg</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal Catat Panen Baru */}
      <BottomSheetModal
        visible={isHarvestModalOpen}
        onClose={closeHarvestModal}
        title="Catat Hasil Panen"
        subtitle="Rekam hasil konversi kompos atau maggot"
      >
        <View style={{ gap: 12, paddingTop: 4 }}>
          <Text style={styles.inputLabel}>Jenis Hasil Panen</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {HARVEST_TYPES.map((type) => {
              const isSelected = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, isSelected && styles.typeChipActive]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={[styles.typeChipText, isSelected && styles.typeChipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View>
            <Text style={styles.inputLabel}>Berat Panen (kg)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="decimal-pad"
              value={harvestWeightStr}
              onChangeText={setHarvestWeightStr}
              placeholder="Contoh: 2,5"
            />
          </View>

          <View>
            <Text style={styles.inputLabel}>Catatan (opsional)</Text>
            <TextInput
              style={styles.textInput}
              value={harvestNote}
              onChangeText={setHarvestNote}
              placeholder="Contoh: Kualitas kering merata"
            />
          </View>

          <View style={[styles.modalActionRow, { marginTop: 10 }]}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={closeHarvestModal}>
              <Text style={styles.secondaryBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveHarvest}>
              <Text style={styles.primaryBtnText}>Simpan Panen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetModal>

      {/* Modal Riwayat Panen */}
      <BottomSheetModal
        visible={isLogModalOpen}
        onClose={closeLogModal}
        title="Riwayat Catatan Panen"
        subtitle={`Total tersimpan: ${harvestLogs.length} hasil panen`}
      >
        <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
          {harvestLogs.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada riwayat panen tercatat.</Text>
          ) : (
            harvestLogs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logCardTop}>
                  <Text style={styles.logType}>{log.type}</Text>
                  <Text style={styles.logTime}>{log.time}</Text>
                </View>
                <Text style={styles.logWeight}>{log.weightKg} kg</Text>
                {log.note ? <Text style={styles.logNote}>{log.note}</Text> : null}
                <TouchableOpacity
                  style={styles.logDeleteBtn}
                  onPress={() => deleteHarvestLog(log.id)}
                >
                  <Text style={styles.logDeleteText}>Hapus</Text>
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
  quickAddBtn: {
    backgroundColor: SEMAR_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  quickAddBtnText: {
    color: SEMAR_COLORS.white,
    fontSize: 14,
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
  drumsContainer: {
    gap: 12,
  },
  drumCard: {
    backgroundColor: SEMAR_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
  },
  drumCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  drumName: {
    fontSize: 16,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  drumStatusBadge: {
    fontSize: 11,
    color: SEMAR_COLORS.primary,
    fontWeight: '600',
  },
  stirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: SEMAR_COLORS.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  stirBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: SEMAR_COLORS.primary,
  },
  drumStatsRow: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 12,
  },
  drumStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  drumStatText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: SEMAR_COLORS.textDark,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: SEMAR_COLORS.textMuted,
  },
  progressVal: {
    fontSize: 11,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  maggotCard: {
    backgroundColor: SEMAR_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
  },
  maggotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  maggotIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SEMAR_COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maggotTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  maggotSub: {
    fontSize: 11.5,
    color: SEMAR_COLORS.textMuted,
  },
  maggotGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  maggotGridItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  maggotGridLabel: {
    fontSize: 11,
    color: SEMAR_COLORS.textMuted,
    marginBottom: 2,
  },
  maggotGridVal: {
    fontSize: 15,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  typeChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  typeChipActive: {
    backgroundColor: SEMAR_COLORS.primary,
  },
  typeChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: SEMAR_COLORS.white,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: SEMAR_COLORS.textDark,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  primaryBtn: {
    flex: 1.5,
    backgroundColor: SEMAR_COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: SEMAR_COLORS.white,
  },
  logCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  logType: {
    fontSize: 13,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  logTime: {
    fontSize: 11,
    color: SEMAR_COLORS.textMuted,
  },
  logWeight: {
    fontSize: 14,
    fontWeight: '700',
    color: SEMAR_COLORS.primary,
  },
  logNote: {
    fontSize: 11,
    color: SEMAR_COLORS.textMuted,
    marginTop: 2,
  },
  logDeleteBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  logDeleteText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: SEMAR_COLORS.textMuted,
    fontSize: 13,
    marginVertical: 20,
  },
});
