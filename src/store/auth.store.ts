import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  error:           string | null;
  // Called by the onAuthStateChange listener in RootNavigator
  setSession:  (user: User | null) => void;
  clearAuth:   () => void;
  setLoading:  (loading: boolean) => void;
  setError:    (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       false,
  error:           null,

  setSession: (user) =>
    set({ user, isAuthenticated: user !== null, error: null }),

  clearAuth: () =>
    set({ user: null, isAuthenticated: false, error: null }),

  setLoading: (isLoading) => set({ isLoading }),
  setError:   (error)     => set({ error }),
}));
