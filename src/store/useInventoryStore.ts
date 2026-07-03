import { create } from "zustand";
import { InventoryItem } from "../types";
import { getInventory, sellItem, requestPhysicalShipping, triggerItemUpgrade, triggerJackpotMultiplier, createShippingPaymentIntent, confirmShippingPayment } from "../lib/api";

interface InventoryState {
  items: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  fetchInventory: (userId: string) => Promise<void>;
  resell: (itemId: string, userId: string) => Promise<void>;
  shipItem: (itemId: string | string[], userId: string, address: string) => Promise<{ shipping_label?: string; requires_card_payment?: boolean; amount?: number }>;
  createShippingPaymentIntent: (itemId: string | string[], userId: string, address: string) => Promise<{ clientSecret: string; amount: number; requires_card_payment: boolean; is_live_stripe: boolean; publishableKey?: string }>;
  confirmShippingPayment: (itemId: string | string[], userId: string, address: string, paymentIntentId?: string) => Promise<{ success: boolean; shipping_label: string; new_balance: number; message: string }>;
  upgradeItemOnLine: (userId: string, itemId: string) => Promise<{ success: boolean; upgraded: boolean; message: string }>;
  playJackpotMultiplier: (userId: string, itemIds: string[], multiplier: number) => Promise<{ success: boolean; won: boolean; new_value?: number; message: string }>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchInventory: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const items = await getInventory(userId);
      set({ items, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  resell: async (itemId: string, userId: string) => {
    try {
      await sellItem(itemId, userId);
      const items = await getInventory(userId);
      set({ items });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  shipItem: async (itemId: string | string[], userId: string, address: string) => {
    try {
      const res = await requestPhysicalShipping(itemId, userId, address);
      if (!res.requires_card_payment) {
        const items = await getInventory(userId);
        set({ items });
      }
      return res;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  createShippingPaymentIntent: async (itemId: string | string[], userId: string, address: string) => {
    try {
      return await createShippingPaymentIntent(itemId, userId, address);
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  confirmShippingPayment: async (itemId: string | string[], userId: string, address: string, paymentIntentId?: string) => {
    try {
      const res = await confirmShippingPayment(itemId, userId, address, paymentIntentId);
      const items = await getInventory(userId);
      set({ items });
      return res;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  upgradeItemOnLine: async (userId: string, itemId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await triggerItemUpgrade(userId, itemId);
      const items = await getInventory(userId);
      set({ items, isLoading: false });
      return result;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  playJackpotMultiplier: async (userId: string, itemIds: string[], multiplier: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await triggerJackpotMultiplier(userId, itemIds, multiplier);
      const items = await getInventory(userId);
      set({ items, isLoading: false });
      return result;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  }
}));
