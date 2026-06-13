/**
 * Authentication Service
 * Handles user registration, login, logout, and profile management
 */

import { supabase, handleSupabaseError } from '../lib/supabase';
import type { User } from '../types/supabase';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  session: any;
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
    });

    if (error) {
      return {
        user: null,
        session: null,
        error: error.message,
      };
    }

    // Create user profile in public.users table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email || credentials.email,
        });

      if (profileError) {
        return {
          user: null,
          session: null,
          error: profileError.message,
        };
      }
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
 * Reset password with email
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'exp://localhost:8081',
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
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return data.subscription;
}
