// AsyncStorage — used by app.store persist middleware
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// expo-web-browser — imported at module level by auth.service.ts
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync:     jest.fn(),
}));

// expo-auth-session — makeRedirectUri used in signInWithGoogle
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'networthy://auth/callback'),
}));

// expo-linking — Linking.createURL used in signInWithGoogle
jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'networthy://auth/callback'),
}));

// Supabase — comprehensive mock with chainable, thenable builder
jest.mock('./src/lib/supabase', () => {
  // Shared builder — tests call (supabase.from as jest.Mock).mockReturnValueOnce(makeBuilder(...))
  // to configure per-test responses.
  function makeBuilder(result = { data: null as unknown, error: null as unknown }) {
    const b: Record<string, unknown> = {
      select:      jest.fn(),
      insert:      jest.fn(),
      update:      jest.fn(),
      upsert:      jest.fn(),
      delete:      jest.fn(),
      eq:          jest.fn(),
      neq:         jest.fn(),
      is:          jest.fn(),
      gte:         jest.fn(),
      lte:         jest.fn(),
      lt:          jest.fn(),
      not:         jest.fn(),
      ilike:       jest.fn(),
      order:       jest.fn(),
      limit:       jest.fn(),
      range:       jest.fn(),
      or:          jest.fn(),
      single:      jest.fn().mockResolvedValue(result),
      maybeSingle: jest.fn().mockResolvedValue(result),
      // Makes the builder itself thenable so `await chain.eq().order()` resolves
      then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
        Promise.resolve(result).then(resolve, reject),
    };
    const chainable = ['select','insert','update','upsert','delete',
                       'eq','neq','is','gte','lte','lt','not','ilike',
                       'order','limit','range','or'];
    for (const m of chainable) (b[m] as jest.Mock).mockReturnValue(b);
    return b;
  }

  return {
    supabase: {
      auth: {
        signUp:                 jest.fn(),
        signInWithPassword:     jest.fn(),
        signOut:                jest.fn(),
        getUser:                jest.fn(),
        getSession:             jest.fn(),
        updateUser:             jest.fn(),
        resetPasswordForEmail:  jest.fn(),
        signInWithOAuth:        jest.fn(),
        setSession:             jest.fn(),
        exchangeCodeForSession: jest.fn(),
        onAuthStateChange:      jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
      },
      from: jest.fn(() => makeBuilder()),
      rpc:  jest.fn().mockResolvedValue({ data: null, error: null }),
    },
    SupabaseError: class SupabaseError extends Error {
      constructor(msg: string) { super(msg); this.name = 'SupabaseError'; }
    },
    handleSupabaseError: jest.fn((e: unknown) => {
      if (e instanceof Error) return e;
      if (e && typeof e === 'object' && 'message' in e) {
        return new Error((e as { message: string }).message);
      }
      return new Error(String(e));
    }),
  };
});

// expo-constants — used by notifications.service IS_EXPO_GO check
// executionEnvironment = 'storeClient' → IS_EXPO_GO = true (Expo Go guard active)
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'storeClient' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));
