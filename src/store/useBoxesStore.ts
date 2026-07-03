import { create } from "zustand";
import { Box, BoxItem } from "../types";
import { getBoxes, getBoxDetails } from "../lib/api";

interface BoxesState {
  boxes: Box[];
  currentBox: Box | null;
  currentItems: BoxItem[];
  isLoading: boolean;
  error: string | null;
  fetchBoxes: () => Promise<void>;
  loadBoxDetails: (boxId: string) => Promise<void>;
}

export const useBoxesStore = create<BoxesState>((set) => ({
  boxes: [],
  currentBox: null,
  currentItems: [],
  isLoading: false,
  error: null,

  fetchBoxes: async () => {
    set({ isLoading: true, error: null });
    try {
      const boxes = await getBoxes();
      set({ boxes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  loadBoxDetails: async (boxId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { box, items } = await getBoxDetails(boxId);
      set({ currentBox: box, currentItems: items, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  }
}));
