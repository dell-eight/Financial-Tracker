/**
 * Supabase Client Initialization
 * Configures the Supabase client for the Financial Tracker app
 */

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get Supabase URL and Key from environment variables
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY in app.json or .env'
  );
}

// Create the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: undefined, // Will use Expo SecureStore via custom implementation
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'financial-tracker-app',
    },
  },
});

// Helper to handle Supabase errors
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

// Helper to format Supabase errors
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
