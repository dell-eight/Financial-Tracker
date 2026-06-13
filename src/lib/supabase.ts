import { createClient } from '@supabase/supabase-js';
import type { SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl;

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase credentials. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

// iOS SecureStore: keys ≤ 30 chars, values ≤ 2048 bytes.
// Base keys are capped at 24 chars so chunk-suffix keys (.n, .0–.9) stay under 30.
const CHUNK_SIZE = 1900;

function sanitizeKey(key: string): string {
  const clean = key.replace(/[^a-zA-Z0-9._-]/g, '_');
  return clean.length <= 24 ? clean : clean.slice(-24);
}

async function getChunked(key: string): Promise<string | null> {
  const countStr = await SecureStore.getItemAsync(`${key}.n`);
  if (!countStr) return SecureStore.getItemAsync(key);
  const count = parseInt(countStr, 10);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const chunk = await SecureStore.getItemAsync(`${key}.${i}`);
    if (chunk === null) return null;
    parts.push(chunk);
  }
  return parts.join('');
}

async function setChunked(key: string, value: string): Promise<void> {
  if (value.length <= CHUNK_SIZE) {
    return SecureStore.setItemAsync(key, value);
  }
  const chunks: string[] = [];
  for (let i = 0; i * CHUNK_SIZE < value.length; i++) {
    chunks.push(value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
  }
  await SecureStore.setItemAsync(`${key}.n`, String(chunks.length));
  await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(`${key}.${i}`, c)));
}

async function removeChunked(key: string): Promise<void> {
  const countStr = await SecureStore.getItemAsync(`${key}.n`);
  if (countStr) {
    const count = parseInt(countStr, 10);
    await SecureStore.deleteItemAsync(`${key}.n`);
    await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}.${i}`))
    );
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

const SecureStoreAdapter: SupportedStorage = {
  getItem:    (key) => getChunked(sanitizeKey(key)),
  setItem:    (key, value) => setChunked(sanitizeKey(key), value),
  removeItem: (key) => removeChunked(sanitizeKey(key)),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:            SecureStoreAdapter,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
  global: {
    headers: { 'X-Client-Info': 'financial-tracker-app' },
  },
});

export class SupabaseError extends Error {
  constructor(
    message: string,
    public code: string | null = null,
    public details: unknown = null
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export function handleSupabaseError(error: unknown): SupabaseError {
  if (error instanceof SupabaseError) return error;

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if ('message' in err && 'code' in err) {
      return new SupabaseError(
        err.message as string,
        err.code as string,
        err.details || null
      );
    }
  }

  return new SupabaseError(
    typeof error === 'string' ? error : 'An unknown error occurred'
  );
}

export default supabase;
