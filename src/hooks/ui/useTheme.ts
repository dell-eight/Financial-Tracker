/**
 * useTheme — primary hook for accessing design tokens in components.
 *
 * Resolves the active theme (dark / light / system) from the UI store,
 * merges it with shared tokens, and returns a fully typed Theme object.
 *
 * Usage:
 *   const { colors, spacing, textVariants, shadows, borderRadius } = useTheme();
 *   const styles = StyleSheet.create({
 *     container: { backgroundColor: colors.bg.surface },
 *     title:     { ...textVariants.headingLg, color: colors.text.primary },
 *   });
 */

import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../../theme';
import type { Theme } from '../../theme';

/**
 * Supported theme preference values.
 * 'system' defers to the device appearance setting.
 */
export type ThemePreference = 'dark' | 'light' | 'system';

/**
 * Resolves a ThemePreference to a concrete boolean.
 * @param preference  - User's stored preference
 * @param systemDark  - Device-level dark mode setting (from useColorScheme)
 */
export function resolveIsDark(
  preference: ThemePreference,
  systemDark: boolean,
): boolean {
  if (preference === 'dark')  return true;
  if (preference === 'light') return false;
  return systemDark;
}

/**
 * Core theme hook.
 *
 * In the full app this reads `preference` from the ui.store (Zustand).
 * This standalone version accepts an optional override for testing/Storybook.
 *
 * @param preferenceOverride - Pass 'dark'|'light'|'system' to override store.
 *                             Omit in production — store drives the value.
 */
export function useTheme(preferenceOverride?: ThemePreference): Theme {
  const systemScheme = useColorScheme();
  const systemDark   = systemScheme === 'dark';

  // In the real app: const preference = useUIStore(s => s.theme);
  const preference: ThemePreference = preferenceOverride ?? 'system';

  const isDark = resolveIsDark(preference, systemDark);
  return isDark ? darkTheme : lightTheme;
}

export default useTheme;
