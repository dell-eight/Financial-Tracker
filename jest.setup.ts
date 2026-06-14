// AsyncStorage — used by app.store persist middleware
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Supabase — throws at import if env vars are missing; mock the whole module
jest.mock('./src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select:  jest.fn().mockReturnThis(),
      insert:  jest.fn().mockReturnThis(),
      update:  jest.fn().mockReturnThis(),
      upsert:  jest.fn().mockReturnThis(),
      delete:  jest.fn().mockReturnThis(),
      eq:      jest.fn().mockReturnThis(),
      order:   jest.fn().mockReturnThis(),
      limit:   jest.fn().mockReturnThis(),
      single:  jest.fn().mockReturnThis(),
    })),
  },
  SupabaseError: class SupabaseError extends Error {
    constructor(msg: string) { super(msg); this.name = 'SupabaseError'; }
  },
  handleSupabaseError: jest.fn((e) => e),
}));

// expo-constants — used by notifications.service IS_EXPO_GO check
// __esModule: true is required so Babel's interop keeps default/named exports separate
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'storeClient' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));
