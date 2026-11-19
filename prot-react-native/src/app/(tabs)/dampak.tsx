import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Download, TrendingUp, Award, Leaf, ShieldCheck } from 'lucide-react-native';
import { SEMAR_COLORS } from '@/constants/colors';
import StatusBarHeader from '@/components/common/StatusBarHeader';
import AppHeader from '@/components/common/AppHeader';
import BottomSheetModal from '@/components/common/BottomSheetModal';
import Toast from '@/components/common/Toast';
import RealtimeInfoCard from '@/components/common/RealtimeInfoCard';
import { useDampakStore } from '@/stores/useDampakStore';

export default function DampakScreen() {
  const {
    weekNumber,
    totalOrganicKg,
    preventedEmissionTon,
    baselineKgPerWeek,
    weeklyData,
    floorsWeekly,
    selectedWeekCode,
    isDownloadModalOpen,
    setSelectedWeekCode,
    openDownloadModal,
    closeDownloadModal,
  } = useDampakStore();

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleDownload = () => {
    closeDownloadModal();
    setToastMsg('Laporan Ringkasan Dampak (.txt) berhasil diunduh ke perangkat');
  };

  const selectedWeek = weeklyData.find((w) => w.code === selectedWeekCode);

  return (
    <View style={styles.container}>
      <StatusBarHeader />
      <AppHeader
        subtitle={`Minggu ke-${weekNumber}`}
        title="Dampak Lingkungan"
        rightAction={{
          label: 'Unduh',
          icon: <Download size={16} color={SEMAR_COLORS.white} />,
          onPress: openDownloadModal,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Waktu Realtime Sekarang & Operator */}
        <RealtimeInfoCard />
        {/* 1. Dua Kartu Metrik Utama */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconBox}>
              <Leaf size={18} color={SEMAR_COLORS.primary} />
            </View>
            <Text style={styles.kpiValue}>{totalOrganicKg} kg</Text>
            <Text style={styles.kpiLabel}>Organik Diolah</Text>
            <Text style={styles.kpiSub}>tidak terbuang ke TPA</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#E0F2FE' }]}>
              <ShieldCheck size={18} color="#0284C7" />
            </View>
            <Text style={[styles.kpiValue, { color: '#0284C7' }]}>{preventedEmissionTon} ton</Text>
            <Text style={styles.kpiLabel}>Emisi Dicegah</Text>
            <Text style={styles.kpiSub}>setara CO2e (standar KLHK)</Text>
          </View>
        </View>

        {/* 2. Visualisasi Grafik Batang Mingguan */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Tren Pengurangan Organik Mingguan</Text>
            {selectedWeek && (
              <View style={styles.selectedPill}>
                <Text style={styles.selectedPillText}>
                  {selectedWeek.label}: {selectedWeek.kg} kg
                </Text>
              </View>
            )}
          </View>

          <View style={styles.chartCard}>
            {/* Garis Batas Baseline Merah */}
            <View style={styles.baselineRow}>
              <View style={styles.baselineLine} />
              <Text style={styles.baselineText}>Batas awal: {baselineKgPerWeek} kg</Text>
            </View>

            {/* Area Batang */}
            <View style={styles.barsContainer}>
              {weeklyData.map((item) => {
                const isSelected = selectedWeekCode === item.code;
                const isExceedBaseline = item.kg >= baselineKgPerWeek;

                return (
                  <TouchableOpacity
                    key={item.code}
                    style={styles.barColumn}
                    activeOpacity={0.8}
                    onPress={() => setSelectedWeekCode(item.code)}
                  >
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${item.heightPercent}%`,
                            backgroundColor: isSelected
                              ? '#15803D'
                              : isExceedBaseline
                              ? SEMAR_COLORS.primary
                              : '#86EFAC',
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, isSelected && styles.barLabelActive]}>
                      {item.code}
                    </Text>
                    <Text style={styles.barKg}>{item.kg}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 3. Peringkat Pemilahan Lantai */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontribusi Pemilahan per Lantai</Text>
          <View style={styles.rankingContainer}>
            {floorsWeekly.map((item, index) => {
              const isFirst = index === 0;
              return (
                <View key={item.floor} style={styles.rankCard}>
                  <View style={[styles.rankBadge, isFirst && styles.rankBadgeFirst]}>
                    <Text style={[styles.rankBadgeText, isFirst && styles.rankBadgeTextFirst]}>
                      #{index + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rankFloorTitle}>{item.floor}</Text>
                    <Text style={styles.rankFloorSub}>
                      Tingkat kemurnian: {100 - item.plasticPercent}% ({item.plasticPercent}% residu plastik)
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.rankWeight}>{item.kg} kg</Text>
                    <Text style={styles.rankWeightLabel}>terselamatkan</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Modal Unduh Ringkasan Laporan */}
      <BottomSheetModal
        visible={isDownloadModalOpen}
        onClose={closeDownloadModal}
        title="Unduh Laporan Dampak"
        subtitle="Simpan data pencapaian ekonomi sirkular lingkungan"
      >
        <View style={{ gap: 12, paddingTop: 4 }}>
          <View style={styles.summaryDownloadCard}>
            <Text style={styles.summaryTitle}>Laporan SEMAR - Minggu ke-{weekNumber}</Text>
            <Text style={styles.summaryText}>• Total Organik Diolah: {totalOrganicKg} kg</Text>
            <Text style={styles.summaryText}>• Emisi Karbon Dicegah: {preventedEmissionTon} ton CO2e</Text>
            <Text style={styles.summaryText}>• Lantai Paling Aktif: Lantai 3 (31 kg)</Text>
            <Text style={styles.summaryText}>• Rata-rata kemurnian pilah: 95.2%</Text>
          </View>

          <View style={styles.modalActionRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={closeDownloadModal}>
              <Text style={styles.secondaryBtnText}>Tutup</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleDownload}>
              <Text style={styles.primaryBtnText}>Unduh File (.txt)</Text>
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
    paddingBottom: 32,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: SEMAR_COLORS.cardBg,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
  },
  kpiIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: SEMAR_COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: SEMAR_COLORS.primary,
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 11,
    color: SEMAR_COLORS.textMuted,
    marginTop: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedPill: {
    backgroundColor: SEMAR_COLORS.primaryLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  selectedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: SEMAR_COLORS.primary,
  },
  chartCard: {
    backgroundColor: SEMAR_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
  },
  baselineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  baselineLine: {
    flex: 1,
    height: 1,
    borderWidth: 0.8,
    borderColor: '#DC2626',
    borderStyle: 'dashed',
  },
  baselineText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#DC2626',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 24,
    height: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: SEMAR_COLORS.textMuted,
    marginTop: 6,
  },
  barLabelActive: {
    color: SEMAR_COLORS.primary,
    fontWeight: '800',
  },
  barKg: {
    fontSize: 9.5,
    color: '#9CA3AF',
    marginTop: 1,
  },
  rankingContainer: {
    gap: 8,
    marginTop: 8,
  },
  rankCard: {
    backgroundColor: SEMAR_COLORS.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeFirst: {
    backgroundColor: '#FEF3C7',
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  rankBadgeTextFirst: {
    color: '#B45309',
  },
  rankFloorTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  rankFloorSub: {
    fontSize: 11,
    color: SEMAR_COLORS.textMuted,
    marginTop: 1,
  },
  rankWeight: {
    fontSize: 14,
    fontWeight: '700',
    color: SEMAR_COLORS.primary,
  },
  rankWeightLabel: {
    fontSize: 10,
    color: SEMAR_COLORS.textMuted,
  },
  summaryDownloadCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12,
    color: '#4B5563',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
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
});
