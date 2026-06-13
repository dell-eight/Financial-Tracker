/**
 * Authentication Service
 * Handles user registration, login, logout, and profile management
 */

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
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
      user: data.user as any,
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return {
        user: null,
        session: null,
        error: error.message,
      };
    }

    return {
      user: data.user as any,
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
        display_name: updates.display_name,
        avatar_url: updates.avatar_url,
        base_currency: updates.base_currency,
        timezone: updates.timezone,
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
