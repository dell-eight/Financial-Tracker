# Modules Design — Savings, Investments, Net Worth, Analytics

**Version:** 1.0  
**Date:** June 2026

---

## Savings Module

### Design Principles

Goals are **emotional**, not just financial. Each goal should feel personal and motivating:
- Named with an emoji chosen by the user
- Uniquely colored
- Accompanied by a concrete daily savings requirement
- Progress celebrated with haptic feedback and animation at milestones (25%, 50%, 75%, 100%)

---

### SavingsOverviewScreen

**Layout:**
1. **Summary strip** — Total saved across all goals | Number of active goals | Total target
2. **Active Goals grid** — 2-column grid of `GoalPreviewCard` components
3. **"+ New Goal" CTA** — Sticky button at bottom
4. **Completed Goals** — Collapsed accordion section below active goals

**Data source:** `get_savings_goals_progress()` RPC function  
**Sort order:** By priority (descending), then by closest target date

---

### GoalDetailScreen Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│           ◯ 62%                             │  ← Large circular progress ring
│     🏠 House Down Payment                   │
│     Target: ₱500,000 · Dec 2028            │
│                                             │
│  ┌──────────┬──────────┬──────────────────┐ │
│  │  Saved   │  Target  │   Remaining      │ │
│  │ ₱310,000 │ ₱500,000 │    ₱190,000     │ │
│  └──────────┴──────────┴──────────────────┘ │
│                                             │
│  Days Left: 912    Required/Day: ₱208.30   │
│  Forecast: ✅ On Track — Dec 18, 2028      │
│                                             │
│  Contribution History ─────────────────    │
│  [Monthly bar chart of contributions]      │
│                                             │
│  Jun 2026  Salary transfer     +₱5,000     │
│  May 2026  Salary transfer     +₱5,000     │
│  May 2026  Annual bonus        +₱8,500     │
│  Apr 2026  Salary transfer     +₱5,000     │
│                                             │
└─────────────────────────────────────────────┘
                 [+ Add Contribution]          ← Sticky CTA
```

**Data sources:**
- `savings_goals` — goal metadata
- `savings_goal_contributions` — contribution history
- `savings_goal_status` view — computed progress, days remaining, daily requirement
- `mv_financial_goals_progress` — on-track status

**On-track calculation:**
```
expected_progress = (days_elapsed / total_days) × 100
actual_progress = current_amount / target_amount × 100
status = actual_progress >= expected_progress ? "On Track" : "Behind"
```

---

### CreateGoalScreen

**Fields (all in a single-screen form):**
1. Emoji picker (grid of common finance emojis)
2. Goal name (text input)
3. Category selector chips: Emergency Fund / Vacation / Home / Education / Car / Retirement / Other
4. Target amount (numeric input with currency)
5. Target date (date picker — optional)
6. Priority (1–5 star rating)
7. Color picker (8 preset colors matching the app palette)

**Form validation:**
- Name: required
- Target amount: required, must be > 0
- Target date: optional; if set, must be in the future
- If no target date: forecast section on Goal Detail shows "No target date set"

---

### GoalAchievedScreen

A full-screen celebration modal triggered when `progress_percent >= 100`:
- Confetti animation (using `react-native-reanimated`)
- Large trophy emoji
- Goal name + final stats (time taken, total contributions, largest single contribution)
- Two CTAs:
  - **"Archive Goal"** → `UPDATE savings_goals SET is_active = false`
  - **"Keep Contributing"** → Dismiss modal (goal remains active, useful for building an even larger buffer)

---

## Investments Module

### Design Principles

The portfolio view is the most data-dense module. Every number shown must have context:
- Show **current value** alongside **cost basis**
- Show **P&L percentage**, not just P&L dollar amount
- Group by account first, then by asset class
- Never show a number in isolation

---

### PortfolioOverviewScreen

**Sub-tabs:** Holdings | Allocation | History | Transactions

**Holdings tab layout:**
```
┌─────────────────────────────────────────────┐
│  Portfolio Value                            │
│  ₱128,300                                   │
│  +₱19,090 (+17.5%) total return            │
│                                             │
│  [Brokerage] [Roth IRA] [All]              │  ← Account filter chips
│                                             │
│  Holdings ─────────────────────────────    │
│                                             │
│  VTI   Vanguard Total Stock ETF            │
│        100 shares · ₱62,400               │
│        +₱12,400  +24.9%                   │
│                                             │
│  BND   Bond Market ETF                     │
│        150 shares · ₱38,700               │
│        +₱2,700  +7.5%                     │
│                                             │
│  VTSAX Index Mutual Fund                   │
│        200 shares · ₱27,000              │
│        +₱5,000  +22.7%                   │
│                                             │
│  [+ Add Holding]                            │
└─────────────────────────────────────────────┘
```

**Allocation tab:** SVG donut chart centered, with legend below. Asset classes: ETF / Stocks / Bonds / Mutual Funds / Crypto / Other.

**History tab:** Line chart of total portfolio value over time (uses `investment_transactions` to reconstruct historical value at each date).

**Data sources:**
- `investment_summary` view — live holdings with P&L
- `mv_investment_performance` — gain/loss with portfolio % share
- `asset_allocation` view — donut chart data
- `investment_accounts` — account filter chips

---

### HoldingDetailScreen

```
┌─────────────────────────────────────────────┐
│  ← Back         VTI                        │
│                 Vanguard Total Stock ETF    │
│                                             │
│  Current Value     Cost Basis              │
│  ₱62,400           ₱50,000                │
│                                             │
│  Unrealized Gain/Loss                      │
│  +₱12,400  (+24.9%)                        │
│                                             │
│  ┌──────────┬──────────┬──────────────┐    │
│  │  Shares  │  Price   │  Avg Cost    │    │
│  │   100    │  ₱624    │    ₱500      │    │
│  └──────────┴──────────┴──────────────┘    │
│                                             │
│  [Price chart placeholder]                 │
│                                             │
│  Transactions ─────────────────────────    │
│  Jun 10  BUY   50 shares @ ₱610  ₱30,500  │
│  Mar 15  BUY   50 shares @ ₱380  ₱19,000  │
│                                             │
│  [+ Log Transaction]                        │
└─────────────────────────────────────────────┘
```

**Data sources:** `investment_holdings`, `investment_transactions`

---

### AddHoldingScreen

**Fields:**
1. Account selector (from `investment_accounts`)
2. Symbol (text input — uppercase forced)
3. Name (text input — full name of security)
4. Asset class chips: Stock / ETF / Bond / Mutual Fund / Crypto / Other
5. Sector (optional — for stocks: Tech / Healthcare / Finance / Energy / Consumer / Other)
6. Number of shares (numeric input)
7. Purchase price per share (numeric)
8. Purchase date (date picker)
9. Notes (optional)

---

## Net Worth Module

### Design Principles

Net worth is shown on the Home dashboard as a **read** surface, but the dedicated Net Worth module is the **write** surface — where users manage the inputs (update balances, add assets, record debt payoffs).

**The core interaction:** Tap any asset or debt row → bottom sheet opens with inline balance editor → save → `net_worth_snapshots` updated.

---

### NetWorthSummaryScreen

**Sub-tabs:** Summary | Assets | Debts

**Summary tab layout:**
```
┌─────────────────────────────────────────────┐
│  Net Worth                                  │
│  ₱412,850                                   │
│  ↑ +₱3,200 from last month (+0.78%)        │
│  ↑ +₱38,000 YTD (+10.1%)                  │
│                                             │
│  12-Month Sparkline ─────────────────────  │
│  [Bar chart — 12 monthly bars]             │
│                                             │
│  Breakdown ────────────────────────────    │
│  Cash & Savings      ₱245,000    50%       │
│  Investments         ₱128,000    26%       │
│  Other Assets        ₱112,000    23%       │
│  ─────────────────────────────────────    │
│  Student Loan        -₱48,000             │
│  Credit Card         -₱24,000             │
│                                             │
│  [Update Balances]                          │
└─────────────────────────────────────────────┘
```

**Assets tab:** Grouped list by type:
- Cash & Equivalents (checking, savings, money market)
- Investments (links to Portfolio Overview)
- Real Estate (property accounts)
- Vehicles
- Other

Each row shows: Account name | Institution | Balance | Last updated  
Tap → inline balance editor (bottom sheet with numpad)

**Debts tab:** Grouped list by type:
- Mortgage
- Auto Loans
- Student Loans
- Credit Cards
- Personal Loans

Each row shows: Account name | Institution | Balance | Interest rate | Min payment  
Tap → inline balance editor + optional payoff date update

**Data sources:**
- `asset_accounts` — asset rows
- `debt_accounts` — debt rows
- `net_worth_snapshots` — historical chart
- `mv_net_worth_history` — trend with MoM changes
- `financial_health_metrics` view — emergency fund months, debt-to-income

---

### DebtsDetailScreen — Payoff Calculator

When a debt account is tapped, the bottom sheet includes a **Payoff Calculator** toggle:

```
At minimum payment of ₱2,500/mo:
  Payoff date: March 2029 (33 months)
  Total interest: ₱8,240

At ₱5,000/mo:
  Payoff date: April 2027 (10 months) ← 23 months faster
  Total interest: ₱2,190 ← save ₱6,050
```

This is a pure frontend calculation using the debt's `annual_rate`, `balance`, and user-input payment amount. No additional DB writes needed.

---

## Analytics Module

### Design Principles

Analytics is the **reward module** — it answers "how am I doing?" after months of data entry. It should feel like a premium financial report, not a raw chart dump.

**Rules:**
- Consistent period selector (1M / 6M / 1Y / 3Y / All) persists across all sub-views
- Every chart has a one-line insight callout above it ("Your food spending is 12% higher than last year")
- No chart without a data label or axis
- Comparisons always shown: current period vs. previous period

---

### AnalyticsHomeScreen

**Period selector** — Sticky pill strip at top  
**2×2 Metrics Grid:**

| Tile | Data source |
|---|---|
| Avg Monthly Income | `mv_income_analysis.avg_12_month` |
| Avg Monthly Spend | `mv_expense_analytics.avg_12_month` |
| Savings Rate | `monthly_cash_flow` calculation |
| Net Worth Growth | `mv_net_worth_history.monthly_net_worth_change_percent` |

**Top Spending Categories** — Horizontal bar chart, sorted descending, showing budget % utilization  
**Income vs Spending** — Grouped bar chart by month (brand purple = income, coral = expense)  
**Navigation cards** → Deep-dive into each sub-section

---

### SpendingTrendsScreen

**Layout:**
1. Category filter chips (All / Groceries / Transport / etc.)
2. Line chart — one line per selected category over selected period
3. "Highest month" and "Lowest month" callout cards
4. Month-over-month delta table (current vs. prior period)
5. YoY comparison row (current year avg vs. prior year avg)

**Data source:** `mv_expense_analytics` — pre-computed rolling averages

---

### IncomeAnalysisScreen

**Layout:**
1. Source filter chips (All / Salary / Freelance / etc.)
2. Stacked bar chart — income by source per month
3. Net income (after tax) vs gross income toggle
4. Income stability score (coefficient of variation — lower = more stable)
5. "Best income month" callout

**Data source:** `mv_income_analysis`

---

### NetWorthGrowthScreen

**Layout:**
1. Period selector with "All Time" option (uses all `net_worth_snapshots` rows)
2. Line chart — net worth over time (up to 10 years of data)
3. Key milestones annotated on chart (first ₱100K, ₱500K, ₱1M, etc.)
4. Annual growth rate cards (current year, last year, 3-year CAGR, 5-year CAGR)
5. Asset vs Debt trend lines toggle

**Data source:** `mv_net_worth_history`, `net_worth_snapshots` (for 10Y range)

---

### ForecastScreen

**Methodology:** Based on trailing 3-month averages for income, expenses, and savings rate.

**Layout:**
```
At your current trajectory:

  Net Worth Projection
  ┌─────────────────────────────────────┐
  │  1 Year:   ₱452,000  (+9.5%)       │
  │  3 Years:  ₱580,000  (+40.6%)      │
  │  5 Years:  ₱750,000  (+81.8%)      │
  └─────────────────────────────────────┘

  Goal Forecast
  🏠 House Fund     → Dec 2028 (On Track)
  ✈️ Europe Trip    → Sep 2026 (On Track)
  🆘 Emergency Fund → Mar 2027 (Behind by 2 months)

  What If? ────────────────────────────
  [Slider: Increase savings rate by ___%]
  "Saving 5% more per month accelerates
   your House Fund by 4 months."
```

**Data sources:** `mv_expense_analytics`, `mv_income_analysis`, `mv_financial_goals_progress`

**What-If Slider:** Pure frontend calculation. Adjusts projected savings rate and recomputes goal completion dates in real time using the formula:
```
months_to_goal = remaining_amount / monthly_contribution
```
No DB writes. This is a planning tool only.
