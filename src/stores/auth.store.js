import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  role: null, // 'user' | 'admin'
  loading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user, loading: false }),
  // !!user = Convert user to a boolean (true if user exists, false if null)
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, role: null, isAuthenticated: false }),
}));
