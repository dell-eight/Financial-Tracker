/**
 * Authentication Service
 * Handles user registration, login, logout, and profile management
 */

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '../types/supabase';

WebBrowser.maybeCompleteAuthSession();

export interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: string | null;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(credentials: AuthCredentials): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: { display_name: credentials.name ?? '' },
      },
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    // public.users is populated automatically by the on_auth_user_created trigger
    return {
      user: data.user as unknown as User,
      session: data.session,
      error: null,
    };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { user: null, session: null, error: err.message };
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(credentials: AuthCredentials): Promise<AuthResponse> {
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Sign in timed out. Check your connection and try again.')), 15_000),
    );
    const { data, error } = await Promise.race([
      supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      }),
      timeout,
    ]);

    if (error) {
      return {
        user: null,
        session: null,
        error: error.message,
      };
    }

    return {
      user: data.user as unknown as User,
      session: data.session,
      error: null,
    };
  } catch (error) {
    const err = handleSupabaseError(error);
    return {
      user: null,
      session: null,
      error: err.message,
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { error: err.message };
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { session: null, error: error.message };
    }

    return { session: data.session, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { session: null, error: err.message };
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { user: null, error: err.message };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: Partial<User>) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        display_name:      updates.display_name,
        avatar_url:        updates.avatar_url,
        base_currency:     updates.base_currency,
        timezone:          updates.timezone,
        fiscal_year_start: updates.fiscal_year_start,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data as User, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { user: null, error: err.message };
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const redirectTo = Linking.createURL('auth/callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error || !data?.url) {
      return { error: error?.message ?? 'Could not start Google sign-in' };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'success' && result.url) {
      const fragment = result.url.split('#')[1] ?? '';
      const params   = new URLSearchParams(fragment);
      const accessToken  = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        // Implicit flow — tokens already present in URL hash
        const { error: sessionError } = await supabase.auth.setSession({
          access_token:  accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) return { error: sessionError.message };
      } else {
        // PKCE flow — exchange authorization code for session
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
        if (sessionError) return { error: sessionError.message };
      }
    }

    return { error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { error: err.message };
  }
}

/**
 * Reset password with email
 */
const RESET_PASSWORD_REDIRECT = process.env.EXPO_PUBLIC_RESET_PASSWORD_URL ?? 'financialtracker://reset-password';

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: RESET_PASSWORD_REDIRECT,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { success: false, error: err.message };
  }
}

/**
 * Upload a local image URI to the Supabase Storage `avatars` bucket.
 * Returns a cache-busted public URL so the UI reflects the new image
 * immediately even though the storage path is the same on re-upload.
 *
 * Requires an `avatars` bucket in Supabase Storage set to **public**.
 */
export async function uploadAvatar(
  userId: string,
  fileUri: string,
): Promise<{ url: string | null; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { url: null, error: 'Not authenticated' };

    // Resize to 400px wide and convert to WebP natively before upload.
    // Runs on platform image APIs — fast (~100ms) and doesn't block JS.
    // A 2.5MB JPEG becomes ~20-40KB WebP at this size/quality.
    const manipulated = await ImageManipulator.manipulateAsync(
      fileUri,
      [{ resize: { width: 400 } }],
      { format: 'webp' as any, compress: 0.8 },
    );

    const path = `${userId}/avatar.webp`;

    const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
      encoding: 'base64' as any,
    });
    const binaryStr = globalThis.atob(base64);
    const buf  = new ArrayBuffer(binaryStr.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < binaryStr.length; i++) view[i] = binaryStr.charCodeAt(i);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, buf, { contentType: 'image/webp', upsert: true });

    if (uploadError) return { url: null, error: uploadError.message };

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return { url: `${data.publicUrl}?t=${Date.now()}`, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    return { url: null, error: msg };
  }
}

/**
 * Sync display_name (and optionally avatar_url) to Supabase Auth user_metadata
 * so that Dashboard and ProfileScreen update immediately without a re-login.
 */
export async function syncDisplayNameToAuth(
  displayName: string,
  avatarUrl?: string | null,
): Promise<{ user: SupabaseUser | null; error: string | null }> {
  try {
    const metadata: Record<string, string | null> = {
      display_name: displayName.trim() || null,
    };
    if (avatarUrl !== undefined) {
      metadata.avatar_url = avatarUrl;
    }
    const { data, error } = await supabase.auth.updateUser({ data: metadata });
    if (error) return { user: null, error: error.message };
    return { user: data.user, error: null };
  } catch (err) {
    const e = handleSupabaseError(err);
    return { user: null, error: e.message };
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { success: false, error: err.message };
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return { profile: null, error: error.message };
    }

    return { profile: data as User, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { profile: null, error: err.message };
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return data.subscription;
}
