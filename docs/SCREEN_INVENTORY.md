# Screen Inventory

**Version:** 1.0  
**Date:** June 2026  
**Total Screens:** 34 (11 redesigned, 23 new)

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ Redesigned | Existing screen with significant layout changes |
| 🆕 New | Net-new screen required by expanded data model |
| 🗑️ Removed | Screen eliminated in redesign |

---

## Home Module (6 screens)

| # | Screen | Status | Primary Data Source | Notes |
|---|---|---|---|---|
| 1 | `HomeScreen` | ✅ Redesigned | `get_dashboard_summary()`, `monthly_cash_flow` | Full 6-zone dashboard layout |
| 2 | `NotificationsSheet` | 🆕 New | `mv_budget_performance`, `savings_goal_status` | Budget alerts + goal milestones |
| 3 | `HealthScoreDetailScreen` | 🆕 New | `financial_health_metrics` | Score breakdown with improvement tips |
| 4 | `QuickAddSheet` | 🆕 New | — | FAB bottom sheet: Expense / Income / Transfer |
| 5 | `GlobalSearchScreen` | 🆕 New | `expenses`, `income_records`, full-text search | Cross-module search |
| 6 | `OnboardingFlow` | 🆕 New | `users`, `expense_categories` | 3-step first-run setup wizard |

---

## Transactions Module (7 screens)

| # | Screen | Status | Primary Data Source | Notes |
|---|---|---|---|---|
| 7 | `TransactionListScreen` | ✅ Redesigned | `expenses`, `income_records` | Grouped by month, sticky headers |
| 8 | `AddExpenseScreen` | ✅ Redesigned | `expenses`, `expense_categories` | Category picker, recurring toggle |
| 9 | `AddIncomeScreen` | 🆕 New | `income_records`, `income_sources` | Source selector, tax withheld field |
| 10 | `AddTransferScreen` | 🆕 New | `asset_accounts` | Account-to-account transfer |
| 11 | `TransactionDetailScreen` | ✅ Redesigned | `expenses` or `income_records` | Edit + receipt URL + tags |
| 12 | `FilterSheet` | 🆕 New | — | Date range, category, tag, amount range |
| 13 | `BulkEditScreen` | 🆕 New | `expenses` | Multi-select, batch category/delete |

### Removed Screens
| Screen | Status | Reason |
|---|---|---|
| Old `ExpenseScreen` (simple list) | 🗑️ Removed | Replaced by `TransactionListScreen` which handles all transaction types |

---

## Budget Module (5 screens)

| # | Screen | Status | Primary Data Source | Notes |
|---|---|---|---|---|
| 14 | `BudgetOverviewScreen` | ✅ Redesigned | `mv_budget_performance`, `get_monthly_budget_comparison()` | All categories vs actual |
| 15 | `BudgetSetupWizard` | 🆕 New | `income_records`, `expense_categories` | 3 steps: Income → Categories → Review |
| 16 | `CategoryBudgetDetailScreen` | 🆕 New | `expenses`, `expense_categories` | Single category drill-down with history |
| 17 | `BudgetHistoryScreen` | 🆕 New | `mv_budget_performance` | Month-over-month budget performance |
| 18 | `AlertSettingsScreen` | 🆕 New | `user_settings` | Configure 80% / 100% threshold alerts |

---

## Wealth Module — Savings (5 screens)

| # | Screen | Status | Primary Data Source | Notes |
|---|---|---|---|---|
| 19 | `SavingsOverviewScreen` | ✅ Redesigned | `savings_goal_status`, `get_savings_goals_progress()` | All goals with progress chips |
| 20 | `GoalDetailScreen` | 🆕 New | `savings_goals`, `savings_goal_contributions`, `mv_financial_goals_progress` | Progress ring, contributions, forecast |
| 21 | `CreateGoalScreen` | 🆕 New | `savings_goals` | Name, target amount, date, category, color |
| 22 | `AddContributionScreen` | 🆕 New | `savings_goal_contributions` | Add funds to a specific goal |
| 23 | `GoalAchievedScreen` | 🆕 New | `savings_goals` | Celebration modal + archive prompt |

---

## Wealth Module — Investments (6 screens)

| # | Screen | Status | Primary Data Source | Notes |
|---|---|---|---|---|
| 24 | `PortfolioOverviewScreen` | 🆕 New | `investment_summary`, `mv_investment_performance`, `asset_allocation` | Total value, allocation donut, holdings list |
| 25 | `InvestmentAccountDetailScreen` | 🆕 New | `investment_accounts`, `investment_holdings` | Per-account breakdown |
| 26 | `HoldingDetailScreen` | 🆕 New | `investment_holdings`, `investment_transactions` | Symbol, P&L, transaction history |
| 27 | `AddHoldingScreen` | 🆕 New | `investment_holdings` | Symbol, shares, price, purchase date |
| 28 | `LogTransactionScreen` | 🆕 New | `investment_transactions` | Buy / Sell / Dividend / Fee |
| 29 | `AllocationScreen` | 🆕 New | `asset_allocation`, `mv_investment_performance` | Donut chart + asset class breakdown |

---

## Wealth Module — Net Worth (3 screens)

| # | Screen | Status | Primary Data Source | Notes |
|---|---|---|---|---|
| 30 | `NetWorthSummaryScreen` | 🆕 New | `net_worth_snapshots`, `mv_net_worth_history`, `financial_health_metrics` | Total, trend, assets vs debts |
| 31 | `AssetsDetailScreen` | 🆕 New | `asset_accounts`, `investment_holdings` | Grouped by asset type, editable balances |
| 32 | `DebtsDetailScreen` | 🆕 New | `debt_accounts` | Grouped by debt type, payoff calculator |

---

## Analytics Module (5 screens)

| # | Screen | Status | Primary Data Source | Notes |
|---|---|---|---|---|
| 33 | `AnalyticsHomeScreen` | 🆕 New | `get_financial_metrics()`, `monthly_cash_flow`, `mv_expense_analytics` | Period selector + metrics grid + charts |
| 34 | `SpendingTrendsScreen` | 🆕 New | `mv_expense_analytics`, `expense_trends` | 12-month category breakdown + YoY |
| 35 | `IncomeAnalysisScreen` | 🆕 New | `mv_income_analysis`, `income_trends` | Income by source over time |
| 36 | `NetWorthGrowthScreen` | 🆕 New | `mv_net_worth_history`, `net_worth_snapshots` | Long-range chart (10Y) |
| 37 | `ForecastScreen` | 🆕 New | `mv_expense_analytics`, `mv_income_analysis`, `mv_financial_goals_progress` | Projection based on current trajectory |

---

## Profile Module (3 screens)

| # | Screen | Status | Primary Data Source | Notes |
|---|---|---|---|---|
| 38 | `ProfileScreen` | ✅ Redesigned | `users`, `user_settings` | Account info + settings hub |
| 39 | `DataExportScreen` | 🆕 New | All tables | CSV/PDF export with date range picker |
| 40 | `SecuritySettingsScreen` | 🆕 New | `user_settings` | Biometrics, PIN, session management |

---

## Summary Count

| Category | Count |
|---|---|
| ✅ Redesigned screens | 11 |
| 🆕 New screens | 23 |
| 🗑️ Removed screens | 1 |
| **Total screens** | **34** |
