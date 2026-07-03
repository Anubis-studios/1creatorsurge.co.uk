import { create } from "zustand";
import { Transaction } from "../types";
import { getTransactions, submitWalletDeposit } from "../lib/api";

interface WalletState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (userId: string) => Promise<void>;
  depositFunds: (userId: string, amount: number, method: 'Credit Card' | 'PayPal' | 'Crypto' | string) => Promise<{ success: boolean; total_added: number; message: string }>;
}

export const useWalletStore = create<WalletState>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const txs = await getTransactions(userId);
      // Sort newest first
      const sorted = txs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      set({ transactions: sorted, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  depositFunds: async (userId: string, amount: number, method: 'Credit Card' | 'PayPal' | 'Crypto' | string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await submitWalletDeposit(userId, amount, method);
      const txs = await getTransactions(userId);
      const sorted = txs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      set({ transactions: sorted, isLoading: false });
      return { success: res.success, total_added: res.total_added, message: res.message };
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  }
}));
