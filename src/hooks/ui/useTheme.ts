/**
 * useTheme — returns the active design-token Theme object.
 * Reads theme preference from app.store (dark / light / system).
 */

import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../../theme';
import type { Theme } from '../../theme';
import { useAppStore, type ThemePreference } from '../../store/app.store';

// Re-export so existing callers importing from this file still work
export type { ThemePreference };

export function resolveIsDark(preference: ThemePreference, systemDark: boolean): boolean {
  if (preference === 'dark')  return true;
  if (preference === 'light') return false;
  return systemDark;
}

export function useTheme(preferenceOverride?: ThemePreference): Theme {
  const systemScheme = useColorScheme();
  const systemDark   = systemScheme === 'dark';
  const stored       = useAppStore(s => s.themePreference);
  const preference   = preferenceOverride ?? stored;

  const isDark = resolveIsDark(preference, systemDark);
  return isDark ? darkTheme : lightTheme;
}

export default useTheme;
