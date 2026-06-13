# Financial Tracker Database Schema

Complete Supabase schema for a multi-feature financial tracking application supporting 10+ years of historical data.

## Features

- **Expense Tracking**: Categorized expenses with monthly budgets and trends
- **Income Management**: Multiple income sources with tax tracking
- **Savings Goals**: Progress tracking toward financial goals
- **Investment Portfolio**: Stock, bond, ETF, and crypto holdings with performance tracking
- **Net Worth Tracking**: Monthly snapshots and historical trends
- **Financial Analytics**: Dashboard queries and materialized views for insights
- **Row-Level Security**: All data is isolated per user
- **Scalable Architecture**: Supports 10+ years of financial records

## Database Schema

### Core Tables

#### Users & Settings
- `users` - User accounts with timezone and currency preferences
- `user_settings` - JSON-based user settings storage

#### Expenses
- `expense_categories` - Budget categories with limits and icons
- `expenses` - Individual expense transactions

#### Income
- `income_sources` - Income source definitions
- `income_records` - Individual income transactions

#### Savings & Goals
- `savings_goals` - Financial goals with targets and deadlines
- `savings_goal_contributions` - Contributions toward each goal

#### Investments
- `investment_accounts` - Brokerage, IRA, crypto accounts
- `investment_holdings` - Current holdings in accounts
- `investment_transactions` - Buy/sell/dividend transactions

#### Assets & Debts
- `asset_accounts` - Bank accounts, real estate, vehicles
- `debt_accounts` - Mortgages, loans, credit cards
- `net_worth_snapshots` - Monthly net worth snapshots

### Views

SQL views for common queries:
- `monthly_expense_summary` - Expenses grouped by month and category
- `monthly_income_summary` - Income grouped by month and source
- `monthly_cash_flow` - Income minus expenses by month
- `expense_trends` - Year-over-year expense comparison
- `income_trends` - Year-over-year income comparison
- `investment_summary` - Current portfolio with gains/losses
- `asset_allocation` - Portfolio allocation by asset class
- `savings_goal_status` - Progress on each savings goal
- `net_worth_detail` - Net worth breakdown by asset type
- `budget_vs_actual` - Monthly budget comparison
- `financial_health_metrics` - Key financial indicators

### Materialized Views

Pre-computed views for dashboard performance (refresh daily):
- `mv_annual_summary` - Annual income, expenses, savings
- `mv_net_worth_history` - Net worth with month-over-month changes
- `mv_expense_analytics` - Expense trends with 12-month rolling averages
- `mv_budget_performance` - Budget tracking with status
- `mv_investment_performance` - Portfolio performance metrics
- `mv_asset_allocation_history` - Historical asset allocation
- `mv_income_analysis` - Income trends with 12-month rolling averages
- `mv_financial_goals_progress` - Goals with progress and status

### Dashboard Functions

Pre-built analytics functions:
- `get_dashboard_summary()` - Overview metrics
- `get_expense_breakdown_by_category()` - Expense analysis
- `get_expense_trends()` - Expense trends by category
- `get_income_breakdown()` - Income analysis
- `get_net_worth_trend()` - Net worth historical trends
- `get_portfolio_allocation()` - Investment allocation
- `get_savings_goals_progress()` - Goals status
- `get_monthly_budget_comparison()` - Budget vs actual
- `get_financial_metrics()` - Key metrics summary

## Migrations

Run migrations in order to set up the complete schema:

1. **001_init.sql** - Core tables, indexes, and functions
2. **002_views.sql** - SQL views for common queries
3. **003_materialized_views.sql** - Materialized views and refresh functions
4. **004_rls_policies.sql** - Row-level security policies
5. **005_dashboard_queries.sql** - Dashboard functions and analytics
6. **006_seed_data.sql** - Sample data for development (optional)

## Supabase Setup

### 1. Create a new Supabase project
```bash
supabase projects create --name financial-tracker
```

### 2. Apply migrations
```bash
supabase db push
```

Or apply manually in Supabase dashboard:
- Go to SQL Editor
- Copy each migration file and execute

### 3. Configure authentication
```sql
-- Enable email/password auth in Supabase dashboard
-- Auth > Providers > Email
```

### 4. Update RLS policies if needed
If policies need adjustment:
```sql
ALTER POLICY "Users can read own profile" ON users
  USING (auth.uid() = id);
```

## Example Queries

### Get User Dashboard Summary
```sql
SELECT * FROM get_dashboard_summary('user-id'::UUID);
```

### Get Expense Breakdown (Last 12 Months)
```sql
SELECT * FROM get_expense_breakdown_by_category('user-id'::UUID, 12);
```

### Get Net Worth Trend (Last 24 Months)
```sql
SELECT * FROM get_net_worth_trend('user-id'::UUID, 24);
```

### Get Portfolio Allocation
```sql
SELECT * FROM get_portfolio_allocation('user-id'::UUID);
```

### Get Savings Goals Progress
```sql
SELECT * FROM get_savings_goals_progress('user-id'::UUID);
```

### Get Monthly Budget vs Actual (Current Month)
```sql
SELECT * FROM get_monthly_budget_comparison('user-id'::UUID);
```

### Get Expense Trends by Category
```sql
SELECT * FROM get_expense_trends('user-id'::UUID, NULL, 12);
```

### Get Income Breakdown (Last 12 Months)
```sql
SELECT * FROM get_income_breakdown('user-id'::UUID, 12);
```

### Query Annual Summary View
```sql
SELECT * FROM mv_annual_summary WHERE user_id = 'user-id'::UUID;
```

### Query Net Worth History
```sql
SELECT * FROM mv_net_worth_history 
WHERE user_id = 'user-id'::UUID
ORDER BY snapshot_date DESC
LIMIT 24;
```

## Data Architecture

### Time Series Data
- All transactions use `DATE` type for transaction date
- Snapshots use `TIMESTAMP WITH TIME ZONE` for when calculated
- Supports 10+ years of daily records without performance issues

### Soft Deletes
- Tables have `deleted_at` column for soft deletes
- RLS policies respect soft deletes
- Allows data recovery and historical queries

### Indexes
- Indexes on user_id for all tables (partition key)
- Indexes on date fields for time-based queries
- Composite indexes on common query patterns

### Materialized Views
- Refresh daily at 2 AM UTC (configure in Supabase Edge Functions)
- Enable fast dashboard loading
- Use `refresh_materialized_views()` function to manually refresh

## Performance Considerations

### For Production (10+ years of data)
- Consider table partitioning by year for transactions
- Use read replicas for analytics
- Schedule materialized view refreshes during off-peak hours
- Archive old data (>10 years) to cold storage

### Example Partitioning (Optional)
```sql
CREATE TABLE expenses_2024 PARTITION OF expenses
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### Recommended Indexes to Add
```sql
-- For very large datasets
CREATE INDEX idx_expenses_date_gist ON expenses USING GIST (date);
CREATE INDEX idx_income_date_gist ON income_records USING GIST (date);
```

## API Usage from App

### TypeScript/JavaScript Example
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Get dashboard summary
const { data, error } = await supabase
  .rpc('get_dashboard_summary', { p_user_id: userId });

// Get expenses breakdown
const { data: expenses } = await supabase
  .rpc('get_expense_breakdown_by_category', {
    p_user_id: userId,
    p_months_back: 12
  });

// Direct view query
const { data: netWorth } = await supabase
  .from('mv_net_worth_history')
  .select('*')
  .eq('user_id', userId)
  .order('snapshot_date', { ascending: false })
  .limit(24);
```

## Security

### Row-Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Policies automatically filter by `auth.uid()`
- Service role key can bypass RLS (for admin operations)

### SQL Injection Prevention
- Use parameterized queries
- Functions use prepared statements
- Never concatenate user input into SQL

### Data Privacy
- No financial data is logged
- Soft deletes preserve data for recovery
- No automatic backups of PII (configure separately)

## Maintenance

### Regular Tasks
- **Daily**: Refresh materialized views
- **Weekly**: Monitor query performance
- **Monthly**: Archive old transactions if needed
- **Quarterly**: Review and optimize indexes

### Backup Strategy
- Enable Supabase automated backups
- Set backup frequency to at least daily
- Test restore procedures quarterly

### Growth Monitoring
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting

### Slow Queries
1. Check indexes exist: `\d table_name`
2. Analyze slow query: `EXPLAIN ANALYZE SELECT ...`
3. Look for sequential scans instead of index scans
4. Add missing indexes if needed

### Materialized View Refresh Issues
```sql
-- Manually refresh specific view
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_annual_summary;

-- Check last refresh time
SELECT * FROM pg_stat_user_indexes 
WHERE relname = 'mv_annual_summary';
```

### RLS Policy Debugging
```sql
-- Check active policies
SELECT * FROM pg_policies 
WHERE tablename = 'expenses';

-- Test RLS with specific user
SET local role auth_user;
SET local request.jwt.claim.sub TO 'user-id';
SELECT * FROM expenses;
```

## Future Enhancements

- [ ] Budget alerts via email
- [ ] Monthly spending patterns using ML
- [ ] Recurring expense detection
- [ ] Currency conversion for multi-currency support
- [ ] Data export to CSV/PDF
- [ ] Advanced forecasting models
- [ ] Integration with banks via Plaid/Yodlee
- [ ] Cryptocurrency price tracking
- [ ] Tax optimization suggestions

## License

MIT
