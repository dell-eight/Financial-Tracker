# Dashboard Design — Home Screen

**Version:** 1.0  
**Date:** June 2026

---

## Overview

The Home dashboard is a single vertical scroll containing 6 information zones. It answers the question *"How am I doing financially right now?"* in under 10 seconds. It is the most-visited screen in the app and must load fast, look premium, and surface the most important numbers first.

---

## Layout: 6 Zones (top to bottom)

### Zone 1 — Hero Net Worth Card

**Position:** Always above the fold — the first thing users see  
**Height:** ~140px  
**Component:** `NetWorthCard`

```
┌─────────────────────────────────────────┐
│  TOTAL NET WORTH                        │
│  ₱412,850                               │
│  ↑ ₱3,200 this month (+0.78%)           │
│  ┌──────────┬──────────┬─────────────┐  │
│  │  Assets  │  Debts   │ Investments │  │
│  │  ₱485K   │  ₱72K    │   ₱128K    │  │
│  └──────────┴──────────┴─────────────┘  │
└─────────────────────────────────────────┘
```

**Visual treatment:** Deep dark gradient background (`#1A1040` → `#12122A`) with a subtle purple radial glow in the top-right corner. This visually anchors the card as the most important element on screen.

**Data source:** `get_dashboard_summary()` → `net_worth`, `total_assets`, `total_debts`, `investment_value`  
**Tap action:** Navigates to `NetWorthSummaryScreen`

---

### Zone 2 — Financial Health Score

**Position:** Immediately below hero card  
**Height:** ~60px  
**Component:** `HealthScoreBand`

```
┌──────────────────────────────────────────┐
│ ◉ 78   Financial Health Score    [Good] │
│        Good · Emergency fund 4.2 months  │
└──────────────────────────────────────────┘
```

**Score calculation (0–100):**
| Factor | Weight | Data source |
|---|---|---|
| Savings rate (>20% = full score) | 30% | `monthly_cash_flow` |
| Emergency fund coverage (>6mo = full) | 25% | `financial_health_metrics.emergency_fund_months` |
| Debt-to-income ratio (<30% = full) | 25% | `debt_accounts` vs `income_records` |
| Goal progress (avg across active goals) | 20% | `savings_goal_status` |

**Score bands:**

| Score | Label | Color |
|---|---|---|
| 0–39 | Needs Attention | Coral `#FF6E52` |
| 40–59 | Fair | Orange `#FF9500` |
| 60–79 | Good | Purple `#755DEF` |
| 80–100 | Excellent | Green `#00C318` |

**Tap action:** Opens `HealthScoreDetailScreen` with per-factor breakdown and improvement tips.

---

### Zone 3 — Monthly Cash Flow Strip

**Position:** Below Health Score  
**Height:** ~70px  
**Component:** `CashFlowStrip`

```
┌─────────────────────────────────────────┐
│  Income        Expenses       Saved     │
│  ₱32,400       ₱18,750        ₱13,650  │
└─────────────────────────────────────────┘
```

**Visual treatment:** Three equal columns separated by 1px dividers. Income value in green, Expenses in coral, Saved in white (positive surplus) or coral (deficit).

**Data source:** `monthly_cash_flow` view → `total_income`, `total_expenses`, `net_cash_flow`  
**Tap action:** Tapping any column navigates to `TransactionListScreen` filtered to current month.

---

### Zone 4 — Budget Progress

**Position:** Below Cash Flow Strip  
**Height:** ~120px (shows 3 rows)  
**Section header:** "Budget Progress" + "All →" link  
**Component:** `BudgetProgressRow` × 3

```
Section: Budget Progress                      All →

┌────────────────────────────────────────┐
│ 🛒 Groceries           ₱4,280 / ₱6,000 │
│ ████████████████░░░░░   71%            │
├────────────────────────────────────────┤
│ 🚗 Transport           ₱3,940 / ₱4,000 │
│ ████████████████████░   98% ⚠️         │
├────────────────────────────────────────┤
│ 🎮 Entertainment       ₱3,600 / ₱3,000 │
│ ████████████████████    OVER BUDGET    │
└────────────────────────────────────────┘
```

**Sort order:** Over-budget items float to top (coral), then at-risk (orange >80%), then healthy (purple).

**Bar color logic:**
- 0–79%: Purple `#755DEF`
- 80–99%: Orange `#FF9500`
- 100%+: Coral `#FF6E52`

**Data source:** `get_monthly_budget_comparison()` RPC function  
**Tap action:** Each row navigates to `CategoryBudgetDetailScreen`

---

### Zone 5 — Savings Goal Chips

**Position:** Below Budget Progress  
**Height:** ~100px (horizontal scroll)  
**Section header:** "Savings Goals" + "All →" link  
**Component:** `GoalPreviewCard` (horizontal scrollable)

```
Section: Savings Goals                         All →

← [🏠 House Down]  [✈️ Europe Trip]  [🆘 Emergency]  →
   62% · ₱310K        80% · ₱40K       45% · ₱67K
```

Each chip shows:
- Emoji + Goal name
- Progress bar (3px thin bar)
- Percentage + saved amount

**Data source:** `savings_goal_status` view → top 5 active goals ordered by `priority`  
**Tap action:** Each chip navigates to `GoalDetailScreen`

---

### Zone 6 — Recent Transactions

**Position:** At bottom of scroll  
**Height:** ~180px (shows 4–5 rows)  
**Section header:** "Recent Transactions" + "All →" link  
**Component:** `TransactionRow` × 5

```
Section: Recent Transactions                   All →

┌────────────────────────────────────────────┐
│ 🍔  Jollibee               Today   -₱285  │
│     Food & Dining                          │
├────────────────────────────────────────────┤
│ 💼  Salary                Jun 15  +₱32,400 │
│     Income                                 │
├────────────────────────────────────────────┤
│ 🚗  Grab Ride             Jun 12    -₱180  │
│     Transport                              │
└────────────────────────────────────────────┘
```

**Data source:** Combined query: `SELECT * FROM expenses UNION SELECT * FROM income_records WHERE user_id = :uid AND deleted_at IS NULL ORDER BY date DESC LIMIT 5`  
**Tap action:** Each row navigates to `TransactionDetailScreen`

---

## Global FAB

Positioned above the bottom navigation bar, always visible (does not scroll with content).

```
                    ╭───╮
                    │ + │  ← FAB, brand purple gradient
                    ╰───╯
 ┌─────┬────────────┬────────┬────────┬────────┐
 │Home │Transactions│ Budget │ Wealth │Analytics│
 └─────┴────────────┴────────┴────────┴────────┘
```

---

## Performance Requirements

| Metric | Target |
|---|---|
| Time to first meaningful paint | < 400ms |
| Time to fully interactive | < 1200ms |
| Stale-while-revalidate strategy | Yes — show cached data immediately, refresh in background |
| Skeleton loading state | Yes — shown for all 6 zones while data loads |
| Pull-to-refresh | Yes — available from top of scroll |

---

## Empty States

| Zone | Empty State Copy | CTA |
|---|---|---|
| Net Worth Card | "Add your first asset to track your net worth" | → AssetsDetailScreen |
| Health Score | "Complete your setup to see your score" | → OnboardingFlow |
| Budget Progress | "No budget set yet — set one up in 2 minutes" | → BudgetSetupWizard |
| Savings Goals | "Start a goal — what are you saving for?" | → CreateGoalScreen |
| Recent Transactions | "No transactions yet — add your first one" | → QuickAddSheet |
