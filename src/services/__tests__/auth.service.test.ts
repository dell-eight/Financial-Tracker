import { supabase } from '../../lib/supabase';
import {
  signIn,
  signUp,
  signOut,
  resetPassword,
  getUserProfile,
  getCurrentUser,
  getSession,
  updateProfile,
  updatePassword,
  onAuthStateChange,
} from '../auth.service';

const mockAuth = supabase.auth as Record<string, jest.Mock>;

const mockUser = {
  id:            'user-123',
  email:         'test@example.com',
  user_metadata: { display_name: 'Test User' },
  app_metadata:  {},
  aud:           'authenticated',
  created_at:    '2026-01-01T00:00:00Z',
};
const mockSession = {
  access_token:  'token-abc',
  refresh_token: 'refresh-abc',
  user:          mockUser,
  expires_in:    3600,
  token_type:    'bearer',
};
const mockProfile = {
  id:                'user-123',
  display_name:      'Test User',
  email:             'test@example.com',
  base_currency:     'PHP',
  timezone:          'Asia/Manila',
  fiscal_year_start: 1,
};

function makeBuilder(result: { data: unknown; error: unknown }) {
  const b: Record<string, unknown> = {
    select: jest.fn(),
    eq:     jest.fn(),
    single: jest.fn().mockResolvedValue(result),
    then:   (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
              Promise.resolve(result).then(resolve, reject),
  };
  (['select', 'eq'] as const).forEach((m) => (b[m] as jest.Mock).mockReturnValue(b));
  return b;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ── signIn ─────────────────────────────────────────────────────────────────────

describe('signIn', () => {
  it('returns user and session on success', async () => {
    mockAuth.signInWithPassword.mockResolvedValueOnce({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const result = await signIn({ email: 'test@example.com', password: 'pass123' });

    expect(result.error).toBeNull();
    expect(result.session).toEqual(mockSession);
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com', password: 'pass123',
    });
  });

  it('returns error string when Supabase auth fails', async () => {
    mockAuth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    const result = await signIn({ email: 'bad@example.com', password: 'wrong' });

    expect(result.user).toBeNull();
    expect(result.session).toBeNull();
    expect(result.error).toBe('Invalid login credentials');
  });

  it('handles unexpected thrown errors', async () => {
    mockAuth.signInWithPassword.mockRejectedValueOnce(new Error('Network failure'));

    const result = await signIn({ email: 'test@example.com', password: 'pass' });

    expect(result.error).toBe('Network failure');
    expect(result.user).toBeNull();
  });
});

// ── signUp ─────────────────────────────────────────────────────────────────────

describe('signUp', () => {
  it('returns user and session on success', async () => {
    mockAuth.signUp.mockResolvedValueOnce({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const result = await signUp({ email: 'new@example.com', password: 'pass123', name: 'New User' });

    expect(result.error).toBeNull();
    expect(result.session).toEqual(mockSession);
    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email:   'new@example.com',
      password: 'pass123',
      options: { data: { display_name: 'New User' } },
    });
  });

  it('returns error string when sign-up fails', async () => {
    mockAuth.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Email already registered' },
    });

    const result = await signUp({ email: 'dup@example.com', password: 'pass' });

    expect(result.error).toBe('Email already registered');
    expect(result.user).toBeNull();
  });
});

// ── signOut ────────────────────────────────────────────────────────────────────

describe('signOut', () => {
  it('returns null error on success', async () => {
    mockAuth.signOut.mockResolvedValueOnce({ error: null });

    const result = await signOut();

    expect(result.error).toBeNull();
    expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
  });

  it('returns error string on failure', async () => {
    mockAuth.signOut.mockResolvedValueOnce({ error: { message: 'Sign out failed' } });

    const result = await signOut();

    expect(result.error).toBe('Sign out failed');
  });
});

// ── resetPassword ──────────────────────────────────────────────────────────────

describe('resetPassword', () => {
  it('returns success: true when email is sent', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });

    const result = await resetPassword('test@example.com');

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });

  it('returns error string when reset fails', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValueOnce({
      error: { message: 'Email not found' },
    });

    const result = await resetPassword('unknown@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email not found');
  });
});

// ── getUserProfile ─────────────────────────────────────────────────────────────

describe('getUserProfile', () => {
  it('returns profile on success', async () => {
    const builder = makeBuilder({ data: mockProfile, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getUserProfile('user-123');

    expect(result.error).toBeNull();
    expect(result.profile).toEqual(mockProfile);
  });

  it('returns error string on failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Profile not found' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getUserProfile('unknown');

    expect(result.profile).toBeNull();
    expect(result.error).toBe('Profile not found');
  });
});

// ── getCurrentUser ─────────────────────────────────────────────────────────────

describe('getCurrentUser', () => {
  it('returns the current user', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

    const result = await getCurrentUser();

    expect(result.error).toBeNull();
    expect(result.user).toEqual(mockUser);
  });

  it('returns error when getUser fails', async () => {
    mockAuth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const result = await getCurrentUser();

    expect(result.user).toBeNull();
    expect(result.error).toBe('Not authenticated');
  });
});

// ── getSession ─────────────────────────────────────────────────────────────────

describe('getSession', () => {
  it('returns the session when authenticated', async () => {
    mockAuth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    const result = await getSession();

    expect(result.error).toBeNull();
    expect(result.session).toEqual(mockSession);
  });

  it('returns null session when not authenticated', async () => {
    mockAuth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'No session' },
    });

    const result = await getSession();

    expect(result.session).toBeNull();
    expect(result.error).toBe('No session');
  });
});

// ── updateProfile ──────────────────────────────────────────────────────────────

describe('updateProfile', () => {
  function makeBuilder(result: { data: unknown; error: unknown }) {
    const b: Record<string, unknown> = {
      update:  jest.fn(),
      eq:      jest.fn(),
      select:  jest.fn(),
      single:  jest.fn().mockResolvedValue(result),
      then:    (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
                 Promise.resolve(result).then(resolve, reject),
    };
    (['update','eq','select'] as const).forEach((m) => (b[m] as jest.Mock).mockReturnValue(b));
    return b;
  }

  it('returns updated user on success', async () => {
    const updatedProfile = { ...mockProfile, display_name: 'Updated Name' };
    const builder = makeBuilder({ data: updatedProfile, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await updateProfile('user-123', { display_name: 'Updated Name' });

    expect(result.error).toBeNull();
    expect(result.user?.display_name).toBe('Updated Name');
    expect(supabase.from).toHaveBeenCalledWith('users');
  });

  it('returns error string on failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Update failed' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await updateProfile('user-123', { display_name: 'X' });

    expect(result.user).toBeNull();
    expect(result.error).toBe('Update failed');
  });
});

// ── updatePassword ─────────────────────────────────────────────────────────────

describe('updatePassword', () => {
  it('returns success: true on password update', async () => {
    mockAuth.updateUser.mockResolvedValueOnce({ error: null });

    const result = await updatePassword('newSecurePassword123');

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: 'newSecurePassword123' });
  });

  it('returns error string when update fails', async () => {
    mockAuth.updateUser.mockResolvedValueOnce({ error: { message: 'Password too weak' } });

    const result = await updatePassword('123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Password too weak');
  });
});

// ── catch-block coverage (thrown errors) ───────────────────────────────────────

describe('catch blocks (thrown errors)', () => {
  it('signOut returns error when auth.signOut throws', async () => {
    mockAuth.signOut.mockRejectedValueOnce(new Error('Network down'));

    const result = await signOut();

    expect(result.error).toBe('Network down');
  });

  it('getSession returns error when auth.getSession throws', async () => {
    mockAuth.getSession.mockRejectedValueOnce(new Error('Session fetch failed'));

    const result = await getSession();

    expect(result.session).toBeNull();
    expect(result.error).toBe('Session fetch failed');
  });

  it('getCurrentUser returns error when auth.getUser throws', async () => {
    mockAuth.getUser.mockRejectedValueOnce(new Error('User fetch failed'));

    const result = await getCurrentUser();

    expect(result.user).toBeNull();
    expect(result.error).toBe('User fetch failed');
  });

  it('resetPassword returns error when auth method throws', async () => {
    mockAuth.resetPasswordForEmail.mockRejectedValueOnce(new Error('Server error'));

    const result = await resetPassword('test@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Server error');
  });

  it('updatePassword returns error when auth method throws', async () => {
    mockAuth.updateUser.mockRejectedValueOnce(new Error('Update error'));

    const result = await updatePassword('password');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Update error');
  });
});

// ── onAuthStateChange ──────────────────────────────────────────────────────────

describe('onAuthStateChange', () => {
  it('calls callback when auth state changes and returns subscription', () => {
    const subscription = { unsubscribe: jest.fn() };
    mockAuth.onAuthStateChange.mockImplementationOnce((cb: Function) => {
      cb('SIGNED_IN', mockSession);
      return { data: { subscription } };
    });

    const callback = jest.fn();
    const returned = onAuthStateChange(callback);

    expect(callback).toHaveBeenCalledWith('SIGNED_IN', mockSession);
    expect(returned).toBe(subscription);
  });
});
