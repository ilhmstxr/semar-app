import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { ArrowUpRight, ArrowDownLeft, Plus, CircleHelp } from 'lucide-react-native';
import { SEMAR_COLORS } from '@/constants/colors';
import StatusBarHeader from '@/components/common/StatusBarHeader';
import AppHeader from '@/components/common/AppHeader';
import BottomSheetModal from '@/components/common/BottomSheetModal';
import Toast from '@/components/common/Toast';
import RealtimeInfoCard from '@/components/common/RealtimeInfoCard';
import { useKasStore } from '@/stores/useKasStore';

export default function KasScreen() {
  const {
    incomes,
    expenses,
    summary,
    isLoading,
    isSaving,
    isAddModalOpen,
    isRulesModalOpen,
    isExpenseModalOpen,
    fetchKasData,
    openAddModal,
    closeAddModal,
    openRulesModal,
    closeRulesModal,
    openExpenseModal,
    closeExpenseModal,
    addIncome,
    addExpense,
    deleteTransaction,
  } = useKasStore();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'semua' | 'pemasukan' | 'pengeluaran'>('semua');

  // Ambil data kas dari DB saat layar dimuat
  useEffect(() => {
    fetchKasData();
  }, [fetchKasData]);

  // Input states untuk modal pemasukan
  const [incomeLabel, setIncomeLabel] = useState('');
  const [incomeAmountStr, setIncomeAmountStr] = useState('');

  // Input states untuk modal pengeluaran
  const [expenseLabel, setExpenseLabel] = useState('');
  const [expenseAmountStr, setExpenseAmountStr] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Pakan');

  // Hitung total dari summary store atau array fallback
  const totalIncome = summary?.totalIncome ?? incomes.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalExpense = summary?.totalExpense ?? expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const netBalance = summary?.balance ?? (totalIncome - totalExpense);

  const formatRupiah = (val?: number | null) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return `Rp${num.toLocaleString('id-ID')}`;
  };

  const handleSaveIncome = async () => {
    const amount = parseInt(incomeAmountStr.replace(/[^0-9]/g, ''), 10) || 0;
    if (!incomeLabel.trim() || amount <= 0) {
      setToastMsg('Mohon isi nama produk dan nominal penjualan');
      return;
    }
    const res = await addIncome(incomeLabel.trim(), amount);
    setToastMsg(res.message);
    setIncomeLabel('');
    setIncomeAmountStr('');
  };

  const handleSaveExpense = async () => {
    const amount = parseInt(expenseAmountStr.replace(/[^0-9]/g, ''), 10) || 0;
    if (!expenseLabel.trim() || amount <= 0) {
      setToastMsg('Mohon isi keperluan dan nominal pengeluaran');
      return;
    }
    const res = await addExpense(expenseLabel.trim(), amount, expenseCategory);
    setToastMsg(res.message);
    setExpenseLabel('');
    setExpenseAmountStr('');
  };

  const handleDelete = async (id: number, type: 'income' | 'expense') => {
    await deleteTransaction(id, type);
    setToastMsg('Transaksi berhasil dihapus');
  };

  // Gabungkan transaksi dan urutkan
  const allTransactions = [
    ...incomes.map((i) => ({ ...i, isIncome: true })),
    ...expenses.map((e) => ({ ...e, isIncome: false })),
  ].sort((a, b) => b.id - a.id);

  const filteredTransactions = allTransactions.filter((tx) => {
    if (activeTab === 'pemasukan') return tx.isIncome;
    if (activeTab === 'pengeluaran') return !tx.isIncome;
    return true;
  });

  return (
    <View style={styles.container}>
      <StatusBarHeader />
      <AppHeader
        subtitle="Kas kelompok · Database MySQL"
        title="Kas & Penjualan"
        rightAction={{
          label: 'Keluar',
          count: expenses.length,
          onPress: openExpenseModal,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchKasData}
            colors={[SEMAR_COLORS.primary]}
          />
        }
      >
        {/* Card Waktu Realtime Sekarang & Operator */}
        <RealtimeInfoCard />
        {/* 1. Kartu Saldo Kas Utama */}
        <TouchableOpacity
          style={styles.balanceCard}
          activeOpacity={0.9}
          onPress={openRulesModal}
        >
          <View style={styles.balanceCardHeader}>
            <Text style={styles.balanceLabel}>Saldo Kas Bersih</Text>
            <View style={styles.rulesHintRow}>
              <CircleHelp size={13} color={SEMAR_COLORS.primary} />
              <Text style={styles.rulesHintText}>Aturan Kas</Text>
            </View>
          </View>

          <Text style={styles.balanceValue}>{formatRupiah(netBalance)}</Text>

          <View style={styles.balanceStatsRow}>
            <View style={styles.balanceStatItem}>
              <View style={[styles.arrowCircle, { backgroundColor: '#DCFCE7' }]}>
                <ArrowDownLeft size={14} color="#16A34A" />
              </View>
              <View>
                <Text style={styles.statLabel}>Total Masuk</Text>
                <Text style={styles.statValueGreen}>{formatRupiah(totalIncome)}</Text>
              </View>
            </View>

            <View style={styles.balanceStatItem}>
              <View style={[styles.arrowCircle, { backgroundColor: '#FEE2E2' }]}>
                <ArrowUpRight size={14} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.statLabel}>Total Keluar</Text>
                <Text style={styles.statValueRed}>{formatRupiah(totalExpense)}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* 2. Dua Tombol Aksi Cepat */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            activeOpacity={0.85}
            onPress={openAddModal}
          >
            <Plus size={16} color={SEMAR_COLORS.white} />
            <Text style={styles.actionBtnPrimaryText}>Catat Penjualan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSecondary}
            activeOpacity={0.85}
            onPress={openExpenseModal}
          >
            <Plus size={16} color="#DC2626" />
            <Text style={styles.actionBtnSecondaryText}>Catat Pengeluaran</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Filter Mutasi Tab */}
        <View style={styles.filterTabRow}>
          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'semua' && styles.filterTabActive]}
            onPress={() => setActiveTab('semua')}
          >
            <Text style={[styles.filterTabText, activeTab === 'semua' && styles.filterTabTextActive]}>
              Semua ({allTransactions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'pemasukan' && styles.filterTabActive]}
            onPress={() => setActiveTab('pemasukan')}
          >
            <Text style={[styles.filterTabText, activeTab === 'pemasukan' && styles.filterTabTextActive]}>
              Masuk ({incomes.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'pengeluaran' && styles.filterTabActive]}
            onPress={() => setActiveTab('pengeluaran')}
          >
            <Text style={[styles.filterTabText, activeTab === 'pengeluaran' && styles.filterTabTextActive]}>
              Keluar ({expenses.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Daftar Transaksi */}
        <View style={styles.txListContainer}>
          {filteredTransactions.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada transaksi di database.</Text>
          ) : (
            filteredTransactions.map((tx) => (
              <View
                key={`${tx.type || (tx.isIncome ? 'income' : 'expense')}-${tx.id}`}
                style={styles.txCard}
              >
                <View style={[styles.txIconBox, { backgroundColor: tx.isIncome ? '#DCFCE7' : '#FEE2E2' }]}>
                  {tx.isIncome ? (
                    <ArrowDownLeft size={16} color="#16A34A" />
                  ) : (
                    <ArrowUpRight size={16} color="#DC2626" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txLabel}>{tx.label}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.txAmount, { color: tx.isIncome ? '#16A34A' : '#DC2626' }]}>
                    {tx.isIncome ? `+${formatRupiah(tx.amount || 0)}` : `-${formatRupiah(tx.amount || 0)}`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDelete(tx.id, tx.isIncome ? 'income' : 'expense')}
                  >
                    <Text style={styles.txDeleteText}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal Tambah Penjualan */}
      <BottomSheetModal
        visible={isAddModalOpen}
        onClose={closeAddModal}
        title="Catat Penjualan Baru"
        subtitle="Pemasukan dari hasil panen atau daur ulang ke database"
      >
        <View style={{ gap: 12, paddingTop: 4 }}>
          <View>
            <Text style={styles.inputLabel}>Nama Penjualan / Produk</Text>
            <TextInput
              style={styles.textInput}
              value={incomeLabel}
              onChangeText={setIncomeLabel}
              placeholder="Contoh: Maggot segar 5 kg"
            />
          </View>
          <View>
            <Text style={styles.inputLabel}>Nominal Diterima (Rp)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              value={incomeAmountStr}
              onChangeText={setIncomeAmountStr}
              placeholder="Contoh: 35000"
            />
          </View>

          <View style={[styles.modalActionRow, { marginTop: 10 }]}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={closeAddModal}>
              <Text style={styles.secondaryBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSaveIncome}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={SEMAR_COLORS.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Simpan Pemasukan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetModal>

      {/* Modal Tambah Pengeluaran */}
      <BottomSheetModal
        visible={isExpenseModalOpen}
        onClose={closeExpenseModal}
        title="Catat Pengeluaran Operasional"
        subtitle="Biaya pakan, wadah, atau perlengkapan ke database"
      >
        <View style={{ gap: 12, paddingTop: 4 }}>
          <View>
            <Text style={styles.inputLabel}>Keperluan / Nama Barang</Text>
            <TextInput
              style={styles.textInput}
              value={expenseLabel}
              onChangeText={setExpenseLabel}
              placeholder="Contoh: Karung goni & dedak pakan"
            />
          </View>
          <View>
            <Text style={styles.inputLabel}>Nominal Biaya (Rp)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              value={expenseAmountStr}
              onChangeText={setExpenseAmountStr}
              placeholder="Contoh: 20000"
            />
          </View>
          <View>
            <Text style={styles.inputLabel}>Kategori Pengeluaran</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              {['Pakan', 'Alat', 'Lainnya'].map((cat) => {
                const isSelected = expenseCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipActive,
                    ]}
                    onPress={() => setExpenseCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.modalActionRow, { marginTop: 10 }]}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={closeExpenseModal}>
              <Text style={styles.secondaryBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: '#DC2626' }, isSaving && { opacity: 0.7 }]}
              onPress={handleSaveExpense}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={SEMAR_COLORS.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Simpan Pengeluaran</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetModal>

      {/* Modal Aturan Kas Paguyuban */}
      <BottomSheetModal
        visible={isRulesModalOpen}
        onClose={closeRulesModal}
        title="Aturan Pembagian Kas"
        subtitle="Ketentuan alokasi dana paguyuban SEMAR"
      >
        <View style={styles.rulesContainer}>
          <View style={styles.ruleItem}>
            <View style={styles.ruleBadge}>
              <Text style={styles.ruleBadgeText}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ruleTitle}>Upah Petugas Operator</Text>
              <Text style={styles.ruleDesc}>
                Dibayarkan prioritas pertama dari hasil penjualan harian maggot & kasgot.
              </Text>
            </View>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleBadge}>
              <Text style={styles.ruleBadgeText}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ruleTitle}>Perawatan Drum & Biopond</Text>
              <Text style={styles.ruleDesc}>
                Alokasi penggantian oli pemutar komposter, jarring lalat BSF, dan perbaikan sensor.
              </Text>
            </View>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleBadge}>
              <Text style={styles.ruleBadgeText}>3</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ruleTitle}>Cadangan Kas & Kas Kelompok</Text>
              <Text style={styles.ruleDesc}>
                Sisa bersih disetor ke bendahara lingkungan untuk kegiatan paguyuban.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={closeRulesModal}>
            <Text style={styles.primaryBtnText}>Mengerti</Text>
          </TouchableOpacity>
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
  balanceCard: {
    backgroundColor: SEMAR_COLORS.cardBg,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  balanceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: SEMAR_COLORS.textMuted,
  },
  rulesHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rulesHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: SEMAR_COLORS.primary,
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: '800',
    color: SEMAR_COLORS.textDark,
    marginBottom: 16,
  },
  balanceStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  balanceStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 10.5,
    color: SEMAR_COLORS.textMuted,
  },
  statValueGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  statValueRed: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: SEMAR_COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: SEMAR_COLORS.white,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  filterTabRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: SEMAR_COLORS.white,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: SEMAR_COLORS.textDark,
    fontWeight: '700',
  },
  txListContainer: {
    gap: 10,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEMAR_COLORS.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
    gap: 12,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  txDate: {
    fontSize: 11,
    color: SEMAR_COLORS.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  txDeleteText: {
    fontSize: 10.5,
    color: '#9CA3AF',
    marginTop: 4,
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
  categoryChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: SEMAR_COLORS.border,
    alignItems: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryChipTextActive: {
    color: SEMAR_COLORS.white,
    fontWeight: '700',
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
  rulesContainer: {
    gap: 14,
    paddingTop: 6,
  },
  ruleItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  ruleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SEMAR_COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  ruleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: SEMAR_COLORS.primary,
  },
  ruleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: SEMAR_COLORS.textDark,
  },
  ruleDesc: {
    fontSize: 11.5,
    color: SEMAR_COLORS.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: SEMAR_COLORS.textMuted,
    marginVertical: 20,
    fontSize: 13,
  },
});
