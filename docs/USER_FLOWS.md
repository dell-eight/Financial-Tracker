# User Flows

**Version:** 1.0  
**Date:** June 2026

---

## Flow 1 — Add Transaction

**Trigger:** User taps FAB `+` button (available from any screen)  
**Goal:** Log an expense, income, or transfer in under 30 seconds  
**Critical path:** FAB → Type Picker → Entry Form → Save

```
FAB (+)
  └─→ QuickAddSheet (bottom sheet, 60% height)
        ├─→ [Expense] → AddExpenseScreen
        │     ├── Amount field (numeric keypad auto-opens)
        │     ├── Category picker (scrollable chip row)
        │     ├── Description field (optional)
        │     ├── Date picker (defaults to today)
        │     ├── Tags field (optional)
        │     ├── Receipt URL / photo (optional)
        │     ├── Recurring toggle
        │     │     └── [if ON] → Frequency picker + End date
        │     └── Save → INSERT into expenses
        │           └── Toast confirmation → dismiss to previous screen
        │
        ├─→ [Income] → AddIncomeScreen
        │     ├── Amount field
        │     ├── Income source picker (from income_sources)
        │     ├── Tax withheld field (optional)
        │     ├── Date picker
        │     ├── Description (optional)
        │     └── Save → INSERT into income_records
        │
        └─→ [Transfer] → AddTransferScreen
              ├── From account (asset_accounts picker)
              ├── To account (asset_accounts or savings_goals picker)
              ├── Amount
              ├── Date
              └── Save → UPDATE asset_accounts balances
```

**Design Notes:**
- Amount field opens the numeric keypad immediately — no tap required
- Category picker defaults to the most recently used category
- Recurring flag creates a future-dated series, displayed with a ↻ icon in the transaction list
- Confirmation uses a toast (2s auto-dismiss), not an alert modal

---

## Flow 2 — Monthly Budget Setup

**Trigger:** User opens Budget tab for the first time, or taps "Set Up Budget"  
**Goal:** Define monthly spending limits for all expense categories  
**Critical path:** Budget Tab → Wizard (3 steps) → Active Budget

```
Budget Tab
  └─→ [No budget exists] → BudgetSetupWizard (full-screen push)
        │
        ├── Step 1: Monthly Income
        │     └── Pulls from income_records average → editable number
        │
        ├── Step 2: Category Limits
        │     ├── Lists all expense_categories with budget_limit inputs
        │     ├── Running total: Budgeted vs. Monthly Income
        │     ├── Warning if over-allocated (>100% of income)
        │     └── "Suggested" amounts based on 50/30/20 rule
        │
        ├── Step 3: Review
        │     ├── Pie chart of allocation
        │     ├── Unallocated amount shown as "Savings Potential"
        │     └── Confirm → UPDATE expense_categories.budget_limit
        │
        └── BudgetOverviewScreen (live tracking begins)
              ├── All categories with progress bars
              ├── Over-budget items float to top (coral color)
              └── Tap category → CategoryBudgetDetailScreen
```

**Design Notes:**
- The wizard is only shown on first setup. After that, budget tab shows the overview directly.
- Month rolls over automatically — no user action needed to start a new month's tracking
- Alert thresholds (80% warning, 100% over-budget) are set in `AlertSettingsScreen` and stored in `user_settings`

---

## Flow 3 — Create & Track Savings Goal

**Trigger:** User opens Wealth tab → Savings sub-tab → taps "New Goal"  
**Goal:** Define a financial goal and contribute to it over time  
**Critical path:** Create Goal → Contribute → Track Progress → Achieve

```
Wealth Tab → Savings
  └─→ SavingsOverviewScreen
        └─→ "New Goal" button → CreateGoalScreen
              ├── Goal name (text)
              ├── Emoji / icon picker
              ├── Target amount
              ├── Target date (optional)
              ├── Category (Emergency Fund / Vacation / Home / Education / Other)
              ├── Priority (1–5 stars)
              ├── Color picker
              └── Save → INSERT into savings_goals
                    └── GoalDetailScreen (navigate to new goal)

GoalDetailScreen
  └─→ "Add Contribution" CTA
        └─→ AddContributionScreen (bottom sheet)
              ├── Amount
              ├── Date (default today)
              ├── Description (e.g., "Salary transfer")
              └── Save → INSERT into savings_goal_contributions

[When progress_percent reaches 100%]
  └─→ GoalAchievedScreen (full-screen modal)
        ├── Celebration animation (confetti / haptic burst)
        ├── Final stats (time taken, total contributed, largest contribution)
        ├── "Archive Goal" → UPDATE savings_goals.is_active = false
        └── "Keep Contributing" → dismiss modal
```

**Design Notes:**
- Progress percentage is computed by the `savings_goal_status` view — never stored directly
- "Required daily savings" is always visible on the Goal Detail screen so users know what to do
- Forecast date updates in real time as contributions are added
- Archived goals are still visible in a collapsed "Completed" section

---

## Flow 4 — Log Investment

**Trigger:** User opens Wealth tab → Investments sub-tab  
**Goal:** Track a new investment holding or record a buy/sell/dividend transaction  
**Critical path:** Portfolio Overview → Add Holding or Log Transaction

```
Wealth Tab → Investments
  └─→ PortfolioOverviewScreen
        │
        ├─→ [First time / New Account] → "+ Add Account" sheet
        │     ├── Account name
        │     ├── Account type (Brokerage / Roth IRA / 401k / Crypto / Other)
        │     ├── Institution
        │     └── Save → INSERT into investment_accounts
        │
        └─→ [Existing account] → "+ Add Holding" button
              └─→ AddHoldingScreen
                    ├── Symbol (e.g., VTI, AAPL)
                    ├── Full name
                    ├── Asset class (ETF / Stock / Bond / Mutual Fund / Crypto)
                    ├── Sector (for stocks)
                    ├── Number of shares
                    ├── Purchase price per share
                    ├── Purchase date
                    └── Save → INSERT into investment_holdings
                          └─→ HoldingDetailScreen

HoldingDetailScreen
  └─→ "Log Transaction" button
        └─→ LogTransactionScreen (bottom sheet)
              ├── Transaction type (Buy / Sell / Dividend / Interest / Fee)
              ├── Shares (for buy/sell)
              ├── Price per share
              ├── Fee (optional)
              ├── Date
              └── Save → INSERT into investment_transactions
                    └── Portfolio value recalculated on next read
```

**Design Notes:**
- Current price (`current_price` on `investment_holdings`) is updated manually by the user. A future enhancement adds price API sync.
- Unrealized gain/loss is computed by the `investment_summary` view: `(shares × current_price) - (shares × purchase_price)`
- Portfolio allocation donut updates immediately on return to `PortfolioOverviewScreen`

---

## Flow 5 — Monthly Net Worth Snapshot

**Trigger:** User opens Wealth tab → Net Worth sub-tab; or triggered automatically by system on 1st of month  
**Goal:** Record current financial position for historical tracking  
**Critical path:** Review balances → Update → Snapshot saved

```
Wealth Tab → Net Worth
  └─→ NetWorthSummaryScreen
        ├── Displays last known net worth
        ├── "Update Balances" prompt if balances are >30 days old
        │
        ├── AssetsDetailScreen
        │     └── Each asset_account row is tappable
        │           └── Inline balance editor (bottom sheet)
        │                 └── Save → UPDATE asset_accounts.balance
        │
        ├── DebtsDetailScreen
        │     └── Each debt_account row is tappable
        │           └── Inline balance editor (bottom sheet)
        │                 └── Save → UPDATE debt_accounts.balance
        │
        └── "Save Snapshot" button
              └── Computes: total_assets - total_debts = net_worth
                    └── INSERT into net_worth_snapshots
                          └── mv_net_worth_history refreshed nightly
```

**Automation Note:**
A Supabase Edge Function runs on the 1st of every month. It reads the current state of `asset_accounts`, `debt_accounts`, and `investment_holdings` and auto-creates a `net_worth_snapshots` row. This ensures historical data is captured even if the user doesn't manually snapshot.

---

## Critical UX Rules Across All Flows

| Rule | Rationale |
|---|---|
| Maximum 2 taps to start any creation flow | Reduces friction for daily use |
| All creation flows open as bottom sheets (not full-screen push) | Keeps user oriented in context |
| Numeric keypad opens immediately on amount fields | No extra tap to start typing money |
| Every save action shows a toast, never an alert dialog | Non-blocking confirmation |
| Soft delete only (`deleted_at`) — no hard deletes | Supports undo and data recovery |
| Every form has a clear "Cancel" path | Users must feel safe exploring |
| Haptic feedback on: FAB tap, save, goal completion | Premium tactile feel |
