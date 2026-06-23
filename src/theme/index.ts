/**
 * theme/index.ts — Networthy Design System
 *
 * Assembly point. Imports from token files and composes:
 *   - Component variant configurations
 *   - Theme objects (dark / light)
 *   - TypeScript type exports
 *   - Convenience helpers
 *
 * Token files:
 *   colors.ts      → lightColors, darkColors, categoryColors
 *   typography.ts  → fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, textVariants
 *   spacing.ts     → spacing
 *   shadows.ts     → lightShadows, darkShadows
 *   borderRadius.ts→ borderRadius
 */

import type { TextStyle, ViewStyle } from 'react-native';

// ── Token imports ─────────────────────────────────────────────────────────────
export {
  lightColors,
  darkColors,
  categoryColors,
  type CategoryKey,
} from './colors';
export {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  textVariants,
} from './typography';
export { spacing }    from './spacing';
export { lightShadows, darkShadows } from './shadows';
export { borderRadius } from './borderRadius';

import { lightColors, darkColors, categoryColors } from './colors';
import { fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, textVariants } from './typography';
import { spacing }    from './spacing';
import { lightShadows, darkShadows } from './shadows';
import { borderRadius } from './borderRadius';
import type { CategoryKey } from './colors';

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT CONSTANTS  (named semantic dimensions from DESIGN_SPEC)
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
  inputHeight:          54,            // slightly taller — more breathable
  tabBarHeight:         80,
  tabBarContentHeight:  56,
  headerHeight:         56,
  chipHeight:           34,            // slightly taller chips
  progressBarHeight:    8,             // slightly thicker bars
  bottomSheetHandle:    4,

  // Fixed component widths / sizes
  iconSizeXs:           16,
  iconSizeSm:           18,
  iconSizeMd:           20,
  iconSizeLg:           24,
  iconSizeXl:           28,

  iconCircleSm:         32,
  iconCircleMd:         44,            // slightly larger category icons
  iconCircleLg:         60,

  fabSize:              56,
  fabIconSize:          24,

  avatarSm:             32,
  avatarMd:             44,
  avatarLg:             60,

  // Card dimensions
  balanceCardMinH:      148,
  accountCardH:         108,
  statChipH:            88,
  analyticsCardMinH:    240,

  // List items
  listItemH:            72,            // slightly taller — more spacious
  listItemHLg:          80,

  // Accessibility
  minTouchTarget:       44,

  // Horizontal peek for swipeable cards
  accountCardPeek:      16,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION
// ─────────────────────────────────────────────────────────────────────────────

export const animation = {
  duration: {
    instant:     80,
    fast:        150,
    normal:      250,
    slow:        400,
    skeleton:    1000,
    chartDraw:   700,
    tabSwitch:   200,
  },
  spring: {
    gentle: {
      damping:   18,
      stiffness: 120,
      mass:      1.0,
      overshootClamping: false,
    },
    snappy: {
      damping:   22,
      stiffness: 280,
      mass:      0.8,
      overshootClamping: false,
    },
    bouncy: {
      damping:   12,
      stiffness: 150,
      mass:      1.0,
      overshootClamping: false,
    },
    sheet: {
      damping:   30,
      stiffness: 400,
      mass:      1.2,
      overshootClamping: true,
    },
  },
  pressScale:         0.97,
  pressOpacity:       0.80,
  disabledOpacity:    0.40,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT VARIANT CONFIGS
// ─────────────────────────────────────────────────────────────────────────────

// ── Button ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'social';
export type ButtonSize    = 'sm' | 'md' | 'lg';

export const buttonVariantConfig = {
  primary:   { hasBorder: false, borderWidth: 0 },
  secondary: { hasBorder: true,  borderWidth: 1.5 },
  ghost:     { hasBorder: false, borderWidth: 0 },
  danger:    { hasBorder: false, borderWidth: 0 },
  social:    { hasBorder: true,  borderWidth: 1 },
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
    borderRadius:       borderRadius.sm,
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
    height:             58,
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
  focused:  { borderWidth: 2,   useThemeBorderColor: 'border.focus'   as const },
  error:    { borderWidth: 1.5, useThemeBorderColor: 'border.error'   as const },
  disabled: { borderWidth: 1.0, useThemeBorderColor: 'border.subtle'  as const },
  success:  { borderWidth: 1.5, useThemeBorderColor: 'border.success' as const },
} as const satisfies Record<InputState, { borderWidth: number; useThemeBorderColor: string }>;

export const inputDimensions = {
  height:             layout.inputHeight,
  borderRadius:       borderRadius.input,
  paddingHorizontal:  spacing[4],
  paddingVertical:    spacing[3],
  labelFontSize:      fontSize.bodySm,
  labelFontFamily:    fontFamily.medium,
  inputFontSize:      fontSize.bodyLg,
  inputFontFamily:    fontFamily.regular,
  placeholderOpacity: 0.45,
  iconSize:           layout.iconSizeLg,
  trailingIconSize:   layout.iconSizeMd,
  errorFontSize:      fontSize.bodySm,
  errorFontFamily:    fontFamily.regular,
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
    borderRadius: borderRadius.card,
    padding:      layout.cardPadding,
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
    warning:  0.70,
    danger:   0.90,
    exceeded: 1.00,
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

// ── Badge ─────────────────────────────────────────────────────────────────────

export const badgeConfig = {
  dotSize:           8,
  dotRadius:         4,
  borderWidth:       2,
  countFontSize:     fontSize.micro,
  countMinWidth:     16,
  countHeight:       16,
  countBorderRadius: borderRadius.full,
  countPaddingH:     spacing[1],
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
  handleWidth:        36,
  handleHeight:       layout.bottomSheetHandle,
  handleBorderRadius: borderRadius.full,
  handleOpacity:      0.30,
  topBorderRadius:    borderRadius.cardLg,
  maxHeightFraction:  0.90,
  snapPoints: {
    quarter: '25%',
    half:    '50%',
    most:    '75%',
    full:    '90%',
  },
} as const;

// ── Tab bar ───────────────────────────────────────────────────────────────────

export const tabBarConfig = {
  height:                layout.tabBarHeight,
  contentHeight:         layout.tabBarContentHeight,
  iconSize:              layout.iconSizeLg,
  labelFontSize:         10,
  labelFontFamily:       fontFamily.medium,
  topBorderRadius:       borderRadius.sm,
  topBorderWidth:        0.5,
  rightBorderWidth:      0.5,
  leftBorderWidth:       0.5,
  itemMinWidth:          layout.minTouchTarget,
  indicatorHeight:       3,
  indicatorBorderRadius: borderRadius.full,
} as const;

// ── Toast ─────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export const toastConfig = {
  borderRadius:    borderRadius.md,
  paddingV:        spacing[3],
  paddingH:        spacing[4],
  iconSize:        layout.iconSizeMd,
  iconGap:         spacing[3],
  minHeight:       52,
  marginBottom:    spacing[4],
  marginH:         spacing[4],
  maxWidth:        400,
  borderWidth:     1,
} as const;

// ── Skeleton ──────────────────────────────────────────────────────────────────

export const skeletonConfig = {
  borderRadius:    borderRadius.sm,
  shimmerDuration: animation.duration.skeleton,
  shimmerWidth:    80,
} as const;

// ── Charts ────────────────────────────────────────────────────────────────────

export const chartConfig = {
  // Bar chart
  barBorderRadius:       borderRadius.xs,
  barMinWidth:           20,
  barMaxWidth:           40,
  barGap:                6,

  // Line chart
  lineStrokeWidth:       2.5,
  dataPointRadius:       5,
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
  height:              36,
  borderRadius:        borderRadius.full,
  padding:             3,
  segmentBorderRadius: borderRadius.full,
  labelFontSize:       fontSize.bodySm,
  labelFontFamily:     fontFamily.semiBold,
  labelFontWeight:     fontWeight.semiBold,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// BREAKPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export const breakpoints = {
  phoneSm:  320,
  phone:    375,
  phoneLg:  414,
  tablet:   768,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// OPACITY SCALE
// ─────────────────────────────────────────────────────────────────────────────

export const opacity = {
  disabled:      0.40,
  muted:         0.60,
  overlay:       0.60,
  placeholder:   0.45,
  iconBg:        0.12,   // category icon circle bg opacity
  accentBg:      0.10,
  accentBgLight: 0.06,
  chartFill:     0.20,
  tabBarBg:      0.97,
  skeletonBase:  0.07,
  skeletonPeak:  0.15,
  handleBar:     0.30,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Z-INDEX SCALE
// ─────────────────────────────────────────────────────────────────────────────

export const zIndex = {
  base:         0,
  raised:       1,
  stickyHeader: 10,
  fab:          20,
  dropdown:     30,
  tabBar:       40,
  overlay:      50,
  modal:        60,
  bottomSheet:  70,
  toast:        80,
  tooltip:      90,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// THEME ASSEMBLY
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

  // Component configs
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

export const lightTheme = {
  dark:            false    as const,
  statusBarStyle:  'dark'   as const,
  colors:          lightColors,
  shadows:         lightShadows,
  ...sharedTokens,
};

export const darkTheme = {
  dark:            true     as const,
  statusBarStyle:  'light'  as const,
  colors:          darkColors,
  shadows:         darkShadows,
  ...sharedTokens,
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPESCRIPT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type DarkTheme   = typeof darkTheme;
export type LightTheme  = typeof lightTheme;
export type Theme       = DarkTheme | LightTheme;
export type ThemeColors = typeof darkColors | typeof lightColors;
export type ThemeShadows= typeof darkShadows;
export type SharedTokens= typeof sharedTokens;
export type Colors      = ThemeColors;

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves a progress bar fill color based on consumed ratio.
 * 0.00–0.69 → accent purple
 * 0.70–0.89 → warning orange
 * 0.90+     → expense coral (over-budget)
 */
export function getProgressColor(
  ratio: number,
  colors: { expense: string; warning: string; accent: { primary: string } },
): string {
  const { warning, danger } = progressBarConfig.thresholds;
  if (ratio >= danger)   return colors.expense;
  if (ratio >= warning)  return colors.warning;
  return colors.accent.primary;
}

/**
 * Returns a 12%-opacity tinted background for a category icon circle.
 */
export function getCategoryBgColor(category: CategoryKey): string {
  const hex = categoryColors[category];
  const r   = parseInt(hex.slice(1, 3), 16);
  const g   = parseInt(hex.slice(3, 5), 16);
  const b   = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity.iconBg})`;
}

/**
 * Returns the LinearGradient color pair for an account card by index.
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
 */
export function withOpacity(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 100) / 100;
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * Returns the semantic color string for a transaction amount.
 */
export function getAmountColor(
  type: 'income' | 'expense',
  colors: { income: string; expense: string },
): string {
  return type === 'income' ? colors.income : colors.expense;
}

/**
 * Returns the sign prefix for a transaction amount.
 */
export function getAmountPrefix(type: 'income' | 'expense'): string {
  return type === 'income' ? '+' : '-';
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────────────────────────────────────

const themes = { dark: darkTheme, light: lightTheme } as const;

export default themes;
