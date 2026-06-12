/**
 * Financial Tracker — Design System
 *
 * Single source of truth for every visual token in the application.
 * All components consume tokens from this file — no raw values anywhere else.
 *
 * Structure:
 *   1.  Primitive palette      (raw hex values, never used in components directly)
 *   2.  Semantic colors        (dark + light mode token objects)
 *   3.  Category colors        (mode-independent)
 *   4.  Typography             (families, weights, sizes, line-heights, pre-composed variants)
 *   5.  Spacing scale          (8 dp base grid)
 *   6.  Layout constants       (named dimensions from the design spec)
 *   7.  Border radius          (named scale)
 *   8.  Shadows                (platform-aware iOS / Android)
 *   9.  Animation              (durations, spring configs, press feedback)
 *   10. Component variants     (button, input, card, chip, progress, icon circle, etc.)
 *   11. Breakpoints
 *   12. Opacity scale
 *   13. Z-index scale
 *   14. Theme assembly         (dark / light Theme objects)
 *   15. Type exports
 *   16. Convenience helpers
 */

import { Platform } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// 1. PRIMITIVE PALETTE
// Raw named values. Import only in this file. Components use semantic tokens.
// ─────────────────────────────────────────────────────────────────────────────

const palette = {
  // ── Neutrals ──
  black:   '#000000',
  white:   '#FFFFFF',

  // ── Deep navy scale (dark mode surfaces) ──
  navy950: '#07070F',   // deepest — used for status-bar tint
  navy900: '#0D0D1A',   // page background
  navy800: '#161625',   // card / list surface
  navy700: '#1E1E30',   // elevated card / modal surface
  navy600: '#252538',   // input field / muted chip
  navy500: '#2A2A40',   // border / divider
  navy400: '#3D3D58',   // stronger border
  navy300: '#555570',   // placeholder-ish
  navy200: '#6B6B85',   // muted text (dark)
  navy100: '#A0A0B8',   // secondary text (dark)

  // ── Violet / Purple — brand accent ──
  violet700: '#5B41D9',
  violet600: '#6D51F5',
  violet500: '#7B61FF',   // primary accent
  violet400: '#9B85FF',
  violet300: '#A78BFA',   // secondary / lighter accent
  violet200: '#C4B5FD',
  violet100: '#EDE9FE',
  violet50:  '#F5F3FF',

  // ── Green — income / positive ──
  green700: '#15803D',
  green600: '#16A34A',
  green500: '#22C55E',
  green400: '#4ADE80',
  green200: '#BBF7D0',
  green100: '#DCFCE7',

  // ── Red — expense / danger ──
  red700:   '#B91C1C',
  red600:   '#DC2626',
  red500:   '#EF4444',
  red400:   '#F87171',
  red200:   '#FECACA',
  red100:   '#FEE2E2',

  // ── Orange — warning ──
  orange700: '#C2410C',
  orange600: '#EA580C',
  orange500: '#F97316',
  orange400: '#FB923C',
  orange200: '#FED7AA',
  orange100: '#FFEDD5',

  // ── Slate scale (light mode surfaces) ──
  slate50:  '#F5F6FA',   // page background
  slate100: '#EEEEF5',   // muted surface
  slate200: '#E4E4EE',   // border / divider
  slate300: '#D1D1E0',   // stronger border
  slate400: '#B0B0C8',
  slate500: '#9999B0',   // muted text (light)
  slate600: '#5C5C78',   // secondary text (light)
  slate700: '#3D3D58',
  slate800: '#1E1E30',
  slate900: '#0D0D1A',   // primary text (light)

  // ── Category / chart hues (mode-independent) ──
  catOrange:  '#F97316',
  catBlue:    '#3B82F6',
  catPink:    '#EC4899',
  catRed:     '#EF4444',
  catGreen:   '#22C55E',
  catPurple:  '#A855F7',
  catTeal:    '#14B8A6',
  catGray:    '#6B7280',
  catIndigo:  '#6366F1',
  catYellow:  '#EAB308',
  catCyan:    '#06B6D4',
  catRose:    '#F43F5E',

  transparent: 'transparent',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2. SEMANTIC COLOR TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const darkColors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg: {
    base:          palette.navy900,          // #0D0D1A  page background
    surface:       palette.navy800,          // #161625  cards, list rows
    surfaceRaised: palette.navy700,          // #1E1E30  elevated cards, modals
    surfaceMuted:  palette.navy600,          // #252538  inputs, inactive chips
    deepest:       palette.navy950,          // #07070F  status-bar region
    overlay:       'rgba(0, 0, 0, 0.65)',    //          modal scrim
    scrim:         'rgba(0, 0, 0, 0.80)',    //          full-screen overlays
  },

  // ── Text ─────────────────────────────────────────────────────────────────
  text: {
    primary:   palette.white,               // #FFFFFF
    secondary: palette.navy100,             // #A0A0B8
    muted:     palette.navy200,             // #6B6B85
    disabled:  palette.navy300,             // #555570
    inverse:   palette.navy900,             //          text on light surface
    onAccent:  palette.white,               //          text on violet buttons
    link:      palette.violet300,           // #A78BFA
  },

  // ── Accent ───────────────────────────────────────────────────────────────
  accent: {
    primary:   palette.violet500,           // #7B61FF  CTAs, active tab, bars
    secondary: palette.violet300,           // #A78BFA  lighter / supporting
    pressed:   palette.violet600,           // #6D51F5  tap state
    muted:     'rgba(123, 97, 255, 0.12)',  //          tinted chip / icon bg
    subtle:    'rgba(123, 97, 255, 0.06)',  //          very faint highlight
  },

  // ── Semantic status ───────────────────────────────────────────────────────
  income:      palette.green500,            // #22C55E
  expense:     palette.red500,              // #EF4444
  warning:     palette.orange500,           // #F97316

  incomeBg:    'rgba(34,  197, 94,  0.12)',
  expenseBg:   'rgba(239, 68,  68,  0.12)',
  warningBg:   'rgba(249, 115, 22,  0.12)',

  incomeText:  palette.green400,
  expenseText: palette.red400,
  warningText: palette.orange400,

  // ── Borders & dividers ────────────────────────────────────────────────────
  border: {
    subtle:  palette.navy500,               // #2A2A40  default dividers
    default: palette.navy400,               // #3D3D58  card borders
    strong:  palette.navy300,               // #555570  prominent borders
    focus:   palette.violet500,             // #7B61FF  focused inputs
    error:   palette.red500,                // #EF4444  error inputs
    success: palette.green500,              // #22C55E
  },

  // ── Tab bar ───────────────────────────────────────────────────────────────
  tabBar: {
    bg:        'rgba(22, 22, 37, 0.97)',     // #161625 + near-opaque
    active:    palette.violet500,
    inactive:  palette.navy200,             // #6B6B85
    indicator: palette.violet500,
    border:    palette.navy500,
  },

  // ── Charts ────────────────────────────────────────────────────────────────
  chart: {
    barActive:       palette.violet500,
    barInactive:     palette.navy700,       // #1E1E30
    lineStroke:      palette.violet500,
    lineGradientTop: 'rgba(123, 97, 255, 0.20)',
    lineGradientBot: 'rgba(123, 97, 255, 0.00)',
    gridLine:        palette.navy500,       // #2A2A40
    axisLabel:       palette.navy200,       // #6B6B85
    tooltipBg:       palette.navy700,
    tooltipBorder:   palette.navy400,
    tooltipText:     palette.white,
    dataPoint:       palette.white,
    dataPointBorder: palette.violet500,
  },

  // ── Skeleton shimmer ──────────────────────────────────────────────────────
  skeleton: {
    base:    palette.navy700,               // #1E1E30
    shimmer: palette.navy500,               // #2A2A40
  },

  // ── Account card gradients ─────────────────────────────────────────────────
  // Indexed arrays for LinearGradient colors prop
  accountGradients: [
    [palette.violet600,  '#4338CA'] as [string, string],   // violet → indigo
    ['#0F172A',          '#1E293B'] as [string, string],   // deep navy → slate
    ['#134E4A',          '#0F766E'] as [string, string],   // dark teal
    ['#1E1B4B',          '#312E81'] as [string, string],   // dark indigo
    ['#450A0A',          '#7F1D1D'] as [string, string],   // dark red
    ['#052E16',          '#14532D'] as [string, string],   // dark green
  ],

  // ── Pass-through primitives ───────────────────────────────────────────────
  transparent: palette.transparent,
  white:       palette.white,
  black:       palette.black,
} as const;

export const lightColors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg: {
    base:          palette.slate50,          // #F5F6FA
    surface:       palette.white,            // #FFFFFF  cards
    surfaceRaised: palette.white,            // #FFFFFF  modals (stronger shadow)
    surfaceMuted:  palette.slate100,         // #EEEEF5  inputs, inactive chips
    deepest:       palette.slate200,         // #E4E4EE
    overlay:       'rgba(0, 0, 0, 0.40)',
    scrim:         'rgba(0, 0, 0, 0.60)',
  },

  // ── Text ─────────────────────────────────────────────────────────────────
  text: {
    primary:   palette.slate900,             // #0D0D1A
    secondary: palette.slate600,             // #5C5C78
    muted:     palette.slate500,             // #9999B0
    disabled:  palette.slate400,             // #B0B0C8
    inverse:   palette.white,
    onAccent:  palette.white,
    link:      palette.violet600,            // #6D51F5
  },

  // ── Accent ───────────────────────────────────────────────────────────────
  accent: {
    primary:   palette.violet500,            // #7B61FF
    secondary: palette.violet400,            // #9B85FF
    pressed:   palette.violet600,            // #6D51F5
    muted:     'rgba(123, 97, 255, 0.08)',
    subtle:    'rgba(123, 97, 255, 0.04)',
  },

  // ── Semantic status ───────────────────────────────────────────────────────
  income:      palette.green600,             // #16A34A
  expense:     palette.red600,               // #DC2626
  warning:     palette.orange600,            // #EA580C

  incomeBg:    'rgba(22,  163, 74,  0.10)',
  expenseBg:   'rgba(220, 38,  38,  0.10)',
  warningBg:   'rgba(234, 88,  12,  0.10)',

  incomeText:  palette.green600,
  expenseText: palette.red600,
  warningText: palette.orange600,

  // ── Borders ───────────────────────────────────────────────────────────────
  border: {
    subtle:  palette.slate200,               // #E4E4EE
    default: palette.slate300,               // #D1D1E0
    strong:  palette.slate400,               // #B0B0C8
    focus:   palette.violet500,
    error:   palette.red600,
    success: palette.green600,
  },

  // ── Tab bar ───────────────────────────────────────────────────────────────
  tabBar: {
    bg:        'rgba(255, 255, 255, 0.97)',
    active:    palette.violet500,
    inactive:  palette.slate500,             // #9999B0
    indicator: palette.violet500,
    border:    palette.slate200,
  },

  // ── Charts ────────────────────────────────────────────────────────────────
  chart: {
    barActive:       palette.violet500,
    barInactive:     palette.slate200,       // #E4E4EE
    lineStroke:      palette.violet500,
    lineGradientTop: 'rgba(123, 97, 255, 0.15)',
    lineGradientBot: 'rgba(123, 97, 255, 0.00)',
    gridLine:        palette.slate200,
    axisLabel:       palette.slate500,
    tooltipBg:       palette.white,
    tooltipBorder:   palette.slate200,
    tooltipText:     palette.slate900,
    dataPoint:       palette.white,
    dataPointBorder: palette.violet500,
  },

  // ── Skeleton shimmer ──────────────────────────────────────────────────────
  skeleton: {
    base:    palette.slate100,               // #EEEEF5
    shimmer: palette.slate300,               // #D1D1E0
  },

  // ── Account card gradients ─────────────────────────────────────────────────
  accountGradients: [
    [palette.violet500,  '#6D51F5'] as [string, string],
    ['#0F172A',          '#1E293B'] as [string, string],
    ['#0D9488',          '#0F766E'] as [string, string],
    ['#4F46E5',          '#4338CA'] as [string, string],
    ['#BE123C',          '#9F1239'] as [string, string],
    ['#15803D',          '#166534'] as [string, string],
  ],

  transparent: palette.transparent,
  white:       palette.white,
  black:       palette.black,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3. CATEGORY COLORS  (mode-independent — fixed brand palette)
// ─────────────────────────────────────────────────────────────────────────────

export const categoryColors = {
  food:             palette.catOrange,    // #F97316
  transport:        palette.catBlue,      // #3B82F6
  shopping:         palette.catPink,      // #EC4899
  bills:            palette.catRed,       // #EF4444
  health:           palette.catGreen,     // #22C55E
  entertainment:    palette.catPurple,    // #A855F7
  education:        palette.catTeal,      // #14B8A6
  other:            palette.catGray,      // #6B7280
  income_salary:    palette.catGreen,
  income_freelance: palette.catTeal,
  income_other:     palette.catIndigo,    // #6366F1
} as const;

export type CategoryKey = keyof typeof categoryColors;

// ─────────────────────────────────────────────────────────────────────────────
// 4. TYPOGRAPHY
// ─────────────────────────────────────────────────────────────────────────────

export const fontFamily = {
  regular:  'PlusJakartaSans-Regular',
  medium:   'PlusJakartaSans-Medium',
  semiBold: 'PlusJakartaSans-SemiBold',
  bold:     'PlusJakartaSans-Bold',
  system: Platform.select({
    ios:     'System',
    android: 'sans-serif',
    default: 'System',
  }) as string,
} as const;

export const fontWeight = {
  regular:  '400' as TextStyle['fontWeight'],
  medium:   '500' as TextStyle['fontWeight'],
  semiBold: '600' as TextStyle['fontWeight'],
  bold:     '700' as TextStyle['fontWeight'],
} as const;

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

export const lineHeight = {
  micro:      14,
  bodySm:     18,
  bodyMd:     20,
  bodyLg:     24,
  headingSm:  22,
  headingMd:  24,
  headingLg:  28,
  displayLg:  36,
  displayXl:  44,
  displayXxl: 54,
} as const;

export const letterSpacing = {
  tight:    -0.5,
  tighter:  -0.3,
  snug:     -0.2,
  normal:    0,
  wide:      0.4,
  wider:     0.8,
  widest:    1.2,
} as const;

/**
 * Pre-composed text style objects.
 * Use directly inside StyleSheet.create() — they resolve to plain RN TextStyle.
 */
export const textVariants = {
  displayXxl: {
    fontFamily:    fontFamily.bold,
    fontWeight:    fontWeight.bold,
    fontSize:      fontSize.displayXxl,
    lineHeight:    lineHeight.displayXxl,
    letterSpacing: letterSpacing.tight,
  } satisfies TextStyle,

  displayXl: {
    fontFamily:    fontFamily.bold,
    fontWeight:    fontWeight.bold,
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
    fontFamily:    fontFamily.semiBold,
    fontWeight:    fontWeight.semiBold,
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
    fontFamily:    fontFamily.medium,
    fontWeight:    fontWeight.medium,
    fontSize:      11,
    lineHeight:    16,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
  } satisfies TextStyle,

  numericXl: {
    fontFamily:    fontFamily.bold,
    fontWeight:    fontWeight.bold,
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

// ─────────────────────────────────────────────────────────────────────────────
// 5. SPACING SCALE  (8 dp base grid)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// 6. LAYOUT CONSTANTS  (named semantic dimensions from DESIGN_SPEC)
// ─────────────────────────────────────────────────────────────────────────────

export const layout = {
  // Screen margins
  screenPaddingH:       spacing[4],    // 16  horizontal page margin
  screenPaddingV:       spacing[6],    // 24  vertical page breathing room
  screenPaddingVSm:     spacing[5],    // 20

  // Card internals
  cardPadding:          spacing[5],    // 20  standard card interior
  cardPaddingSm:        spacing[4],    // 16  compact card interior
  cardGap:              spacing[3],    // 12  between cards in a list

  // Section layout
  sectionGap:           spacing[6],    // 24  between major page sections
  sectionGapSm:         spacing[4],    // 16
  itemGap:              spacing[2],    // 8   between list items
  inlineGap:            spacing[1],    // 4   between inline elements

  // Fixed component heights
  buttonHeight:         52,
  buttonHeightSm:       40,
  inputHeight:          52,
  tabBarHeight:         80,            // includes safe area
  tabBarContentHeight:  56,            // visible portion
  headerHeight:         56,
  chipHeight:           32,
  progressBarHeight:    6,
  bottomSheetHandle:    4,             // handle pill height

  // Fixed component widths / sizes
  iconSizeXs:           16,
  iconSizeSm:           18,
  iconSizeMd:           20,
  iconSizeLg:           24,
  iconSizeXl:           28,

  iconCircleSm:         32,            // small icon container
  iconCircleMd:         40,            // standard transaction / category icon
  iconCircleLg:         56,            // category picker grid cells

  fabSize:              56,
  fabIconSize:          24,

  avatarSm:             32,
  avatarMd:             40,
  avatarLg:             56,

  // Card dimensions
  balanceCardMinH:      140,
  accountCardH:         100,
  statChipH:            80,
  analyticsCardMinH:    240,           // chart area + header

  // List items
  listItemH:            68,            // standard transaction row
  listItemHLg:          76,            // tall variant

  // Accessibility
  minTouchTarget:       44,            // NFR-AC01

  // Horizontal peek for swipeable cards
  accountCardPeek:      16,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 7. BORDER RADIUS
// ─────────────────────────────────────────────────────────────────────────────

export const borderRadius = {
  none:    0,
  xs:      4,    // bar chart tops, small badges
  sm:      8,    // tooltips, small chips
  md:      12,   // inputs, dropdown selectors, date pickers
  button:  14,   // all buttons
  lg:      16,   // budget cards, stat chips
  card:    20,   // account cards, analytics chart cards
  cardLg:  24,   // balance hero card, bottom sheet top corners
  full:    9999, // fully-rounded: pills, chips, FAB, icon circles, progress bars
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 8. SHADOWS  (platform-aware)
// ─────────────────────────────────────────────────────────────────────────────

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

function shadow(
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number,
): ShadowStyle {
  if (Platform.OS === 'ios') {
    return {
      shadowColor:   color,
      shadowOffset:  { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius:  radius,
    };
  }
  return { elevation };
}

export const darkShadows = {
  none: {} as ShadowStyle,

  // Subtle lift — list items, stat chips, filter chips
  sm: shadow('#000000', 2, 0.20, 4, 2),

  // Standard card elevation
  card: shadow('#000000', 4, 0.32, 12, 6),

  // Balance hero card — prominent depth
  hero: shadow('#000000', 8, 0.45, 24, 12),

  // Bottom sheet slides up from below
  modal: shadow('#000000', -4, 0.45, 24, 20),

  // FAB — violet glow
  fab: shadow(palette.violet500, 4, 0.40, 12, 10),

  // Account card — colored ambient
  accountCard: shadow(palette.violet600, 6, 0.28, 18, 8),

  // Tooltip — floats above chart
  tooltip: shadow('#000000', 2, 0.40, 8, 5),
} as const;

export const lightShadows = {
  none: {} as ShadowStyle,

  sm: shadow('#8B8BA8', 1, 0.08, 3, 1),

  card: shadow('#8B8BA8', 2, 0.10, 8, 3),

  hero: shadow('#8B8BA8', 4, 0.12, 16, 6),

  modal: shadow('#8B8BA8', -2, 0.14, 16, 12),

  fab: shadow(palette.violet500, 4, 0.30, 12, 8),

  accountCard: shadow(palette.violet500, 4, 0.18, 12, 5),

  tooltip: shadow('#8B8BA8', 2, 0.12, 8, 4),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 9. ANIMATION
// ─────────────────────────────────────────────────────────────────────────────

export const animation = {
  duration: {
    instant:     80,    // micro interactions (icon swap)
    fast:        150,   // button press, chip select
    normal:      250,   // screen transitions, modal
    slow:        400,   // complex state changes
    skeleton:    1000,  // shimmer loop
    chartDraw:   600,   // chart draw-on from left
    tabSwitch:   200,
  },

  // Reanimated withSpring configs
  spring: {
    // Everyday interactions — smooth but responsive
    gentle: {
      damping:   18,
      stiffness: 120,
      mass:      1.0,
      overshootClamping: false,
    },
    // Navigation, card expansion — snappy
    snappy: {
      damping:   22,
      stiffness: 280,
      mass:      0.8,
      overshootClamping: false,
    },
    // FAB, badge — playful bounce
    bouncy: {
      damping:   12,
      stiffness: 150,
      mass:      1.0,
      overshootClamping: false,
    },
    // Bottom sheet drag — feels physical
    sheet: {
      damping:   30,
      stiffness: 400,
      mass:      1.2,
      overshootClamping: true,
    },
  },

  // Press feedback
  pressScale:         0.97,
  pressOpacity:       0.85,
  disabledOpacity:    0.40,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 10. COMPONENT VARIANTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Button ───────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'social';
export type ButtonSize    = 'sm' | 'md' | 'lg';

export const buttonVariantConfig = {
  primary: {
    // bg resolved from theme.colors.accent.primary at render time
    hasBorder:    false,
    borderWidth:  0,
  },
  secondary: {
    hasBorder:    true,
    borderWidth:  1.5,
  },
  ghost: {
    hasBorder:    false,
    borderWidth:  0,
  },
  danger: {
    hasBorder:    false,
    borderWidth:  0,
  },
  social: {
    hasBorder:    true,
    borderWidth:  1,
  },
} as const satisfies Record<ButtonVariant, { hasBorder: boolean; borderWidth: number }>;

export const buttonSizeConfig: Record<
  ButtonSize,
  {
    height:            number;
    paddingHorizontal: number;
    borderRadius:      number;
    fontSize:          number;
    fontFamily:        string;
    fontWeight:        TextStyle['fontWeight'];
    iconSize:          number;
    iconGap:           number;
  }
> = {
  sm: {
    height:             layout.buttonHeightSm,
    paddingHorizontal:  spacing[3],
    borderRadius:       borderRadius.md,
    fontSize:           fontSize.bodyMd,
    fontFamily:         fontFamily.semiBold,
    fontWeight:         fontWeight.semiBold,
    iconSize:           16,
    iconGap:            spacing[1],
  },
  md: {
    height:             layout.buttonHeight,
    paddingHorizontal:  spacing[5],
    borderRadius:       borderRadius.button,
    fontSize:           fontSize.bodyLg,
    fontFamily:         fontFamily.semiBold,
    fontWeight:         fontWeight.semiBold,
    iconSize:           20,
    iconGap:            spacing[2],
  },
  lg: {
    height:             56,
    paddingHorizontal:  spacing[6],
    borderRadius:       borderRadius.button,
    fontSize:           fontSize.bodyLg,
    fontFamily:         fontFamily.bold,
    fontWeight:         fontWeight.bold,
    iconSize:           22,
    iconGap:            spacing[2],
  },
} as const;

// ── Input ─────────────────────────────────────────────────────────────────────

export type InputState = 'default' | 'focused' | 'error' | 'disabled' | 'success';

export const inputStateConfig = {
  default:  { borderWidth: 1.5, useThemeBorderColor: 'border.subtle'  as const },
  focused:  { borderWidth: 1.5, useThemeBorderColor: 'border.focus'   as const },
  error:    { borderWidth: 1.5, useThemeBorderColor: 'border.error'   as const },
  disabled: { borderWidth: 1.0, useThemeBorderColor: 'border.subtle'  as const },
  success:  { borderWidth: 1.5, useThemeBorderColor: 'border.success' as const },
} as const satisfies Record<InputState, { borderWidth: number; useThemeBorderColor: string }>;

export const inputDimensions = {
  height:            layout.inputHeight,
  borderRadius:      borderRadius.md,
  paddingHorizontal: spacing[4],
  paddingVertical:   spacing[3],
  labelFontSize:     fontSize.bodyMd,
  labelFontFamily:   fontFamily.medium,
  inputFontSize:     fontSize.bodyLg,
  inputFontFamily:   fontFamily.regular,
  placeholderOpacity: 0.45,
  iconSize:          layout.iconSizeLg,
  trailingIconSize:  layout.iconSizeMd,
  errorFontSize:     fontSize.bodySm,
  errorFontFamily:   fontFamily.regular,
} as const;

// ── Card ──────────────────────────────────────────────────────────────────────

export type CardVariant = 'default' | 'hero' | 'account' | 'stat' | 'chart' | 'budget';

export const cardVariantConfig: Record<
  CardVariant,
  { borderRadius: number; padding: number; minHeight?: number }
> = {
  default: {
    borderRadius: borderRadius.lg,
    padding:      layout.cardPaddingSm,
  },
  hero: {
    borderRadius: borderRadius.cardLg,
    padding:      layout.cardPadding,
    minHeight:    layout.balanceCardMinH,
  },
  account: {
    borderRadius: borderRadius.card,
    padding:      layout.cardPadding,
    minHeight:    layout.accountCardH,
  },
  stat: {
    borderRadius: borderRadius.lg,
    padding:      layout.cardPaddingSm,
    minHeight:    layout.statChipH,
  },
  chart: {
    borderRadius: borderRadius.card,
    padding:      layout.cardPadding,
    minHeight:    layout.analyticsCardMinH,
  },
  budget: {
    borderRadius: borderRadius.lg,
    padding:      layout.cardPaddingSm,
  },
} as const;

// ── Chip / Filter pill ────────────────────────────────────────────────────────

export const chipConfig = {
  height:            layout.chipHeight,
  borderRadius:      borderRadius.full,
  paddingHorizontal: spacing[3],
  gap:               spacing[1],
  fontSize:          fontSize.bodySm,
  fontFamily:        fontFamily.medium,
  fontWeight:        fontWeight.medium,
  borderWidth:       1.5,
} as const;

// ── Progress bar ──────────────────────────────────────────────────────────────

export const progressBarConfig = {
  height:            layout.progressBarHeight,
  borderRadius:      borderRadius.full,
  thresholds: {
    warning:  0.70,   // accent → warning orange at 70%
    danger:   0.90,   // warning orange → red at 90%
    exceeded: 1.00,   // overspent
  },
  overflowSegmentOpacity: 0.35,
} as const;

// ── Icon circle ───────────────────────────────────────────────────────────────

export type IconCircleSize = 'sm' | 'md' | 'lg';

export const iconCircleConfig: Record<
  IconCircleSize,
  { containerSize: number; iconSize: number; borderRadius: number }
> = {
  sm: { containerSize: layout.iconCircleSm, iconSize: layout.iconSizeXs, borderRadius: borderRadius.full },
  md: { containerSize: layout.iconCircleMd, iconSize: layout.iconSizeMd, borderRadius: borderRadius.full },
  lg: { containerSize: layout.iconCircleLg, iconSize: layout.iconSizeLg, borderRadius: borderRadius.full },
} as const;

// ── Badge (notification dot) ──────────────────────────────────────────────────

export const badgeConfig = {
  dotSize:       8,
  dotRadius:     4,
  borderWidth:   2,    // border matches surface bg — creates separation illusion
  countFontSize: fontSize.micro,
  countMinWidth: 16,
  countHeight:   16,
  countBorderRadius: borderRadius.full,
  countPaddingH: spacing[1],
} as const;

// ── Avatar ────────────────────────────────────────────────────────────────────

export type AvatarSize = 'sm' | 'md' | 'lg';

export const avatarConfig: Record<
  AvatarSize,
  { size: number; borderRadius: number; fontSize: number; fontFamily: string }
> = {
  sm: { size: layout.avatarSm, borderRadius: borderRadius.full, fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold },
  md: { size: layout.avatarMd, borderRadius: borderRadius.full, fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold },
  lg: { size: layout.avatarLg, borderRadius: borderRadius.full, fontSize: fontSize.bodyLg, fontFamily: fontFamily.bold    },
} as const;

// ── Bottom sheet ──────────────────────────────────────────────────────────────

export const bottomSheetConfig = {
  handleWidth:       36,
  handleHeight:      layout.bottomSheetHandle,
  handleBorderRadius: borderRadius.full,
  handleOpacity:     0.35,
  topBorderRadius:   borderRadius.cardLg,    // 24
  maxHeightFraction: 0.90,
  snapPoints: {
    quarter: '25%',
    half:    '50%',
    most:    '75%',
    full:    '90%',
  },
} as const;

// ── Tab bar ───────────────────────────────────────────────────────────────────

export const tabBarConfig = {
  height:             layout.tabBarHeight,
  contentHeight:      layout.tabBarContentHeight,
  iconSize:           layout.iconSizeLg,
  labelFontSize:      10,
  labelFontFamily:    fontFamily.medium,
  topBorderRadius:    borderRadius.sm,
  topBorderWidth:     0.5,
  itemMinWidth:       layout.minTouchTarget,
  indicatorHeight:    2,
  indicatorBorderRadius: borderRadius.full,
} as const;

// ── Toast ─────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export const toastConfig = {
  borderRadius:      borderRadius.md,
  paddingV:          spacing[3],
  paddingH:          spacing[4],
  iconSize:          layout.iconSizeMd,
  iconGap:           spacing[3],
  minHeight:         52,
  marginBottom:      spacing[4],
  marginH:           spacing[4],
  maxWidth:          400,
  borderWidth:       1,
} as const;

// ── Skeleton ──────────────────────────────────────────────────────────────────

export const skeletonConfig = {
  borderRadius:      borderRadius.sm,
  shimmerDuration:   animation.duration.skeleton,
  shimmerWidth:      80,    // shimmer highlight band width (dp)
} as const;

// ── Charts ────────────────────────────────────────────────────────────────────

export const chartConfig = {
  // Bar chart
  barBorderRadius:       borderRadius.xs,   // 4 — rounded bar tops
  barMinWidth:           24,
  barMaxWidth:           40,
  barGap:                6,

  // Line chart
  lineStrokeWidth:       2,
  dataPointRadius:       6,
  dataPointBorderWidth:  2,
  lineGradientOpacity:   0.20,

  // Donut / pie
  donutOuterRadius:      80,
  donutInnerRadius:      52,
  donutArcGap:           2,
  donutCenterLabelOffset: 4,

  // Axes & grid
  gridLineWidth:         1,
  axisLabelFontSize:     fontSize.bodySm,
  axisLabelFontFamily:   fontFamily.regular,
  yAxisLabelWidth:       44,
  xAxisHeight:           24,

  // Tooltip
  tooltipPaddingV:       spacing[2],
  tooltipPaddingH:       spacing[3],
  tooltipBorderRadius:   borderRadius.sm,
  tooltipBorderWidth:    1,

  // Legend
  legendDotSize:         10,
  legendDotRadius:       5,
  legendGap:             spacing[2],
  legendFontSize:        fontSize.bodySm,
  legendFontFamily:      fontFamily.medium,

  // Animation
  drawDuration:          animation.duration.chartDraw,
} as const;

// ── Pill toggle (period selector) ─────────────────────────────────────────────

export const pillToggleConfig = {
  height:            34,
  borderRadius:      borderRadius.full,
  padding:           2,
  segmentBorderRadius: borderRadius.full,
  labelFontSize:     fontSize.bodySm,
  labelFontFamily:   fontFamily.medium,
  labelFontWeight:   fontWeight.medium,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 11. BREAKPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export const breakpoints = {
  phoneSm:  320,   // iPhone SE — compact single-column
  phone:    375,   // Design baseline (iPhone 14, Pixel 7)
  phoneLg:  414,   // iPhone Pro Max, large Androids
  tablet:   768,   // iPad / Android tablet — navigation rail
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 12. OPACITY SCALE
// ─────────────────────────────────────────────────────────────────────────────

export const opacity = {
  disabled:        0.40,
  muted:           0.60,
  overlay:         0.60,
  placeholder:     0.45,
  iconBg:          0.15,   // category icon circle background
  accentBg:        0.12,   // accent-tinted surfaces (dark) / 0.08 light
  accentBgLight:   0.08,
  chartFill:       0.20,   // line chart gradient under-fill
  tabBarBg:        0.97,
  skeletonBase:    0.07,
  skeletonPeak:    0.15,
  handleBar:       0.35,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 13. Z-INDEX SCALE
// ─────────────────────────────────────────────────────────────────────────────

export const zIndex = {
  base:        0,
  raised:      1,
  stickyHeader: 10,
  fab:         20,
  dropdown:    30,
  tabBar:      40,
  overlay:     50,
  modal:       60,
  bottomSheet: 70,
  toast:       80,
  tooltip:     90,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 14. THEME ASSEMBLY
// Combines mode-specific (colors, shadows, skeleton) with shared tokens.
// ─────────────────────────────────────────────────────────────────────────────

const sharedTokens = {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  textVariants,
  spacing,
  layout,
  borderRadius,
  animation,
  breakpoints,
  opacity,
  zIndex,
  categoryColors,

  // Component config
  buttonVariantConfig,
  buttonSizeConfig,
  inputStateConfig,
  inputDimensions,
  cardVariantConfig,
  chipConfig,
  progressBarConfig,
  iconCircleConfig,
  badgeConfig,
  avatarConfig,
  bottomSheetConfig,
  tabBarConfig,
  toastConfig,
  skeletonConfig,
  chartConfig,
  pillToggleConfig,
} as const;

export const darkTheme = {
  dark:    true  as const,
  colors:  darkColors,
  shadows: darkShadows,
  ...sharedTokens,
};

export const lightTheme = {
  dark:    false as const,
  colors:  lightColors,
  shadows: lightShadows,
  ...sharedTokens,
};

// ─────────────────────────────────────────────────────────────────────────────
// 15. TYPESCRIPT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type DarkTheme  = typeof darkTheme;
export type LightTheme = typeof lightTheme;
export type Theme      = DarkTheme | LightTheme;

// Narrowed color types (same shape, different values)
export type ThemeColors  = typeof darkColors;
export type ThemeShadows = typeof darkShadows;
export type SharedTokens = typeof sharedTokens;

// Extract the colors type for use in StyleSheet callbacks
export type Colors = ThemeColors;

// ─────────────────────────────────────────────────────────────────────────────
// 16. CONVENIENCE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the hex color string for a budget progress bar based on
 * the consumed ratio (0–1+). Returns accent, warning, or expense color.
 */
export function getProgressColor(ratio: number, colors: ThemeColors): string {
  const { warning, danger } = progressBarConfig.thresholds;
  if (ratio >= danger)   return colors.expense;
  if (ratio >= warning)  return colors.warning;
  return colors.accent.primary;
}

/**
 * Returns the icon-circle background color string for a given category.
 * Applies the standard 15% opacity tint automatically.
 *
 * @example
 *   backgroundColor: getCategoryBgColor('food') // 'rgba(249,115,22,0.15)'
 */
export function getCategoryBgColor(category: CategoryKey): string {
  const hex = categoryColors[category];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity.iconBg})`;
}

/**
 * Returns the gradient color pair for an account card by index.
 * Cycles through the available gradients if index exceeds the array.
 */
export function getAccountCardGradient(
  index: number,
  dark: boolean,
): [string, string] {
  const gradients = dark
    ? darkColors.accountGradients
    : lightColors.accountGradients;
  return gradients[index % gradients.length];
}

/**
 * Converts a hex color + alpha (0–1) to an rgba() string.
 * Useful for one-off transparent variants not covered by the palette.
 *
 * @example
 *   withOpacity('#7B61FF', 0.12) // 'rgba(123,97,255,0.12)'
 */
export function withOpacity(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 100) / 100;
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * Determines the appropriate semantic color for an income/expense amount.
 * Returns the theme's income or expense color string.
 */
export function getAmountColor(
  type: 'income' | 'expense',
  colors: ThemeColors,
): string {
  return type === 'income' ? colors.income : colors.expense;
}

/**
 * Returns a formatted prefix symbol for an amount based on transaction type.
 */
export function getAmountPrefix(type: 'income' | 'expense'): string {
  return type === 'income' ? '+' : '-';
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────────────────────────────────────

const themes = { dark: darkTheme, light: lightTheme } as const;

export default themes;
