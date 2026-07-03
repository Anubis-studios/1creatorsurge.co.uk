import { create } from "zustand";
import { Profile } from "../types";
import { getProfile, updateProfile } from "../lib/api";

interface AuthState {
  userId: string;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  updateUserAddress: (address: string) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: localStorage.getItem("surgebox_user_id") || "",
  profile: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Incorrect email or password." }));
        throw new Error(errData.error || "Incorrect email or password.");
      }
      const { profile } = await res.json();
      localStorage.setItem("surgebox_user_id", profile.id);
      set({ userId: profile.id, profile, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Login failed", isLoading: false });
      throw err;
    }
  },

  signup: async (email, username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Registration failed." }));
        throw new Error(errData.error || "Registration failed.");
      }
      const { profile } = await res.json();
      localStorage.setItem("surgebox_user_id", profile.id);
      set({ userId: profile.id, profile, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Registration failed", isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("surgebox_user_id");
    set({ userId: "", profile: null, error: null, isLoading: false });
  },

  loadProfile: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ isLoading: true });
    try {
      const profile = await getProfile(userId);
      set({ profile, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateUserAddress: async (address: string) => {
    const { userId, profile } = get();
    if (!userId || !profile) return;
    try {
      const updated = await updateProfile(userId, { username: profile.username, shipping_address: address });
      set({ profile: updated });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateUsername: async (username: string) => {
    const { userId, profile } = get();
    if (!userId || !profile) return;
    try {
      const updated = await updateProfile(userId, { username, shipping_address: profile.shipping_address || "" });
      set({ profile: updated });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  refreshProfile: async () => {
    const { userId } = get();
    if (!userId) return;
    try {
      const profile = await getProfile(userId);
      set({ profile });
    } catch (err: any) {
      console.error("Failed to silently refresh profile", err);
    }
  }
}));

// Auto-initialize profile in the background immediately on store load
setTimeout(() => {
  useAuthStore.getState().loadProfile();
}, 0);
