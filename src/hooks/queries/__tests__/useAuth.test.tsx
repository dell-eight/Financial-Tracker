// Integration test: verifies the auth state flow that RootNavigator drives via
// supabase.auth.onAuthStateChange → useAuthStore.setSession.

import { useAuthStore } from '../../../store/auth.store';
import type { User } from '@supabase/supabase-js';

const mockUser = { id: 'user-abc', email: 'dev@example.com' } as User;

beforeEach(() => {
  useAuthStore.setState({
    user:            null,
    isAuthenticated: false,
    isLoading:       false,
    error:           null,
  });
});

describe('auth data flow', () => {
  it('setSession triggers authenticated state (simulates onAuthStateChange login)', () => {
    useAuthStore.getState().setSession(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.id).toBe('user-abc');
  });

  it('setSession(null) logs the user out (simulates onAuthStateChange logout)', () => {
    useAuthStore.getState().setSession(mockUser);
    useAuthStore.getState().setSession(null);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('clearAuth resets all state (used on explicit sign-out)', () => {
    useAuthStore.getState().setSession(mockUser);
    useAuthStore.getState().setLoading(true);
    useAuthStore.getState().setError('stale error');
    useAuthStore.getState().clearAuth();
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(s.error).toBeNull();
  });
});
