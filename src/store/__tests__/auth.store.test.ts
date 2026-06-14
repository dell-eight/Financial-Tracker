import { useAuthStore } from '../auth.store';
import type { User } from '@supabase/supabase-js';

const mockUser = { id: 'user-1', email: 'test@example.com' } as User;

beforeEach(() => {
  useAuthStore.setState({
    user:            null,
    isAuthenticated: false,
    isLoading:       false,
    error:           null,
  });
});

describe('useAuthStore', () => {
  it('has correct defaults', () => {
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeNull();
  });

  it('setSession with a user marks authenticated', () => {
    useAuthStore.getState().setSession(mockUser);
    const s = useAuthStore.getState();
    expect(s.user).toBe(mockUser);
    expect(s.isAuthenticated).toBe(true);
    expect(s.error).toBeNull();
  });

  it('setSession with null clears auth', () => {
    useAuthStore.getState().setSession(mockUser);
    useAuthStore.getState().setSession(null);
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });

  it('clearAuth resets all fields', () => {
    useAuthStore.getState().setSession(mockUser);
    useAuthStore.getState().setError('some error');
    useAuthStore.getState().clearAuth();
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(s.error).toBeNull();
  });

  it('setError stores the error message', () => {
    useAuthStore.getState().setError('Invalid credentials');
    expect(useAuthStore.getState().error).toBe('Invalid credentials');
  });
});
