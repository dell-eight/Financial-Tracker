import { supabase } from '../lib/supabase';
import type { SecuritySettings, AutoLockDuration } from '../store/app.store';

// ── DB ↔ app type conversion ───────────────────────────────────────────────────

const DURATION_TO_MINUTES: Record<AutoLockDuration, number> = {
  '1min': 1, '5min': 5, '15min': 15, 'never': 0,
};

const MINUTES_TO_DURATION: Record<number, AutoLockDuration> = {
  1: '1min', 5: '5min', 15: '15min', 0: 'never',
};

function toRow(s: SecuritySettings) {
  return {
    biometric_enabled:  s.biometricEnabled,
    pin_enabled:        s.pinEnabled,
    auto_lock_minutes:  DURATION_TO_MINUTES[s.autoLockDuration] ?? 0,
    screenshot_privacy: s.screenshotPrivacyEnabled,
    two_factor_enabled: false,
  };
}

function fromRow(row: Record<string, unknown>): SecuritySettings {
  return {
    biometricEnabled:         Boolean(row.biometric_enabled),
    pinEnabled:               Boolean(row.pin_enabled),
    autoLockDuration:         MINUTES_TO_DURATION[row.auto_lock_minutes as number] ?? 'never',
    screenshotPrivacyEnabled: Boolean(row.screenshot_privacy),
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Fetch the security settings row for the current authenticated user.
 * Returns null if no row exists yet (first sign-in).
 */
export async function fetchSecuritySettings(): Promise<SecuritySettings | null> {
  const { data, error } = await supabase
    .from('user_security_settings')
    .select('biometric_enabled, pin_enabled, auto_lock_minutes, screenshot_privacy')
    .single();

  if (error || !data) return null;
  return fromRow(data as Record<string, unknown>);
}

/**
 * Upsert the security settings row for the current authenticated user.
 * Uses user_id as the conflict key (UNIQUE constraint).
 * Safe to call on every settings change — creates the row on first call.
 */
export async function upsertSecuritySettings(settings: SecuritySettings): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('user_security_settings')
    .upsert(
      { user_id: user.id, ...toRow(settings) },
      { onConflict: 'user_id' },
    );
}
