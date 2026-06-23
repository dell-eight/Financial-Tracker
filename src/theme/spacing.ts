/**
 * spacing.ts — Networthy Design System
 *
 * 4-point base grid. Every value is a multiple of 4.
 * Use named constants (spacing[4] = 16dp) rather than hardcoded numbers.
 *
 * Reference from the design spec:
 *   4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48
 */

export const spacing = {
  0:    0,
  px:   1,
  0.5:  2,
  1:    4,
  1.5:  6,
  2:    8,
  2.5:  10,
  3:    12,
  3.5:  14,
  4:    16,
  4.5:  18,
  5:    20,
  6:    24,
  7:    28,
  8:    32,
  9:    36,
  10:   40,
  11:   44,
  12:   48,
  14:   56,
  16:   64,
  18:   72,
  20:   80,
  24:   96,
  28:   112,
  32:   128,
} as const;
