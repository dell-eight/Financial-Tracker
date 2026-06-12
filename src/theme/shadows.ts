/**
 * shadows.ts — Financial Tracker Design System
 *
 * Light mode: soft purple-tinted shadows — premium, airy.
 * Dark mode:  subtle dark shadows — depth without heaviness.
 *
 * All shadows use Platform.OS to switch between iOS (shadowColor/offset/opacity/radius)
 * and Android (elevation). Android elevation also requires a background color on the View.
 */

import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

function iosShadow(
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
): ShadowStyle {
  if (Platform.OS !== 'ios') return {};
  return {
    shadowColor:   color,
    shadowOffset:  { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius:  radius,
  };
}

function androidShadow(elevation: number): ShadowStyle {
  if (Platform.OS !== 'android') return {};
  return { elevation };
}

function shadow(
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number,
): ShadowStyle {
  return Platform.OS === 'ios'
    ? iosShadow(color, offsetY, opacity, radius)
    : androidShadow(elevation);
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGHT SHADOWS — soft, purple-tinted
// ─────────────────────────────────────────────────────────────────────────────

export const lightShadows = {
  none: {} as ShadowStyle,

  // Subtle card lift — stat chips, filter chips
  sm:   shadow('#755DEF', 2,  0.06, 8,  1),

  // Standard card — most content cards
  card: shadow('#755DEF', 4,  0.08, 16, 3),

  // Featured/hero card — balance card, primary CTA
  hero: shadow('#755DEF', 8,  0.12, 24, 6),

  // Bottom sheet — slides up from below
  modal: shadow('#000000', -4, 0.10, 20, 12),

  // Floating action button — brand purple glow
  fab: shadow('#755DEF', 4, 0.28, 12, 8),

  // Account card — colored ambient shadow
  accountCard: shadow('#755DEF', 6, 0.18, 18, 5),

  // Tooltip — floats above chart
  tooltip: shadow('#755DEF', 2, 0.08, 8, 3),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DARK SHADOWS — subtle depth
// ─────────────────────────────────────────────────────────────────────────────

export const darkShadows = {
  none: {} as ShadowStyle,

  sm:   shadow('#000000', 2,  0.20, 4,  2),

  card: shadow('#000000', 4,  0.32, 12, 6),

  hero: shadow('#000000', 8,  0.45, 24, 12),

  modal: shadow('#000000', -4, 0.45, 24, 20),

  fab: shadow('#755DEF', 4, 0.40, 12, 10),

  accountCard: shadow('#755DEF', 6, 0.28, 18, 8),

  tooltip: shadow('#000000', 2, 0.40, 8, 5),
} as const;
