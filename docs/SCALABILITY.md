# Future Scalability Considerations

**Version:** 1.0  
**Date:** June 2026

---

## Overview

The architecture described in this document is designed to scale well beyond the initial feature set. Every future enhancement listed below can be implemented **without breaking changes** to the existing schema, navigation structure, or component library.

---

## Near-Term Enhancements (3–6 months)

### 1. Multi-Currency Support

**Status:** Schema ready — no migrations needed.

The `base_currency` field exists in the `users` table. The `currency` field exists on `income_records`, `investment_accounts`, `investment_holdings`, and `asset_accounts`.

**Implementation steps:**
1. Add currency conversion service (using Open Exchange Rates API or similar)
2. Store exchange rates in a new `exchange_rates` table: `(base_currency, target_currency, rate, fetched_at)`
3. Update all display components to accept an optional `displayCurrency` prop
4. On the `users` profile, add a currency selector
5. **Rule:** Never store converted values in the database. Always store in original currency and convert at read time.

**UX impact:** Add a currency toggle to the top of the Home dashboard. The hero Net Worth card shows a subtle "Converted to PHP" label when multi-currency mode is active.

---

### 2. Recurring Transaction Automation

**Status:** Schema ready — `is_recurring` and `recurring_frequency` fields exist on `expenses` and `income_records`.

**Implementation:**
```
Supabase Edge Function: scheduled daily at 00:01 UTC
  1. SELECT * FROM expenses WHERE is_recurring = true
       AND recurring_end_date > CURRENT_DATE
       AND date + frequency_interval = CURRENT_DATE
  2. For each match: INSERT INTO expenses (copy with new date, created_by = 'system')
  3. Repeat for income_records
```

**UX impact:** Recurring transactions appear in the list with a ↻ icon. A new "Recurring" section in Transaction List shows all active recurring rules. Users can pause or cancel from there.

---

### 3. Budget Alerts via Push Notifications

**Status:** Schema ready — `user_settings` stores JSON alert preferences.

**Implementation:**
```
Supabase Edge Function: scheduled daily at 20:00 user local time
  1. Read mv_budget_performance for current month
  2. For each category where percent_of_budget >= threshold:
     - Check user_settings for notification preference
     - If enabled: send Expo Push Notification
```

**Alert triggers:**
- 80% of any category budget used → "⚠️ Almost at your Transport budget"
- 100% exceeded → "🚨 Over budget on Entertainment this month"
- Savings goal deadline approaching (<30 days, <7 days) → "📅 Your Europe Trip goal is due in 7 days"
- Net worth milestone → "🎉 You've crossed ₱500,000 in net worth!"

---

### 4. Data Export

**Status:** `DataExportScreen` is planned but not implemented.

**Export formats:**
- **CSV:** One file per entity type (expenses, income, holdings) with date range filter
- **PDF:** Formatted monthly/annual financial report (generated via Supabase Edge Function using a template)

**Implementation:** Edge Function accepts `{ userId, startDate, endDate, format }` → queries all relevant tables → returns a pre-signed storage URL for download.

---

## Medium-Term Enhancements (6–12 months)

### 5. Bank Account Sync (Open Finance)

**Status:** Schema compatible — add two columns: `external_id TEXT` and `import_source TEXT` to `expenses` and `income_records`.

**Architecture:**
1. Integrate Plaid (US), Brankas (Southeast Asia), or Tink (Europe)
2. Webhook endpoint in Supabase Edge Functions receives new transactions
3. Deduplication logic: check `external_id` before INSERT
4. Categorization: use the bank-provided category as a starting point, allow user override
5. Confirmation queue: new imported transactions go into a `pending_review` state before appearing in the main list

**UX impact:** A new "Connected Accounts" section in Profile. A "Review Imports" screen shows pending imported transactions for user confirmation.

---

### 6. Shared Finances / Couples Mode

**Status:** Schema compatible — no changes to transaction tables needed.

**Architecture change:**
1. Add `households` table: `(id, name, created_at)`
2. Add `household_members` table: `(household_id, user_id, role)`
3. Update RLS policies:
   ```sql
   -- Allow reading household members' data
   CREATE POLICY "Household members can read shared data"
   ON expenses FOR SELECT
   USING (user_id IN (
     SELECT user_id FROM household_members
     WHERE household_id = (
       SELECT household_id FROM household_members WHERE user_id = auth.uid()
     )
   ));
   ```
4. Add `visibility` field to `expenses`: `'private'` or `'shared'`

**UX impact:** Shared transactions show the other person's avatar. The dashboard has a toggle: "My View" vs "Household View".

---

### 7. Investment Price Sync

**Status:** Schema ready — `current_price` field exists on `investment_holdings`.

**Architecture:**
1. Scheduled Edge Function queries a price API (e.g., Alpaca, Polygon.io, CoinGecko for crypto)
2. Updates `investment_holdings.current_price` for all active holdings
3. Logs to an `investment_price_history` table for charting

**UX impact:** The Portfolio screen shows a "Prices updated 2 hours ago" timestamp. Holdings list values update in real time.

---

## Long-Term Vision (12+ months)

### 8. AI-Powered Financial Insights

**Status:** Schema ready — materialized views produce exactly the shaped data needed for LLM prompts.

**Architecture:**
```
Supabase Edge Function: generate_insights(userId)
  1. Fetch last 3 months from mv_expense_analytics
  2. Fetch last 3 months from mv_income_analysis  
  3. Fetch from mv_financial_goals_progress
  4. Construct structured prompt for Claude API
  5. Return 3 natural-language insights + 1 recommended action
  6. Cache result in user_settings for 24 hours
```

**Example outputs:**
- "Your dining spending has increased 23% over the last 3 months. You're on track to exceed your Food budget by ₱2,400 this month."
- "Based on your current savings rate, you'll reach your emergency fund goal 4 months ahead of schedule."
- "Your biggest income month was January. Consider automating a higher contribution to your savings goals in January and February."

**UX placement:** A new "Insights" card on the Home dashboard, below the Health Score.

---

### 9. Financial Forecasting Engine

**Status:** Partially designed in `ForecastScreen` but using frontend-only calculations.

**Full implementation:**
1. Move forecast calculations to a Supabase Edge Function for server-side consistency
2. Support scenario modeling: "What if I increase my savings rate by 10%?"
3. Add a "Financial Independence" milestone calculator based on the 4% rule
4. Retirement projection using compound interest modeling

---

### 10. Tax Planning Module

**New tables required:**
- `tax_records` — annual income, deductions, estimated tax
- `tax_categories` — map expense categories to tax deductibility types

**New screens:**
- `TaxSummaryScreen` — Annual income summary formatted for tax filing
- `DeductibleExpensesScreen` — Expenses tagged as potentially deductible

---

## Architectural Principles for All Future Features

1. **No schema breaking changes.** Add columns with `DEFAULT` values or `NULL`. Never remove or rename columns — deprecate via `deleted_at` or feature flags.

2. **RLS first.** Every new table gets RLS policies before it ships to production. Never rely on application-layer security alone.

3. **Materialized views for dashboards.** Any new aggregate that appears on a dashboard or analytics screen should be a materialized view, refreshed on a schedule — not a real-time computed query.

4. **Service layer pattern.** Every new data domain gets its own service file in `src/services/`. No direct Supabase calls from React components — always through the service layer.

5. **Soft deletes everywhere.** Every user-generated table gets a `deleted_at TIMESTAMP WITH TIME ZONE` column. This enables undo, audit trails, and data recovery.

6. **Type safety end-to-end.** Every new table, view, and function gets corresponding TypeScript types in `src/types/supabase.ts`. The service layer always returns typed responses.

7. **Mobile-first, progressive enhancement.** New features are designed for a 375px viewport first. Tablet and web layouts are added afterward with `useWindowDimensions()` breakpoints.
