# Product Architecture — Networthy Wealth Platform

**Version:** 1.0  
**Date:** June 2026  
**Author:** Design Lead  
**Status:** Approved for Implementation

---

## Overview

This document defines the complete product architecture for transforming the Networthy from a simple expense tracker into a full-featured personal wealth management platform. The redesign is built around a single governing principle:

> **One number rules everything — Net Worth. Every module feeds that number.**

The platform is designed to compete with Monarch Money, Copilot Money, YNAB, and Empower while leveraging a production-grade Supabase backend with 10+ years of financial record support.

---

## Design Philosophy

### Core Principles

1. **Dark-first.** The entire app uses dark mode as primary. Deep navy (`#0D0D1A`) base — not black — is softer on eyes during daily financial review. Light mode is a future enhancement.

2. **One accent, many semantics.** Brand purple (`#755DEF`) is the primary action color. Green (`#00C318`) always means income/gain. Coral (`#FF6E52`) always means expense/loss. Orange (`#FF9500`) always means warning. These mappings are never reversed.

3. **Numbers are sacred.** Financial numbers use tabular figures (fixed-width digits) so columns align. Currency symbol always precedes the number. Thousands always use comma separators.

4. **Hierarchy through weight, not size.** Regular weight for body copy, SemiBold for values, Bold for headings, 700 for hero numbers. This keeps layouts compact while remaining scannable.

5. **Cards as containers of trust.** Every piece of financial information lives inside a card with a visible border. This separates data from background and signals that data is official and contained.

---

## Mental Model Shift

| Before | After |
|---|---|
| Expense tracker | Wealth management platform |
| "How much did I spend?" | "What is my net worth?" |
| Monthly focus | 10-year horizon |
| Single data type (expenses) | 6 data domains (expenses, income, savings, investments, assets, debts) |
| Reactive (look back) | Proactive (forecast forward) |
| 5 screens | 34 screens |

---

## Backend Architecture Supported

The redesign is purpose-built for the following Supabase backend modules:

| Module | Core Tables | Materialized Views | Dashboard Functions |
|---|---|---|---|
| Expenses | `expenses`, `expense_categories` | `mv_expense_analytics`, `mv_budget_performance` | `get_expense_breakdown_by_category()`, `get_expense_trends()` |
| Income | `income_records`, `income_sources` | `mv_income_analysis`, `mv_annual_summary` | `get_income_breakdown()` |
| Savings | `savings_goals`, `savings_goal_contributions` | `mv_financial_goals_progress` | `get_savings_goals_progress()` |
| Investments | `investment_accounts`, `investment_holdings`, `investment_transactions` | `mv_investment_performance` | `get_portfolio_allocation()` |
| Net Worth | `asset_accounts`, `debt_accounts`, `net_worth_snapshots` | `mv_net_worth_history`, `mv_asset_allocation_history` | `get_net_worth_trend()` |
| Analytics | All of the above | All `mv_*` views | `get_dashboard_summary()`, `get_financial_metrics()` |

---

## Related Documents

- [`NAVIGATION_STRUCTURE.md`](./NAVIGATION_STRUCTURE.md) — Full nav architecture and tab specification
- [`SCREEN_INVENTORY.md`](./SCREEN_INVENTORY.md) — All 34 screens with ownership and data sources
- [`USER_FLOWS.md`](./USER_FLOWS.md) — 5 primary user flow diagrams
- [`DASHBOARD_DESIGN.md`](./DASHBOARD_DESIGN.md) — Home dashboard layout and zone definitions
- [`MODULES_DESIGN.md`](./MODULES_DESIGN.md) — Savings, Investments, Net Worth, Analytics module specs
- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — Tokens, components, typography, spacing
- [`SCALABILITY.md`](./SCALABILITY.md) — Future feature roadmap and architectural considerations
