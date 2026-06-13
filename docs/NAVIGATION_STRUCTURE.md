# Navigation Structure

**Version:** 1.0  
**Date:** June 2026

---

## Bottom Navigation — 5 Primary Tabs

The current 5-tab structure maps to the wrong mental model for a wealth platform. The new structure replaces it entirely:

| # | Tab | Icon | Primary Purpose | DB Source |
|---|---|---|---|---|
| 1 | **Home** | House (⌂) | Unified wealth dashboard | All views + materialized views |
| 2 | **Transactions** | Arrows (↕) | Expenses, Income, Transfers | `expenses`, `income_records` |
| 3 | **Budget** | Target (◎) | Monthly budget planning | `expense_categories`, `mv_budget_performance` |
| 4 | **Wealth** | Diamond (◈) | Savings + Investments + Net Worth | `savings_goals`, `investment_holdings`, `asset_accounts`, `debt_accounts` |
| 5 | **Analytics** | Trend Arrow (↗) | Historical analytics + forecasting | All `mv_*` materialized views |

---

## Key Structural Change from Current App

| Current Tab | Status | Reason |
|---|---|---|
| Home | ✅ Kept, redesigned | Becomes full wealth dashboard |
| Budget | ✅ Kept, redesigned | Dedicated budget planning module |
| Expenses | ⚠️ Merged | Absorbed into new **Transactions** tab |
| Analytics | ⚠️ Elevated | Promoted to full module with 5 sub-screens |
| Profile | ⚠️ Moved | Accessible via avatar icon in Home header (not in bottom nav) |

**Net new tab:** `Wealth` — consolidates Savings, Investments, and Net Worth under one destination using internal sub-tabs. This prevents navigation overload while supporting the expanded data model.

---

## Global FAB (Floating Action Button)

The `+` FAB floats above the nav bar and is the most-used interaction in the app.

- **Position:** Centered, above bottom nav bar, always visible
- **Style:** Brand purple gradient, circular, with drop shadow glow
- **Action:** Opens `QuickAddSheet` bottom sheet (60% height snap)
- **Sheet options:**
  - 💸 Expense
  - 💰 Income
  - ↔️ Transfer

**Design rule:** Adding a transaction must never require more than 2 taps from any screen.

---

## Wealth Tab — Internal Sub-Navigation

The Wealth tab uses a **horizontal scrolling sub-tab bar** at the top of the screen, not a nested bottom nav.

```
┌─────────────────────────────────────────┐
│  Net Worth  │  Savings  │  Investments  │  ← sub-tab strip
└─────────────────────────────────────────┘
```

**Why this pattern?**  
Used by Robinhood, Fidelity, and Coinbase for the same reason: grouping related but distinct financial data under one destination reduces cognitive load while keeping primary navigation slots available for truly different contexts.

---

## Analytics Tab — Internal Sub-Navigation

Analytics uses a **chip row** at the top that filters the active view:

```
[ Spending ] [ Income ] [ Net Worth ] [ Categories ] [ Forecast ]
```

The period selector (1M / 6M / 1Y / 3Y / All) persists across all sub-views.

---

## Deep Navigation Depth

| Tab | Max Depth | Example Path |
|---|---|---|
| Home | 2 | Home → Transaction Detail |
| Transactions | 3 | List → Detail → Edit |
| Budget | 3 | Overview → Category Detail → Alert Settings |
| Wealth | 4 | Wealth → Investments → Holding Detail → Log Transaction |
| Analytics | 2 | Analytics → Spending Trends |

---

## Profile Access

Profile is intentionally removed from the bottom nav to free up the 5th slot for Analytics. Instead:

- **Home screen header:** Avatar circle (top right) → taps to `ProfileScreen`
- **Profile screen** is a full-page push (not a bottom sheet)
- Accessible from any screen via the header avatar

This pattern is used by Revolut, Wise, and N26.

---

## Navigation Transitions

| Transition Type | Used For |
|---|---|
| Tab switch (no animation) | Switching between bottom nav tabs |
| Push (slide left) | Drilling into detail screens |
| Bottom sheet (slide up) | Creation flows, filters, quick actions |
| Fade | Full-screen modals (Onboarding, Achievement) |
| Haptic feedback | FAB press, tab switch, goal completion |
