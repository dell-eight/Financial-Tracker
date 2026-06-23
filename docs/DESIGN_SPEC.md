# DESIGN_SPEC.md — Networthy App
> Derived from high-fidelity mobile UI design reference. Platform: iOS/Android (React Native).

---

## 1. Product Purpose

A personal finance management mobile application that gives users a unified view of their accounts, spending, budgets, and financial trends. The core value proposition is clarity — surfacing where money goes through visual budgets, categorized expenses, and analytics — so users can make better daily spending decisions.

---

## 2. User Journey

```
App Launch
    │
    ▼
Splash / Onboarding (first-time only)
    │
    ├─► Social Auth (Google / Apple)
    │       │
    └─► Email Auth (Sign Up / Sign In)
            │
            ▼
        Dashboard (Home)
            │
            ├─► Budget Management
            │       ├─► View all budgets
            │       └─► Add / edit budget category
            │
            ├─► Expense Tracker
            │       ├─► View all expenses
            │       └─► Add new expense
            │
            ├─► Analytics
            │       ├─► Monthly overview
            │       ├─► Category breakdown
            │       └─► Trend charts
            │
            └─► Profile / Settings
```

---

## 3. Screen Inventory

| # | Screen Name            | Mode       | Category        |
|---|------------------------|------------|-----------------|
| 1 | Splash / Welcome       | Light      | Onboarding      |
| 2 | Sign In                | Light      | Authentication  |
| 3 | Sign Up                | Light      | Authentication  |
| 4 | Dashboard (Home)       | Dark       | Core            |
| 5 | Dashboard (Home)       | Light      | Core (alt)      |
| 6 | Budget Overview        | Light      | Budget          |
| 7 | Add Budget             | Light      | Budget          |
| 8 | Expense List           | Dark       | Expenses        |
| 9 | Add Expense            | Light      | Expenses        |
| 10| Analytics Overview     | Dark       | Analytics       |
| 11| Analytics Detail       | Light      | Analytics       |

---

## 4. Navigation Structure

### Bottom Tab Bar (persistent, all authenticated screens)

| Tab       | Icon              | Screen Destination |
|-----------|-------------------|--------------------|
| Home      | House/grid icon   | Dashboard          |
| Budget    | Pie / chart icon  | Budget Overview    |
| Expenses  | Receipt / list    | Expense List       |
| Analytics | Bar chart         | Analytics Overview |
| Profile   | Person / avatar   | Profile / Settings |

**Behavior:**
- Active tab: Accent color fill + label visible
- Inactive tabs: Muted gray icon, no label (or dimmed label)
- Tab bar background: Semi-opaque dark surface (dark mode) / white surface (light mode)
- Tab bar has rounded top corners (12–16 dp radius)
- Safe-area inset respected at bottom (home indicator zone)

### Header Navigation
- Most screens use a back-arrow `<` top-left for modal/pushed screens
- Primary screens (tabs) have no back arrow, only title + optional action icon (notifications bell, filter icon)

---

## 5. Authentication Flow

### 5a. Splash / Welcome Screen

**Purpose:** Brand introduction, entry point to auth.

**Components:**
- Full-bleed gradient background (deep navy → slightly lighter navy)
- App logo / wordmark centered
- Tagline text beneath logo
- "Get Started" primary CTA button
- "Already have an account? Sign In" text link below

**User Actions:** Tap Get Started → Sign Up | Tap Sign In link → Sign In

---

### 5b. Sign In Screen

**Purpose:** Returning user authentication.

**Components:**
- Screen title: "Welcome Back" (large, bold)
- Subtitle: "Sign in to continue" (small, muted)
- Email input field
- Password input field (with show/hide toggle eye icon)
- "Forgot Password?" text link (right-aligned, below password)
- Primary button: "Sign In"
- Divider: "— or continue with —"
- Social auth row: Google button + Apple button (icon + label, pill shape)
- Footer: "Don't have an account? Sign Up" text link

**Data Displayed:** None (input only)

**User Actions:** Enter credentials → Sign In | Social auth | Navigate to Sign Up | Forgot password flow

---

### 5c. Sign Up Screen

**Purpose:** New user registration.

**Components:**
- Screen title: "Create Account"
- Full Name input field
- Email input field
- Password input field (show/hide toggle)
- Confirm Password input field
- Primary button: "Create Account"
- Divider: "— or continue with —"
- Social auth row: Google + Apple
- Footer: "Already have an account? Sign In"

**User Actions:** Fill form → Submit | Social registration | Navigate to Sign In

---

## 6. Dashboard Features

### 6a. Dashboard — Dark Mode (Primary)

**Purpose:** Central financial overview — the home base after login.

**Layout (top to bottom):**

#### Header Zone
- Greeting text: "Good Morning, [Name]" — small, muted
- Notification bell icon — top right
- Avatar / profile thumbnail — top right corner

#### Total Balance Card
- Label: "Total Balance" — small caps / muted
- Balance value: Large display number (e.g. **$12,922.84**) — dominant, white, heaviest weight
- Month-over-month delta indicator: e.g. "▲ +2.4% this month" — accent green or red
- Card background: Dark navy surface with subtle gradient or glassmorphism effect
- Rounded corners: 20–24 dp

#### Account Cards (Horizontal Scroll)
- Card style: Gradient-fill pill/card (e.g. deep purple-to-indigo or navy-to-charcoal)
- Each card shows:
  - Bank logo or institution name (e.g. "Citibank")
  - Masked card number: •••• •••• •••• 4242
  - Card balance
  - Card type label (Debit / Credit)
- Horizontal swipe gesture to view multiple linked accounts

#### Income / Expense Summary Row
- Two stat chips side by side:
  - **Income:** green upward arrow + formatted amount
  - **Expense:** red downward arrow + formatted amount
- Chip background: slightly lighter than page background, rounded pill

#### Recent Transactions Section
- Section header: "Recent Transactions" — medium weight, left-aligned + "See All" link right-aligned
- Transaction list items (see Reusable UI Patterns § Transaction Item)
- Shows last 4–6 transactions
- Each row: category icon (colored circle) | merchant name + category label | date | amount

**User Actions:**
- Tap account card → Account Detail
- Tap "See All" → Full Transaction List
- Tap individual transaction → Transaction Detail
- Pull to refresh

---

### 6b. Dashboard — Light Mode (Alternate)

Identical layout to dark mode. Color inversions:
- Page background: `#F5F6FA` (off-white)
- Cards: Pure white with drop shadow
- Text: Near-black primary, medium-gray secondary
- Balance amount: Near-black

---

## 7. Budget Management Features

### 7a. Budget Overview Screen

**Purpose:** Show all active budget categories and consumption progress.

**Layout:**

#### Header
- Title: "My Budget" — large, bold
- Month selector / filter: e.g. "June 2026 ▾" — tappable dropdown
- "+" add button — top right

#### Budget Summary Card
- Total budget set vs. total spent
- Circular or donut progress indicator (large, centered on card)
- Remaining amount label beneath
- Card style: white with shadow (light) or dark surface (dark)

#### Budget Category List
- Each category row:
  - Category icon (colored background circle)
  - Category name (e.g. Food, Transport, Shopping, Bills)
  - Allocated amount (e.g. "$500.00")
  - Spent amount (e.g. "$320.00 spent")
  - Linear progress bar (fills left to right, color changes red when >80%)
  - Remaining label (e.g. "$180.00 left")
- Tapping row → Category detail / edit

**User Actions:**
- Tap "+" → Add Budget modal
- Tap category row → Edit budget
- Change month → Reload budget data

---

### 7b. Add Budget Screen

**Purpose:** Create a new budget category with spending limit.

**Components:**
- Modal or pushed screen with back arrow
- Title: "Add New Budget"
- Category selector: icon grid or dropdown (Food, Transport, Health, Shopping, Entertainment, Bills, Other)
- "Budget Name" text input
- "Budget Limit" numeric input (currency-formatted, keyboard type: numeric)
- "Start Date" and "End Date" date pickers (or current month pre-selected)
- Color / icon picker row for personalization
- Primary CTA: "Create Budget" button
- Cancel / back navigation

**User Actions:** Select category → Set limit → Save

---

## 8. Expense Tracking Features

### 8a. Expense List Screen

**Purpose:** Chronological log of all expenses with filter/search.

**Layout:**

#### Header
- Title: "Expenses"
- Search icon (top right) — expands to inline search bar
- Filter icon — opens filter bottom sheet

#### Filter / Sort Chips (horizontal scroll below header)
- Chips: "All" | "Food" | "Transport" | "Shopping" | "Bills" | "Health" …
- Active chip: accent-colored background, white text
- Inactive chip: outline style, muted text

#### Expense Group by Date
- Date group label: "Today", "Yesterday", "Jun 10" — small, bold, muted
- Under each date: list of expense items

#### Expense List Item
- Category icon (colored circle, white icon inside)
- Merchant / description (primary text)
- Category label (secondary text, smaller, muted)
- Amount — right-aligned, bold, red (expense) or green (income)
- Time — small, muted, below amount

**User Actions:**
- Tap item → Expense Detail
- Tap "+" FAB (floating action button) → Add Expense
- Search → filter list
- Filter chip → category filter

---

### 8b. Add Expense Screen

**Purpose:** Log a new expense.

**Components:**
- Title: "Add Expense"
- Amount input — large center-display numeric input (styled like a calculator display)
- Category picker — icon grid, 2–3 columns, horizontally scrollable
- "Note / Description" text input
- "Date" picker (defaults to today)
- "Payment Method" selector (linked accounts / cash)
- Optional: Receipt photo attachment icon
- Primary CTA: "Add Expense" button (full width)
- Cancel

**User Actions:** Enter amount → Pick category → Add note → Save

---

## 9. Analytics Features

### 9a. Analytics Overview Screen

**Purpose:** Visual summary of spending patterns over time.

**Layout:**

#### Header
- Title: "Analytics"
- Period selector: "Weekly" | "Monthly" | "Yearly" pill toggle

#### Total Spending Card
- Prominent amount display for selected period
- Comparison text: "vs last month: ▼ 12% less" — green or red delta

#### Bar Chart — Spending by Week/Day
- Grouped or single bar chart
- X-axis: days of week or weeks of month
- Y-axis: dollar amounts (abbreviated: $0, $500, $1k)
- Selected bar: accent color, others: muted
- Tooltip on tap: date + amount

#### Line Chart — Balance Trend
- Smooth curved line chart
- X-axis: dates
- Y-axis: balance values
- Gradient fill below line (accent color at 20% opacity → transparent)

#### Category Donut Chart
- Donut/pie chart with legend
- Each slice: category color
- Center label: total
- Legend: color swatch + category name + percentage + amount

#### Top Spending Categories
- Ranked list (top 3–5)
- Rank number | icon | category name | amount | percentage bar

**User Actions:**
- Toggle period → Refresh charts
- Tap chart segment → Category drill-down
- Tap category row → Category expense list

---

### 9b. Analytics Detail / Drill-Down Screen

**Purpose:** Deep-dive into a specific category's spending over time.

**Components:**
- Back arrow + category name as title
- Date range shown (e.g. "June 2026")
- Total spent in category for period
- Line or bar chart for category only
- List of all transactions in category for period (same transaction item component)

---

## 10. Reusable UI Patterns

### Transaction Item
```
[ Icon Circle ]  Merchant Name          $-42.50
                 Category · Jun 12      ▼ red
```
- Height: 64–72 dp
- Divider: 1 dp line at bottom (muted, 10% opacity)
- Tap state: background highlight (8% accent overlay)

### Section Header Row
```
Section Title                         See All >
```
- Title: 14sp, SemiBold, primary text
- Link: 12sp, Regular, accent color

### Stat Chip (Income / Expense summary)
```
╭──────────────────╮
│ ↑ Income         │
│ $4,200.00        │
╰──────────────────╯
```
- Background: surface-variant
- Border-radius: 12 dp
- Padding: 12dp horizontal, 10dp vertical

### Progress Bar (Budget)
- Height: 6 dp
- Background: surface track (muted)
- Fill: accent color → transitions to orange (>70%) → red (>90%)
- Border-radius: 3 dp (fully rounded ends)

### Category Icon Circle
- Size: 40×40 dp
- Background: category color at 15% opacity
- Icon: category color at 100% opacity, 20dp icon size
- Border-radius: 50% (circle)

### Bottom Sheet Modal
- Drag handle: 4×36 dp pill, centered, muted color
- Corner radius top: 24 dp
- Background: surface (dark/light based on mode)
- Max height: 90% of screen
- Dismiss: drag down or tap scrim

---

## 11. Typography Hierarchy

| Token          | Size  | Weight     | Line Height | Usage                              |
|----------------|-------|------------|-------------|------------------------------------|
| display-xl     | 36sp  | Bold (700) | 44          | Total balance hero number          |
| display-lg     | 28sp  | Bold (700) | 36          | Screen-level large amounts         |
| heading-lg     | 22sp  | SemiBold (600) | 28     | Screen titles                      |
| heading-md     | 18sp  | SemiBold (600) | 24     | Section titles, card headers       |
| heading-sm     | 16sp  | SemiBold (600) | 22     | List section labels                |
| body-lg        | 16sp  | Regular (400)  | 24     | Primary list text, form labels     |
| body-md        | 14sp  | Regular (400)  | 20     | Secondary text, descriptions       |
| body-sm        | 12sp  | Regular (400)  | 18     | Timestamps, captions, hints        |
| label-caps     | 11sp  | Medium (500)   | 16     | All-caps category labels, chips    |
| numeric-bold   | 16sp  | Bold (700)     | 20     | Expense/income amounts in lists    |

**Font Family:** System font stack — SF Pro (iOS) / Roboto (Android), or a custom geometric sans-serif (Inter or Plus Jakarta Sans recommended based on design aesthetic).

---

## 12. Color Palette

### Dark Mode (Primary)

| Token                 | Value         | Usage                              |
|-----------------------|---------------|------------------------------------|
| bg-base               | `#0D0D1A`     | Page background                    |
| bg-surface            | `#161625`     | Card, list backgrounds             |
| bg-surface-raised     | `#1E1E30`     | Elevated cards, modals             |
| bg-surface-muted      | `#252538`     | Input fields, chips                |
| accent-primary        | `#7B61FF`     | CTAs, active tab, progress bars    |
| accent-secondary      | `#A78BFA`     | Lighter accent, hover states       |
| income-green          | `#22C55E`     | Income amounts, positive deltas    |
| expense-red           | `#EF4444`     | Expense amounts, overspent budgets |
| warning-orange        | `#F97316`     | Budget approaching limit           |
| text-primary          | `#FFFFFF`     | Main content text                  |
| text-secondary        | `#A0A0B8`     | Supporting text, labels            |
| text-muted            | `#6B6B85`     | Timestamps, placeholders           |
| border-subtle         | `#2A2A40`     | Dividers, card borders             |

### Light Mode (Alternate)

| Token                 | Value         | Usage                              |
|-----------------------|---------------|------------------------------------|
| bg-base               | `#F5F6FA`     | Page background                    |
| bg-surface            | `#FFFFFF`     | Cards, list items                  |
| bg-surface-raised     | `#FFFFFF`     | Modals (with stronger shadow)      |
| bg-surface-muted      | `#EEEEF5`     | Input fields, chips                |
| accent-primary        | `#7B61FF`     | Same accent (consistent brand)     |
| text-primary          | `#0D0D1A`     | Main content text                  |
| text-secondary        | `#5C5C78`     | Supporting text                    |
| text-muted            | `#9999B0`     | Timestamps, placeholders           |
| border-subtle         | `#E4E4EE`     | Dividers                           |

### Category Colors

| Category      | Color       |
|---------------|-------------|
| Food          | `#F97316`   |
| Transport     | `#3B82F6`   |
| Shopping      | `#EC4899`   |
| Bills         | `#EF4444`   |
| Health        | `#22C55E`   |
| Entertainment | `#A855F7`   |
| Education     | `#14B8A6`   |
| Other         | `#6B7280`   |

---

## 13. Spacing System

Based on an 8dp base grid:

| Token   | Value | Usage                                      |
|---------|-------|--------------------------------------------|
| space-1 | 4dp   | Tight internal padding (icon gap, badge)   |
| space-2 | 8dp   | Component internal padding (chips, tags)   |
| space-3 | 12dp  | Small gaps between related elements        |
| space-4 | 16dp  | Standard horizontal page margin            |
| space-5 | 20dp  | Card internal padding                      |
| space-6 | 24dp  | Section vertical spacing                   |
| space-8 | 32dp  | Between major sections                     |
| space-10| 40dp  | Screen top padding (below status bar)      |

**Page Horizontal Margin:** 16dp (space-4) left and right on all screens.

**Card Internal Padding:** 20dp (space-5) all sides.

**List Item Height:** 64–72dp, with 16dp horizontal padding.

**Bottom Tab Bar Height:** 80dp including safe area inset.

---

## 14. Card Components

### Balance Hero Card
- Width: full-width minus 32dp (16dp margin each side)
- Min height: 140dp
- Background: gradient (dark mode: `#1E1E30` → `#161625`; with optional subtle noise texture)
- Border-radius: 24dp
- Shadow: `0 8px 24px rgba(0,0,0,0.4)` (dark) / `0 4px 16px rgba(0,0,0,0.08)` (light)
- Content: label (top-left) + balance (center) + delta chip (bottom)

### Account Card (Swipeable)
- Width: ~80% of screen
- Height: 100dp
- Background: linear gradient (purple-to-indigo, or dark-navy-to-charcoal; per bank)
- Border-radius: 20dp
- Contains: bank logo (top-left), masked PAN (center), balance (bottom-left), card type badge (bottom-right)
- Horizontal peek: next card visible at 16dp

### Budget Category Card
- Width: full-width
- Background: surface
- Border-radius: 16dp
- Internal padding: 16dp
- Contains: icon + name + amounts + progress bar

### Stat Summary Card (Income/Expense pair)
- Width: (screen - 48dp) / 2 (two columns, 16dp gap between)
- Height: 80dp
- Background: surface-muted
- Border-radius: 16dp
- Contains: arrow icon + label + amount

### Analytics Chart Card
- Full width
- Min height: 200dp (chart area) + 40dp header
- Background: surface
- Border-radius: 20dp
- Contains: card header (title + period toggle) + chart

---

## 15. Input Components

### Text Input Field
- Height: 52dp
- Background: bg-surface-muted
- Border-radius: 12dp
- Border: 1.5dp solid `border-subtle` (default) → `accent-primary` (focused)
- Padding: 16dp horizontal
- Label: floating label (animates up on focus) or above-field label
- Error state: border `expense-red` + error message text below (12sp, red)
- Placeholder: text-muted color

### Password Input
- Same as Text Input
- Right icon: eye/eye-off toggle (24dp icon, `text-secondary`)

### Amount Input (Large / Calculator Style)
- Display: centered, large numeric display (display-xl token)
- Keyboard: numeric keypad (system or custom)
- Prefix: currency symbol left of number
- Background: transparent or minimal surface
- Clear button: "×" when value > 0

### Date Picker
- Trigger: tappable row showing calendar icon + formatted date
- Opens: bottom sheet with native date picker or custom scrollable month/day/year columns

### Category Picker Grid
- 3–4 columns
- Each cell: icon circle (56dp) + label below (body-sm)
- Selected state: border `accent-primary`, background `accent-primary` at 10%

### Dropdown Selector
- Same height as text input
- Right chevron icon
- Opens: bottom sheet with radio list

---

## 16. Charts and Graphs

### Bar Chart (Weekly/Monthly Spending)
- Library hint: Victory Native, React Native Chart Kit, or Skia-based custom
- Bars: rounded top corners (4dp radius)
- Active bar: `accent-primary` fill
- Inactive bars: `bg-surface-raised` or muted accent
- X-axis labels: body-sm, text-muted
- Y-axis: abbreviated values, body-sm, text-muted
- Grid lines: horizontal only, 1dp, `border-subtle`
- Tooltip: floating card on tap showing exact value

### Line Chart (Balance Trend)
- Smooth bezier curve
- Stroke: `accent-primary`, 2dp width
- Gradient fill: `accent-primary` 20% → transparent (below line)
- Data points: 6dp circle, white fill, accent border (visible on hover/tap)
- Animation: draw-on from left on mount

### Donut Chart (Category Breakdown)
- Outer radius: ~80dp, inner radius: ~50dp (gives donut hole)
- Each arc: category color (see color palette)
- Gap between arcs: 2dp
- Center text: total amount (display-lg) above label "Total" (body-sm)
- Legend: vertical list to right or below chart

### Progress Bar (Budget)
- See Reusable UI Patterns § Progress Bar

---

## 17. Buttons

### Primary Button
- Height: 52dp
- Width: full-width (or min 200dp for inline)
- Background: `accent-primary`
- Text: "Button Label", body-lg, Bold, white
- Border-radius: 14dp
- Pressed state: 90% opacity + scale 0.98
- Disabled: `accent-primary` at 40% opacity, text at 60%

### Secondary Button (Outline)
- Same dimensions as Primary
- Background: transparent
- Border: 1.5dp solid `accent-primary`
- Text: `accent-primary`

### Social Auth Button (Google / Apple)
- Height: 52dp
- Width: full-width
- Background: bg-surface
- Border: 1dp solid `border-subtle`
- Border-radius: 14dp
- Content: [Brand logo 20dp] [space-3] "Continue with Google"
- Text: body-md, Medium weight

### FAB (Floating Action Button)
- Size: 56×56dp circle
- Background: `accent-primary`
- Icon: white "+" (24dp)
- Shadow: `0 4px 12px rgba(123,97,255,0.4)`
- Position: bottom-right, 16dp from edge, 80dp above tab bar

### Icon Button (Header actions)
- Size: 40×40dp touch target
- Icon: 24dp
- Background: transparent (or bg-surface-muted for bordered variant)
- Border-radius: 50%

### Pill Toggle (Period Selector)
- Container: bg-surface-muted, fully rounded pill
- Active segment: bg-surface-raised (white in light / elevated in dark), shadow
- Segments: "Weekly" | "Monthly" | "Yearly"
- Text: body-sm, SemiBold when active, Regular+muted when inactive

---

## 18. Icons

**Icon Set:** Outline style (2dp stroke weight), consistent with Heroicons, Phosphor, or Feather Icons aesthetic.

| Location          | Icon                  | Size  |
|-------------------|-----------------------|-------|
| Tab: Home         | House / grid-4        | 24dp  |
| Tab: Budget       | Pie chart             | 24dp  |
| Tab: Expenses     | Receipt / list        | 24dp  |
| Tab: Analytics    | Bar chart (ascending) | 24dp  |
| Tab: Profile      | User circle           | 24dp  |
| Notification      | Bell                  | 24dp  |
| Search            | Magnifying glass      | 24dp  |
| Filter            | Sliders / funnel      | 24dp  |
| Add               | Plus / circle-plus    | 24dp  |
| Back              | Chevron left          | 24dp  |
| More options      | Ellipsis horizontal   | 20dp  |
| Income indicator  | Arrow up              | 16dp  |
| Expense indicator | Arrow down            | 16dp  |
| Eye (show pw)     | Eye                   | 20dp  |
| Eye-off (hide pw) | Eye-off               | 20dp  |
| Calendar          | Calendar              | 20dp  |
| Category: Food    | Fork & knife          | 20dp  |
| Category: Transport | Car                 | 20dp  |
| Category: Shopping | Shopping bag         | 20dp  |
| Category: Bills   | Zap / lightning       | 20dp  |
| Category: Health  | Heart                 | 20dp  |

**Icon rendering:** All icons rendered as vector (SVG via react-native-svg or icon font). No raster icon assets.

---

## 19. Empty States

### No Transactions
- Illustration: Simple centered illustration (wallet or receipt with a "+" motif)
- Headline: "No transactions yet"
- Subtext: "Your expenses will appear here once you start tracking."
- CTA Button: "Add Expense" (Primary button)

### No Budgets
- Illustration: Budget/plan motif
- Headline: "No budgets set"
- Subtext: "Create a budget to stay on top of your spending."
- CTA Button: "Create Budget"

### No Analytics Data
- Illustration: Chart with dotted/empty bars
- Headline: "Not enough data"
- Subtext: "Add some transactions to see your spending insights."
- CTA Button: "Add Transaction"

**Empty State Layout:**
- Vertically centered in content area
- Illustration: 120×120dp
- Headline: heading-md, text-primary, centered
- Subtext: body-md, text-secondary, centered, max-width 240dp
- CTA: Primary button, centered, auto-width

---

## 20. Responsive Considerations

### Device Targets

| Class          | Width   | Notes                                      |
|----------------|---------|--------------------------------------------|
| Small phone    | 320dp   | Compact (iPhone SE). Single-column only.   |
| Standard phone | 375dp   | Design baseline (iPhone 14 / Pixel 7)      |
| Large phone    | 414dp+  | More whitespace, larger touch targets      |
| Tablet         | 768dp+  | Two-column layout possible for dashboard   |

### Adaptive Rules

- **Horizontal margins:** 16dp on standard, 20dp on large phone, 32dp on tablet
- **Account cards:** On tablet, show 2 side-by-side instead of horizontal scroll
- **Dashboard grid:** On tablet, Budget Summary + Recent Transactions can be side-by-side columns
- **Bottom tab bar:** On tablet, replace with left-side navigation rail (48dp wide)
- **Font scaling:** Support system font size accessibility settings (use sp units); do not hard-clip text
- **Chart heights:** Scale proportionally to screen height, min 160dp, max 280dp on phone
- **Modals / bottom sheets:** On tablet, present as centered dialog (max-width 480dp) instead of full-width bottom sheet

### Safe Areas
- Top: Status bar height (dynamic via `SafeAreaView` or `react-native-safe-area-context`)
- Bottom: Home indicator inset (34dp on iPhone notch devices)
- All fixed-position elements (tab bar, FAB) respect bottom safe area inset

### Keyboard Behavior
- Screens with inputs (Add Expense, Sign In, etc.) use `KeyboardAvoidingView` to push content up
- Amount input screen keeps amount display visible above keyboard at all times

### Accessibility
- All interactive elements: minimum touch target 44×44dp
- Color contrast: text-primary on bg-base ≥ 4.5:1 (WCAG AA)
- Accent `#7B61FF` on dark bg-base: verified ≥ 3:1 for large text
- Screen reader labels on all icon-only buttons
- Chart data available as accessible summary text (VoiceOver/TalkBack)

---

## Per-Screen Summary Reference

| Screen           | Purpose                         | Key Components                                     | Primary User Action               | Data Displayed                          |
|------------------|---------------------------------|----------------------------------------------------|-----------------------------------|-----------------------------------------|
| Splash/Welcome   | Entry & brand                   | Logo, tagline, CTA button, sign-in link            | Tap Get Started                   | None                                    |
| Sign In          | Authenticate returning user     | Email input, password input, social buttons        | Submit credentials                | None                                    |
| Sign Up          | Register new user               | Name/email/password inputs, social buttons         | Submit registration               | None                                    |
| Dashboard        | Financial overview              | Balance card, account cards, stat chips, tx list   | Navigate, pull to refresh         | Balance, accounts, recent transactions  |
| Budget Overview  | View all budget categories      | Summary donut, category list, progress bars        | Add budget, edit category         | Budget limits, spent, remaining         |
| Add Budget       | Create new budget category      | Category picker, amount input, date pickers        | Fill & save                       | None (input)                            |
| Expense List     | Browse all expenses             | Filter chips, grouped list, FAB                    | Tap item, add expense, filter     | Expenses by date, amount, category      |
| Add Expense      | Log a new expense               | Amount display, category grid, note input, date    | Fill & save                       | None (input)                            |
| Analytics        | Spending patterns visualization | Period toggle, bar chart, line chart, donut chart  | Toggle period, tap chart segment  | Totals, trends, category breakdown      |
| Analytics Detail | Category drill-down             | Chart (single category), filtered tx list          | Back, tap transaction             | Single-category spending over time      |

---

*End of DESIGN_SPEC.md*
