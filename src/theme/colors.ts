/**
 * colors.ts — Networthy Design System
 *
 * Source of truth for every color token in the application.
 * Extracted from the Urbanist / lavender design reference.
 *
 * Palette summary (light mode):
 *   Background   #FBFBFF  — near-white with faint lavender tint
 *   Surface      #FFFFFF  — pure white cards
 *   Card accent  #DDDDFF  — light lavender feature cards
 *   Accent       #755DEF  — brand purple
 *   Income       #00C318  — vivid green
 *   Expense      #FF6E52  — warm coral (not harsh red)
 *   Text         #1A1A1A  — near-black
 */

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY COLORS  (mode-independent — always these fixed hues)
// ─────────────────────────────────────────────────────────────────────────────

export const categoryColors = {
  food:             '#F97316',   // orange
  transport:        '#3B82F6',   // blue
  shopping:         '#EC4899',   // pink
  bills:            '#EF4444',   // red
  health:           '#22C55E',   // green
  entertainment:    '#A855F7',   // purple
  education:        '#14B8A6',   // teal
  other:            '#6B7280',   // gray
  income_salary:    '#22C55E',   // green
  income_freelance: '#14B8A6',   // teal
  income_other:     '#6366F1',   // indigo
  transfer:         '#755DEF',   // brand purple
} as const;

export type CategoryKey = keyof typeof categoryColors;

// ─────────────────────────────────────────────────────────────────────────────
// LIGHT THEME COLORS
// ─────────────────────────────────────────────────────────────────────────────

export const lightColors = {

  // ── Backgrounds ────────────────────────────────────────────────────────────
  bg: {
    base:          '#FBFBFF',               // page background — light lavender
    surface:       '#FFFFFF',               // cards, list rows
    surfaceRaised: '#FFFFFF',               // modals, elevated cards
    surfaceMuted:  '#F4F4FF',               // inputs, inactive chips, chip bg
    deepest:       '#E8E8FF',               // pronounced lavender surface
    hero:          '#12122A',               // dark hero card (balance, featured)
    card:          '#DDDDFF',               // light lavender feature card
    overlay:       'rgba(0, 0, 0, 0.40)',
    scrim:         'rgba(0, 0, 0, 0.60)',
  },

  // ── Text ───────────────────────────────────────────────────────────────────
  text: {
    primary:   '#1A1A1A',                   // near-black body copy
    secondary: '#6B6B80',                   // subdued secondary text
    muted:     '#9999B0',                   // captions, timestamps
    disabled:  '#BBBBCC',                   // inactive states
    inverse:   '#FFFFFF',                   // text on dark surfaces
    onAccent:  '#FFFFFF',                   // text on purple buttons
    link:      '#755DEF',                   // inline links
  },

  // ── Brand accent ───────────────────────────────────────────────────────────
  accent: {
    primary:   '#755DEF',                   // brand purple — CTAs, active tab
    secondary: '#9B80FF',                   // lighter purple — supporting
    pressed:   '#5C46D5',                   // darker purple — tap state
    muted:     'rgba(117, 93, 239, 0.10)',  // tinted chip / icon bg
    subtle:    'rgba(117, 93, 239, 0.05)',  // very faint highlight
  },

  // ── Semantic status ────────────────────────────────────────────────────────
  income:     '#00C318',                    // vivid green
  expense:    '#FF6E52',                    // warm coral
  warning:    '#FF9500',                    // orange

  incomeBg:   'rgba(0, 195, 24,   0.10)',
  expenseBg:  'rgba(255, 110, 82, 0.10)',
  warningBg:  'rgba(255, 149, 0,  0.10)',

  incomeText: '#009E14',                    // darker green for light-bg contrast
  expenseText:'#D9502E',                    // darker coral for light-bg contrast
  warningText:'#C77000',                    // darker orange for light-bg contrast

  // ── Borders & dividers ─────────────────────────────────────────────────────
  border: {
    subtle:  '#EBEBF5',                     // hairline dividers
    default: '#D8D8EE',                     // card borders
    strong:  '#BBBBD8',                     // prominent borders
    focus:   '#755DEF',                     // focused inputs
    error:   '#FF3B30',                     // error state
    success: '#00C318',                     // success state
  },

  // ── Tab bar ────────────────────────────────────────────────────────────────
  tabBar: {
    bg:        'rgba(255, 255, 255, 0.97)',
    active:    '#755DEF',
    inactive:  '#BBBBCC',
    indicator: '#755DEF',
    border:    '#EBEBF5',
  },

  // ── Charts ─────────────────────────────────────────────────────────────────
  chart: {
    barActive:       '#755DEF',
    barInactive:     '#F4F4FF',
    lineStroke:      '#755DEF',
    lineGradientTop: 'rgba(117, 93, 239, 0.20)',
    lineGradientBot: 'rgba(117, 93, 239, 0.00)',
    gridLine:        '#EBEBF5',
    axisLabel:       '#9999B0',
    tooltipBg:       '#FFFFFF',
    tooltipBorder:   '#EBEBF5',
    tooltipText:     '#1A1A1A',
    dataPoint:       '#FFFFFF',
    dataPointBorder: '#755DEF',
  },

  // ── Skeleton shimmer ───────────────────────────────────────────────────────
  skeleton: {
    base:    '#F0F0FF',
    shimmer: '#E4E4FF',
  },

  // ── Account card gradients (indexed for LinearGradient) ───────────────────
  accountGradients: [
    ['#755DEF', '#5C46D5'] as [string, string],  // brand purple
    ['#12122A', '#1E1E3A'] as [string, string],  // dark navy
    ['#0D9488', '#0D7A6F'] as [string, string],  // teal
    ['#4F46E5', '#4338CA'] as [string, string],  // indigo
    ['#BE123C', '#9F1239'] as [string, string],  // rose
    ['#15803D', '#166534'] as [string, string],  // forest green
  ],

  transparent: 'transparent',
  white:       '#FFFFFF',
  black:       '#000000',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DARK THEME COLORS
// ─────────────────────────────────────────────────────────────────────────────

export const darkColors = {

  // ── Backgrounds ────────────────────────────────────────────────────────────
  bg: {
    base:          '#0D0D1A',               // page background
    surface:       '#161625',               // cards, list rows
    surfaceRaised: '#1E1E30',               // elevated cards, modals
    surfaceMuted:  '#252538',               // inputs, inactive chips
    deepest:       '#07070F',               // status-bar region
    hero:          '#07070F',               // dark hero cards
    card:          '#2A2A4E',               // dark lavender feature card
    overlay:       'rgba(0, 0, 0, 0.65)',
    scrim:         'rgba(0, 0, 0, 0.80)',
  },

  // ── Text ───────────────────────────────────────────────────────────────────
  text: {
    primary:   '#FFFFFF',
    secondary: '#A0A0B8',
    muted:     '#6B6B85',
    disabled:  '#555570',
    inverse:   '#0D0D1A',
    onAccent:  '#FFFFFF',
    link:      '#9B80FF',
  },

  // ── Brand accent ───────────────────────────────────────────────────────────
  accent: {
    primary:   '#755DEF',
    secondary: '#9B80FF',
    pressed:   '#6350E0',
    muted:     'rgba(117, 93, 239, 0.12)',
    subtle:    'rgba(117, 93, 239, 0.06)',
  },

  // ── Semantic status ────────────────────────────────────────────────────────
  income:     '#00C318',
  expense:    '#FF6E52',
  warning:    '#FF9500',

  incomeBg:   'rgba(0, 195, 24,   0.12)',
  expenseBg:  'rgba(255, 110, 82, 0.12)',
  warningBg:  'rgba(255, 149, 0,  0.12)',

  incomeText: '#33E048',                    // brighter green for dark bg
  expenseText:'#FF8068',                    // lighter coral for dark bg
  warningText:'#FFB040',                    // lighter orange for dark bg

  // ── Borders & dividers ─────────────────────────────────────────────────────
  border: {
    subtle:  '#2A2A40',
    default: '#3D3D58',
    strong:  '#555570',
    focus:   '#755DEF',
    error:   '#FF6E52',
    success: '#00C318',
  },

  // ── Tab bar ────────────────────────────────────────────────────────────────
  tabBar: {
    bg:        'rgba(22, 22, 37, 0.97)',
    active:    '#755DEF',
    inactive:  '#6B6B85',
    indicator: '#755DEF',
    border:    '#2A2A40',
  },

  // ── Charts ─────────────────────────────────────────────────────────────────
  chart: {
    barActive:       '#755DEF',
    barInactive:     '#1E1E30',
    lineStroke:      '#755DEF',
    lineGradientTop: 'rgba(117, 93, 239, 0.20)',
    lineGradientBot: 'rgba(117, 93, 239, 0.00)',
    gridLine:        '#2A2A40',
    axisLabel:       '#6B6B85',
    tooltipBg:       '#1E1E30',
    tooltipBorder:   '#3D3D58',
    tooltipText:     '#FFFFFF',
    dataPoint:       '#FFFFFF',
    dataPointBorder: '#755DEF',
  },

  // ── Skeleton shimmer ───────────────────────────────────────────────────────
  skeleton: {
    base:    '#1E1E30',
    shimmer: '#2A2A40',
  },

  // ── Account card gradients ────────────────────────────────────────────────
  accountGradients: [
    ['#755DEF', '#5C46D5'] as [string, string],
    ['#0F172A', '#1E293B'] as [string, string],
    ['#134E4A', '#0F766E'] as [string, string],
    ['#1E1B4B', '#312E81'] as [string, string],
    ['#450A0A', '#7F1D1D'] as [string, string],
    ['#052E16', '#14532D'] as [string, string],
  ],

  transparent: 'transparent',
  white:       '#FFFFFF',
  black:       '#000000',
} as const;
