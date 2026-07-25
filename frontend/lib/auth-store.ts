import { create } from "zustand";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "student" | "admin";
  isEmailVerified: boolean;
  xp: number;
  streak: number;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isHydrating: boolean;
  setSession: (user: AuthUser, accessToken: string) => void;
  clearSession: () => void;
  setHydrating: (value: boolean) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
}

// Access token intentionally lives only in memory (never localStorage) —
// the refresh token that renews it is an httpOnly cookie set by the backend.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrating: true,
  setSession: (user, accessToken) => set({ user, accessToken, isHydrating: false }),
  clearSession: () => set({ user: null, accessToken: null, isHydrating: false }),
  setHydrating: (value) => set({ isHydrating: value }),
  updateUser: (patch) => set((state) => (state.user ? { user: { ...state.user, ...patch } } : state)),
}));
