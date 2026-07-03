import { create } from "zustand";
import { Battle } from "../types";
import { getBattles, createBattle, joinBattle } from "../lib/api";

interface BattleState {
  battles: Battle[];
  currentBattle: Battle | null;
  isLoading: boolean;
  error: string | null;
  fetchBattles: () => Promise<void>;
  createRoom: (hostId: string, boxId: string, maxPlayers: number) => Promise<Battle>;
  joinRoom: (battleId: string, userId: string) => Promise<Battle>;
  setCurrentBattle: (battle: Battle | null) => void;
  pollActiveBattle: () => Promise<void>;
}

export const useBattleStore = create<BattleState>((set, get) => ({
  battles: [],
  currentBattle: null,
  isLoading: false,
  error: null,

  fetchBattles: async () => {
    try {
      const list = await getBattles();
      set({ battles: list });
    } catch (err: any) {
      console.error("Error fetching battles list", err);
    }
  },

  createRoom: async (hostId: string, boxId: string, maxPlayers: number) => {
    set({ isLoading: true, error: null });
    try {
      const battle = await createBattle(hostId, boxId, maxPlayers);
      set({ currentBattle: battle, isLoading: false });
      return battle;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  joinRoom: async (battleId: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const battle = await joinBattle(battleId, userId);
      set({ currentBattle: battle, isLoading: false });
      return battle;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  setCurrentBattle: (battle) => {
    set({ currentBattle: battle });
  },

  pollActiveBattle: async () => {
    const { currentBattle } = get();
    if (!currentBattle) return;
    try {
      const list = await getBattles();
      const updated = list.find(b => b.id === currentBattle.id);
      if (updated) {
        set({ currentBattle: updated });
      }
    } catch (err) {
      console.error("Failed to poll active battle state", err);
    }
  }
}));
