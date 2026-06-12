/**
 * typography.ts — Financial Tracker Design System
 *
 * Urbanist type scale — the expressive, geometric sans-serif chosen for its
 * legibility at small sizes, personality at display sizes, and excellent
 * numeric rendering for financial data.
 *
 * Font weights loaded in App.tsx via @expo-google-fonts/urbanist:
 *   Urbanist_400Regular  → 'Urbanist-Regular'
 *   Urbanist_500Medium   → 'Urbanist-Medium'
 *   Urbanist_600SemiBold → 'Urbanist-SemiBold'
 *   Urbanist_700Bold     → 'Urbanist-Bold'
 *   Urbanist_800ExtraBold→ 'Urbanist-ExtraBold'
 */

import { Platform } from 'react-native';
import type { TextStyle } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// FONT FAMILIES
// ─────────────────────────────────────────────────────────────────────────────

export const fontFamily = {
  regular:   'Urbanist-Regular',
  medium:    'Urbanist-Medium',
  semiBold:  'Urbanist-SemiBold',
  bold:      'Urbanist-Bold',
  extraBold: 'Urbanist-ExtraBold',    // Display headlines, hero numbers
  system: Platform.select({
    ios:     'System',
    android: 'sans-serif',
    default: 'System',
  }) as string,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// FONT WEIGHTS
// ─────────────────────────────────────────────────────────────────────────────

export const fontWeight = {
  regular:   '400' as TextStyle['fontWeight'],
  medium:    '500' as TextStyle['fontWeight'],
  semiBold:  '600' as TextStyle['fontWeight'],
  bold:      '700' as TextStyle['fontWeight'],
  extraBold: '800' as TextStyle['fontWeight'],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// FONT SIZE SCALE
// ─────────────────────────────────────────────────────────────────────────────

export const fontSize = {
  micro:      10,   // barely-there labels
  bodySm:     12,   // timestamps, captions, hints
  bodyMd:     14,   // secondary text, descriptions
  bodyLg:     16,   // primary list text, form labels
  headingSm:  16,   // list section labels
  headingMd:  18,   // section titles, card headers
  headingLg:  22,   // screen titles
  displayLg:  28,   // screen-level large amounts
  displayXl:  36,   // total balance hero number
  displayXxl: 44,   // calculator-style amount input
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LINE HEIGHTS
// ─────────────────────────────────────────────────────────────────────────────

export const lineHeight = {
  micro:      14,
  bodySm:     18,
  bodyMd:     20,
  bodyLg:     24,
  headingSm:  22,
  headingMd:  26,
  headingLg:  30,
  displayLg:  36,
  displayXl:  44,
  displayXxl: 54,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LETTER SPACING
// ─────────────────────────────────────────────────────────────────────────────

export const letterSpacing = {
  tight:   -0.5,
  tighter: -0.3,
  snug:    -0.2,
  normal:   0,
  wide:     0.4,
  wider:    0.8,
  widest:   1.2,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// PRE-COMPOSED TEXT VARIANTS
// Use directly in StyleSheet.create() — resolves to plain RN TextStyle.
// ─────────────────────────────────────────────────────────────────────────────

export const textVariants = {
  displayXxl: {
    fontFamily:    fontFamily.extraBold,
    fontWeight:    fontWeight.extraBold,
    fontSize:      fontSize.displayXxl,
    lineHeight:    lineHeight.displayXxl,
    letterSpacing: letterSpacing.tight,
  } satisfies TextStyle,

  displayXl: {
    fontFamily:    fontFamily.extraBold,
    fontWeight:    fontWeight.extraBold,
    fontSize:      fontSize.displayXl,
    lineHeight:    lineHeight.displayXl,
    letterSpacing: letterSpacing.tight,
  } satisfies TextStyle,

  displayLg: {
    fontFamily:    fontFamily.bold,
    fontWeight:    fontWeight.bold,
    fontSize:      fontSize.displayLg,
    lineHeight:    lineHeight.displayLg,
    letterSpacing: letterSpacing.tighter,
  } satisfies TextStyle,

  headingLg: {
    fontFamily:    fontFamily.bold,
    fontWeight:    fontWeight.bold,
    fontSize:      fontSize.headingLg,
    lineHeight:    lineHeight.headingLg,
    letterSpacing: letterSpacing.snug,
  } satisfies TextStyle,

  headingMd: {
    fontFamily:    fontFamily.semiBold,
    fontWeight:    fontWeight.semiBold,
    fontSize:      fontSize.headingMd,
    lineHeight:    lineHeight.headingMd,
    letterSpacing: letterSpacing.snug,
  } satisfies TextStyle,

  headingSm: {
    fontFamily:    fontFamily.semiBold,
    fontWeight:    fontWeight.semiBold,
    fontSize:      fontSize.headingSm,
    lineHeight:    lineHeight.headingSm,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  bodyLg: {
    fontFamily:    fontFamily.regular,
    fontWeight:    fontWeight.regular,
    fontSize:      fontSize.bodyLg,
    lineHeight:    lineHeight.bodyLg,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  bodyLgMedium: {
    fontFamily:    fontFamily.medium,
    fontWeight:    fontWeight.medium,
    fontSize:      fontSize.bodyLg,
    lineHeight:    lineHeight.bodyLg,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  bodyMd: {
    fontFamily:    fontFamily.regular,
    fontWeight:    fontWeight.regular,
    fontSize:      fontSize.bodyMd,
    lineHeight:    lineHeight.bodyMd,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  bodyMdMedium: {
    fontFamily:    fontFamily.medium,
    fontWeight:    fontWeight.medium,
    fontSize:      fontSize.bodyMd,
    lineHeight:    lineHeight.bodyMd,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  bodySm: {
    fontFamily:    fontFamily.regular,
    fontWeight:    fontWeight.regular,
    fontSize:      fontSize.bodySm,
    lineHeight:    lineHeight.bodySm,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  bodySmMedium: {
    fontFamily:    fontFamily.medium,
    fontWeight:    fontWeight.medium,
    fontSize:      fontSize.bodySm,
    lineHeight:    lineHeight.bodySm,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  labelCaps: {
    fontFamily:    fontFamily.semiBold,
    fontWeight:    fontWeight.semiBold,
    fontSize:      11,
    lineHeight:    16,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
  } satisfies TextStyle,

  numericXl: {
    fontFamily:    fontFamily.extraBold,
    fontWeight:    fontWeight.extraBold,
    fontSize:      fontSize.displayXl,
    lineHeight:    lineHeight.displayXl,
    letterSpacing: letterSpacing.tight,
  } satisfies TextStyle,

  numericLg: {
    fontFamily:    fontFamily.bold,
    fontWeight:    fontWeight.bold,
    fontSize:      fontSize.bodyLg,
    lineHeight:    lineHeight.bodyLg,
    letterSpacing: letterSpacing.snug,
  } satisfies TextStyle,

  numericMd: {
    fontFamily:    fontFamily.medium,
    fontWeight:    fontWeight.medium,
    fontSize:      fontSize.bodyMd,
    lineHeight:    lineHeight.bodyMd,
    letterSpacing: letterSpacing.snug,
  } satisfies TextStyle,

  micro: {
    fontFamily:    fontFamily.regular,
    fontWeight:    fontWeight.regular,
    fontSize:      fontSize.micro,
    lineHeight:    lineHeight.micro,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,
} as const;
