/**
 * borderRadius.ts — Networthy Design System
 *
 * Generous border radii for a modern, friendly fintech aesthetic.
 * Inspired by Revolut, Monzo, and Wealthfront visual language.
 *
 * Scale:
 *   none  →  0   hard corners (dividers, full-bleed)
 *   xs    →  4   bar chart tops, small badges
 *   sm    →  8   tooltips, small chips, tags
 *   md    → 12   inputs, dropdown selectors, date pickers
 *   input → 14   form inputs (slightly more than md)
 *   button→ 16   all buttons — modern rounded rectangle
 *   lg    → 16   budget cards, stat chips
 *   card  → 20   account cards, analytics chart cards
 *   cardLg→ 24   balance hero card, bottom sheet corners
 *   full  → 9999 fully-rounded — pills, chips, FAB, icon circles
 */

export const borderRadius = {
  none:    0,
  xs:      4,
  sm:      8,
  md:      12,
  input:   14,
  button:  16,
  lg:      16,
  card:    20,
  cardLg:  24,
  full:    9999,
} as const;
