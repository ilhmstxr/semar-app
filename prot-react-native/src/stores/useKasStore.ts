import { create } from 'zustand';
import { initialExpenses, initialIncomes, TransactionItem } from '@/constants/mockData';
import {
  fetchKasSummaryApi,
  createKasTransactionApi,
  deleteKasTransactionApi,
} from '@/services/api';

interface KasSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

interface KasState {
  incomes: TransactionItem[];
  expenses: TransactionItem[];
  summary: KasSummary;
  isAddModalOpen: boolean;
  isRulesModalOpen: boolean;
  isExpenseModalOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  fetchKasData: () => Promise<void>;
  openAddModal: () => void;
  closeAddModal: () => void;
  openRulesModal: () => void;
  closeRulesModal: () => void;
  openExpenseModal: () => void;
  closeExpenseModal: () => void;
  addIncome: (label: string, amount: number) => Promise<{ success: boolean; message: string }>;
  addExpense: (
    label: string,
    amount: number,
    category: string
  ) => Promise<{ success: boolean; message: string }>;
  deleteTransaction: (id: number, type: 'income' | 'expense') => Promise<void>;
}

export const useKasStore = create<KasState>((set, get) => ({
  incomes: initialIncomes,
  expenses: initialExpenses,
  summary: {
    totalIncome: 212500,
    totalExpense: 43000,
    balance: 169500,
  },
  isAddModalOpen: false,
  isRulesModalOpen: false,
  isExpenseModalOpen: false,
  isLoading: false,
  isSaving: false,

  openAddModal: () => set({ isAddModalOpen: true }),
  closeAddModal: () => set({ isAddModalOpen: false }),
  openRulesModal: () => set({ isRulesModalOpen: true }),
  closeRulesModal: () => set({ isRulesModalOpen: false }),
  openExpenseModal: () => set({ isExpenseModalOpen: true }),
  closeExpenseModal: () => set({ isExpenseModalOpen: false }),

  // 4: Get pemasukan & pengeluaran dari DB
  fetchKasData: async () => {
    set({ isLoading: true });
    try {
      const res = await fetchKasSummaryApi();
      if (res && res.data) {
        const inc = res.data.filter((t) => t.type === 'income');
        const exp = res.data.filter((t) => t.type === 'expense');

        set({
          incomes: inc,
          expenses: exp,
          summary: res.summary || {
            totalIncome: inc.reduce((s, i) => s + i.amount, 0),
            totalExpense: exp.reduce((s, e) => s + e.amount, 0),
            balance:
              inc.reduce((s, i) => s + i.amount, 0) -
              exp.reduce((s, e) => s + e.amount, 0),
          },
          isLoading: false,
        });
      }
    } catch (error) {
      console.warn('[useKasStore] Gagal ambil kas dari API, pakai cache:', error);
      set({ isLoading: false });
    }
  },

  // 4: Post pemasukan ke dalam DB
  addIncome: async (label: string, amount: number) => {
    set({ isSaving: true });
    try {
      const res = await createKasTransactionApi({
        label,
        amount,
        type: 'income',
        category: 'penjualan',
      });

      await get().fetchKasData();
      set({ isAddModalOpen: false, isSaving: false });

      return {
        success: true,
        message: res.message || 'Pemasukan berhasil disimpan ke database',
      };
    } catch (error: any) {
      console.warn('[useKasStore] Fallback addIncome:', error.message);
      const now = new Date();
      const dateStr = `${now.getDate()} Nov`;
      const newItem: TransactionItem = {
        id: Date.now(),
        label,
        amount,
        date: dateStr,
        type: 'income',
      };
      set((state) => ({
        incomes: [newItem, ...state.incomes],
        isAddModalOpen: false,
        isSaving: false,
      }));
      return {
        success: true,
        message: 'Pemasukan dicatat secara lokal',
      };
    }
  },

  // 4: Post pengeluaran ke dalam DB
  addExpense: async (label: string, amount: number, category: string) => {
    set({ isSaving: true });
    try {
      const res = await createKasTransactionApi({
        label,
        amount,
        type: 'expense',
        category,
      });

      await get().fetchKasData();
      set({ isExpenseModalOpen: false, isSaving: false });

      return {
        success: true,
        message: res.message || 'Pengeluaran berhasil disimpan ke database',
      };
    } catch (error: any) {
      console.warn('[useKasStore] Fallback addExpense:', error.message);
      const now = new Date();
      const dateStr = `${now.getDate()} Nov`;
      const newItem: TransactionItem = {
        id: Date.now(),
        label,
        amount,
        category,
        date: dateStr,
        type: 'expense',
      };
      set((state) => ({
        expenses: [newItem, ...state.expenses],
        isExpenseModalOpen: false,
        isSaving: false,
      }));
      return {
        success: true,
        message: 'Pengeluaran dicatat secara lokal',
      };
    }
  },

  // 4: Delete transaksi dari DB
  deleteTransaction: async (id: number, type: 'income' | 'expense') => {
    try {
      await deleteKasTransactionApi(id);
      await get().fetchKasData();
    } catch (err) {
      console.warn('[useKasStore] Gagal hapus di DB, hapus dari state lokal:', err);
      if (type === 'income') {
        set((state) => ({ incomes: state.incomes.filter((i) => i.id !== id) }));
      } else {
        set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }));
      }
    }
  },
}));
