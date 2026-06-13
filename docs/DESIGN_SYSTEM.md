# Design System

**Version:** 1.0  
**Date:** June 2026  
**Font:** Urbanist (Google Fonts / Expo Google Fonts)  
**Theme:** Dark-first

---

## Color Tokens

### Brand & Semantic Colors

| Token | Value | Usage |
|---|---|---|
| `accent.primary` | `#755DEF` | CTAs, active tabs, progress fills, links |
| `accent.secondary` | `#9B80FF` | Supporting purple, hover states, labels |
| `accent.pressed` | `#6350E0` | Button press state |
| `accent.muted` | `rgba(117,93,239,0.12)` | Chip backgrounds, card tints |
| `accent.subtle` | `rgba(117,93,239,0.06)` | Hover backgrounds |
| `income` | `#00C318` | All income values, positive gains |
| `income.bg` | `rgba(0,195,24,0.12)` | Income row backgrounds |
| `expense` | `#FF6E52` | All expense values, losses |
| `expense.bg` | `rgba(255,110,82,0.12)` | Expense row backgrounds |
| `warning` | `#FF9500` | At-risk budget (80–99%) |
| `warning.bg` | `rgba(255,149,0,0.12)` | Warning state backgrounds |
| `investment` | `#F97316` | Investment accent color |
| `analytics` | `#14B8A6` | Analytics module accent |
| `savings` | `#22C55E` | Savings goals accent |

### Semantic Rule (never break these)
- **Green** = income / gain / on-track
- **Coral** = expense / loss / over-budget
- **Orange** = warning / at-risk
- **Purple** = brand / action / neutral progress

---

### Background Tokens

| Token | Value | Usage |
|---|---|---|
| `bg.base` | `#0D0D1A` | App background (deepest level) |
| `bg.surface` | `#161625` | Cards, list rows |
| `bg.surfaceRaised` | `#1E1E30` | Elevated cards, modals |
| `bg.surfaceMuted` | `#252538` | Inputs, inactive chips |
| `bg.deepest` | `#07070F` | Status bar region, hero card base |
| `bg.hero` | `#12122A` | Hero card gradient start |
| `bg.heroEnd` | `#1A1040` | Hero card gradient end |

---

### Text Tokens

| Token | Value | Usage |
|---|---|---|
| `text.primary` | `#FFFFFF` | Main body text, values |
| `text.secondary` | `#A0A0B8` | Labels, subtitles |
| `text.muted` | `#6B6B85` | Captions, timestamps |
| `text.disabled` | `#555570` | Inactive states |
| `text.inverse` | `#0D0D1A` | Text on light surfaces |
| `text.onAccent` | `#FFFFFF` | Text on brand purple |
| `text.link` | `#9B80FF` | Inline links |

---

### Border Tokens

| Token | Value | Usage |
|---|---|---|
| `border.subtle` | `#2A2A40` | Card borders, hairline dividers |
| `border.default` | `#3D3D58` | Stronger card borders |
| `border.strong` | `#555570` | Prominent borders |
| `border.focus` | `#755DEF` | Input focus state |
| `border.error` | `#FF6E52` | Error input state |
| `border.success` | `#00C318` | Success input state |

---

## Typography Scale

**Font family:** Urbanist (all weights)

| Token | Size | Weight | Letter Spacing | Usage |
|---|---|---|---|---|
| `text.hero` | 26–32px | 700 (Bold) | -0.5px | Net worth, main financial figure |
| `text.h1` | 20px | 700 (Bold) | -0.3px | Screen titles |
| `text.h2` | 16px | 700 (Bold) | 0 | Section titles, card headers |
| `text.h3` | 14px | 600 (SemiBold) | 0 | Sub-section headers |
| `text.bodyLg` | 14px | 400 (Regular) | 0 | Primary body text |
| `text.bodyMd` | 12px | 400 (Regular) | 0 | Secondary body text |
| `text.bodySm` | 11px | 400 (Regular) | 0 | Supporting text |
| `text.label` | 10px | 700 (Bold) | +0.08em | ALL CAPS section labels |
| `text.caption` | 9px | 400 (Regular) | 0 | Timestamps, metadata |
| `text.micro` | 8px | 600 (SemiBold) | +0.04em | Badge text, tiny labels |

**Financial number rule:** All monetary values use tabular figures. In React Native, set `fontVariant: ['tabular-nums']` on all `<Text>` components displaying currency.

---

## Spacing Scale (4pt Base Grid)

| Token | Value | Usage |
|---|---|---|
| `spacing[0.5]` | 2px | Micro gaps (badge padding) |
| `spacing[1]` | 4px | Inline element gap |
| `spacing[2]` | 8px | Between list item sub-elements |
| `spacing[3]` | 12px | Standard card internal gap |
| `spacing[4]` | 16px | Horizontal page margin, card padding |
| `spacing[5]` | 20px | Section internal padding |
| `spacing[6]` | 24px | Between major sections |
| `spacing[7]` | 28px | — |
| `spacing[8]` | 32px | Large section gaps |
| `spacing[10]` | 40px | — |
| `spacing[12]` | 48px | — |
| `spacing[14]` | 56px | Tab bar height (content area) |
| `spacing[20]` | 80px | Tab bar full height |

---

## Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `borderRadius.xs` | 4px | Badges, micro elements |
| `borderRadius.sm` | 8px | Chips, tags, small buttons |
| `borderRadius.md` | 10px | List rows, compact cards |
| `borderRadius.lg` | 12px | Standard cards |
| `borderRadius.card` | 14px | Prominent cards |
| `borderRadius.cardLg` | 16px | Large cards, hero card |
| `borderRadius.input` | 12px | Text inputs |
| `borderRadius.button` | 12px | Buttons |
| `borderRadius.sheet` | 24px | Bottom sheet top corners |
| `borderRadius.full` | 9999px | Pills, avatars, circular elements |

---

## Shadow System

| Token | Usage |
|---|---|
| `shadow.card` | `0 1px 4px rgba(0,0,0,0.4)` — Standard card depth |
| `shadow.elevated` | `0 4px 16px rgba(0,0,0,0.5)` — Elevated cards, dropdowns |
| `shadow.modal` | `0 8px 32px rgba(0,0,0,0.6)` — Bottom sheets, modals |
| `shadow.hero` | `0 8px 32px rgba(117,93,239,0.15)` — Net Worth hero card glow |
| `shadow.fab` | `0 4px 20px rgba(117,93,239,0.4)` — FAB button glow |

---

## Button Variants

| Variant | Background | Border | Text | Usage |
|---|---|---|---|---|
| `primary` | Purple gradient | None | White | Main CTAs: Save, Create, Confirm |
| `secondary` | Transparent | Purple 1.5px | Purple | Secondary actions: Edit, Filter |
| `ghost` | `rgba(255,255,255,0.06)` | None | Muted | Tertiary: Cancel, Skip |
| `danger` | `rgba(255,110,82,0.15)` | Coral 1px | Coral | Destructive: Delete, Remove |

**Button sizes:**
| Size | Height | Horizontal Padding | Font Size |
|---|---|---|---|
| `sm` | 36px | 12px | 11px |
| `md` | 48px | 20px | 14px |
| `lg` | 54px | 24px | 16px |

---

## Card Variants

| Variant | Background | Border | Use Case |
|---|---|---|---|
| `hero` | Deep gradient (`#1A1040` → `#12122A`) | Purple 1px | Net Worth card, featured content |
| `surface` | `bg.surface` (#161625) | `border.subtle` | Standard content cards |
| `elevated` | `bg.surfaceRaised` (#1E1E30) | `border.default` | Modal content, elevated sections |
| `income` | `rgba(0,195,24,0.08)` | `rgba(0,195,24,0.2)` | Income summary cards |
| `expense` | `rgba(255,110,82,0.08)` | `rgba(255,110,82,0.2)` | Expense warning cards |
| `stat` | `rgba(117,93,239,0.08)` | `rgba(117,93,239,0.2)` | Metric/stat chips |

---

## Status Badge System

| Status | Background | Text | Border | Usage |
|---|---|---|---|---|
| On Track | `rgba(0,195,24,0.12)` | `#33E048` | `rgba(0,195,24,0.3)` | Goal / budget within target |
| Warning | `rgba(255,149,0,0.12)` | `#FFB040` | `rgba(255,149,0,0.3)` | Budget 80–99% used |
| Over Budget | `rgba(255,110,82,0.12)` | `#FF8068` | `rgba(255,110,82,0.3)` | Budget 100%+ |
| Forecasted | `rgba(20,184,166,0.12)` | `#2DD4BF` | `rgba(20,184,166,0.3)` | Projected/estimated values |
| Active | `rgba(0,195,24,0.12)` | `#33E048` | — | Active savings goal |
| Completed | `rgba(117,93,239,0.12)` | `#9B80FF` | — | Achieved goal |
| Inactive | `rgba(107,114,128,0.12)` | `#9CA3AF` | — | Paused / archived |

---

## Core Component Library

| Component | Description | Props |
|---|---|---|
| `NetWorthCard` | Hero gradient card with net worth + 3 sub-chips | `netWorth`, `assets`, `debts`, `investments`, `monthlyChange` |
| `HealthScoreBand` | Horizontal band with circular score + badge | `score`, `label`, `subtitle`, `onPress` |
| `CashFlowStrip` | 3-column income / expense / saved strip | `income`, `expenses`, `saved`, `month` |
| `BudgetProgressRow` | Single budget category with labeled progress bar | `name`, `spent`, `limit`, `icon`, `onPress` |
| `GoalPreviewCard` | Compact goal chip for horizontal scroll | `name`, `current`, `target`, `emoji`, `color` |
| `GoalDetailCard` | Full goal detail with ring + contributions | `goal`, `contributions`, `onContribute` |
| `TransactionRow` | Single transaction list item | `description`, `category`, `amount`, `date`, `type`, `icon` |
| `SparklineChart` | Inline SVG bar/line chart | `data`, `color`, `height`, `type` |
| `AllocationDonut` | SVG donut with legend | `slices`, `totalLabel`, `size` |
| `PeriodSelector` | Pill toggle: 1M 6M 1Y 3Y All | `value`, `onChange`, `options` |
| `MetricTile` | Stat tile with label + value + delta | `label`, `value`, `delta`, `deltaDirection` |
| `SectionHeader` | Title + optional "See All" link | `title`, `onSeeAll` |
| `CategoryBadge` | Colored icon circle + label chip | `category`, `color`, `icon` |
| `InvestmentRow` | Holdings list item with symbol + P&L | `symbol`, `name`, `shares`, `value`, `gainLoss` |
| `DebtRow` | Debt account row with balance + rate | `name`, `balance`, `annualRate`, `type`, `onPress` |
| `EmptyState` | Contextual empty state with CTA | `icon`, `title`, `subtitle`, `ctaLabel`, `onCTA` |
| `BottomSheet` | Reusable bottom sheet wrapper | `snapPoints`, `children`, `onClose` |
| `FAB` | Floating action button | `onPress`, `icon`, `label` |
| `Toast` | Non-blocking status notification | `message`, `type`, `duration` |

---

## Animation Guidelines

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Screen push | Slide left | 300ms | Ease out |
| Bottom sheet open | Slide up | 280ms | Spring (damping 28) |
| Tab switch | Cross-fade | 180ms | Ease in-out |
| Progress bar fill | Width expand | 600ms | Ease out |
| Goal ring | Arc draw | 700ms | Ease in-out |
| FAB press | Scale 0.92 | 100ms | Spring (bouncy) |
| Card press | Scale 0.97 | 100ms | Spring (gentle) |
| Number count-up | Increment | 800ms | Ease out |
| Confetti (achieved) | Particle burst | 2000ms | Physics |

**Haptic feedback triggers:**
- FAB tap → `medium` impact
- Any form save → `light` impact
- Goal milestone (25%, 50%, 75%, 100%) → `heavy` impact
- Budget over-limit warning → `notification` error
- Tab switch → `selection` feedback

---

## Accessibility

| Rule | Implementation |
|---|---|
| Minimum touch target | 44×44pt for all interactive elements |
| Color contrast | All text meets WCAG AA (4.5:1 minimum) on dark backgrounds |
| Screen reader | All monetary values read as full amount ("Four hundred twelve thousand eight hundred fifty pesos") |
| Dynamic type | Support iOS/Android font scaling up to 200% |
| Reduce motion | Respect system `prefersReducedMotion` — disable decorative animations |
| Focus indicators | Custom focus ring on web/iPad using `outline: 2px solid #755DEF` |
