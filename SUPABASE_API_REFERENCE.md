# Supabase API Reference

Quick reference for all available services and functions.

## Service Files

- `src/services/auth.service.ts` - Authentication
- `src/services/expenses.service.ts` - Expenses & Categories
- `src/services/income.service.ts` - Income & Sources
- `src/services/savings.service.ts` - Savings Goals
- `src/services/investments.service.ts` - Investments & Holdings
- `src/services/networth.service.ts` - Net Worth & Assets/Debts
- `src/services/dashboard.service.ts` - Dashboard & Analytics

## React Hooks

All hooks available in `src/hooks/useSupabase.ts`:

### Authentication Hooks

```typescript
// Get current logged-in user
const { user, loading } = useCurrentUser();

// Sign in with email/password
const { signIn, loading, error } = useSignIn();
await signIn('user@example.com', 'password');

// Sign up new user
const { signUp, loading, error } = useSignUp();
await signUp('user@example.com', 'password');
```

### Expense Hooks

```typescript
// Get expense categories
const { data: categories, loading, error, refetch } = useExpenseCategories(userId);

// Get all expenses
const { data: expenses, loading, error, refetch } = useExpenses(userId);

// Create expense
const { createExpense, loading, error } = useCreateExpense(userId);
await createExpense({
  category_id: 'uuid',
  description: 'Lunch',
  amount: 15.50,
  date: '2024-01-15',
});

// Get expense breakdown by category
const { data: breakdown } = useExpenseBreakdown(userId, 12);

// Get monthly budget comparison
const { data: comparison } = useMonthlyBudgetComparison(userId);
```

### Income Hooks

```typescript
// Get income sources
const { data: sources } = useIncomeSources(userId);

// Get income records
const { data: records } = useIncomeRecords(userId);

// Get monthly cash flow
const { data: cashFlow } = useMonthlyCashFlow(userId);

// Get income breakdown
const { data: breakdown } = useIncomeBreakdown(userId, 12);
```

### Savings Goals Hooks

```typescript
// Get all savings goals
const { data: goals } = useSavingsGoals(userId, activeOnly);

// Get goals progress
const { data: progress } = useSavingsGoalProgress(userId);

// Create savings goal
const { createGoal, loading, error } = useCreateSavingsGoal(userId);
await createGoal({
  name: 'Vacation',
  target_amount: 5000,
  target_date: '2024-12-31',
  category: 'vacation',
  priority: 3,
});
```

### Investment Hooks

```typescript
// Get investment accounts
const { data: accounts } = useInvestmentAccounts(userId);

// Get investment holdings
const { data: holdings } = useInvestmentHoldings(userId);

// Get portfolio allocation
const { data: allocation } = usePortfolioAllocation(userId);

// Get portfolio value
const { data: value } = usePortfolioValue(userId);
```

### Net Worth Hooks

```typescript
// Get net worth snapshots
const { data: snapshots } = useNetWorthSnapshots(userId, 24);

// Get asset accounts
const { data: assets } = useAssetAccounts(userId);

// Get debt accounts
const { data: debts } = useDebtAccounts(userId);

// Get total assets
const { data: totalAssets } = useTotalAssets(userId);

// Get total debt
const { data: totalDebt } = useTotalDebt(userId);

// Get net worth detail
const { data: details } = useNetWorthDetail(userId);
```

### Dashboard Hooks

```typescript
// Get dashboard summary
const { data: summary } = useDashboardSummary(userId);
// Returns: {
//   net_worth,
//   monthly_income,
//   monthly_expenses,
//   monthly_savings,
//   savings_rate_percent,
//   emergency_fund_months,
//   total_assets,
//   total_debts,
//   investment_value,
//   number_of_goals,
//   goals_completed
// }

// Get financial health metrics
const { data: metrics } = useFinancialHealthMetrics(userId);

// Get annual summary
const { data: annual } = useAnnualSummary(userId);

// Get net worth history
const { data: history } = useNetWorthHistory(userId, 24);

// Get key metrics
const { data: keyMetrics } = useKeyMetrics(userId);

// Get goals progress
const { data: goals } = useGoalsProgress(userId);
```

## Direct Service Functions

### Auth Service

```typescript
import * as authService from '@/services/auth.service';

await authService.signUp({ email, password });
await authService.signIn({ email, password });
await authService.signOut();
await authService.getSession();
await authService.getCurrentUser();
await authService.updateProfile(userId, updates);
await authService.resetPassword(email);
await authService.updatePassword(newPassword);
await authService.getUserProfile(userId);
```

### Expenses Service

```typescript
import * as expensesService from '@/services/expenses.service';

await expensesService.getExpenseCategories(userId);
await expensesService.createExpenseCategory(userId, category);
await expensesService.updateExpenseCategory(categoryId, updates);
await expensesService.deleteExpenseCategory(categoryId);

await expensesService.getExpenses(userId, filters);
await expensesService.getExpense(expenseId);
await expensesService.createExpense(userId, expense);
await expensesService.updateExpense(expenseId, updates);
await expensesService.deleteExpense(expenseId);

await expensesService.getMonthlyExpenseSummary(userId);
await expensesService.getExpenseBreakdown(userId, monthsBack);
await expensesService.getExpenseTrends(userId, categoryId, monthsBack);
await expensesService.getMonthlyBudgetComparison(userId, year, month);
await expensesService.searchExpenses(userId, query);
```

### Income Service

```typescript
import * as incomeService from '@/services/income.service';

await incomeService.getIncomeSources(userId);
await incomeService.createIncomeSource(userId, source);
await incomeService.updateIncomeSource(sourceId, updates);
await incomeService.deleteIncomeSource(sourceId);

await incomeService.getIncomeRecords(userId, filters);
await incomeService.getIncomeRecord(recordId);
await incomeService.createIncomeRecord(userId, record);
await incomeService.updateIncomeRecord(recordId, updates);
await incomeService.deleteIncomeRecord(recordId);

await incomeService.getIncomeBreakdown(userId, monthsBack);
await incomeService.getMonthlyIncomeSummary(userId);
await incomeService.getMonthlyCashFlow(userId);
```

### Savings Service

```typescript
import * as savingsService from '@/services/savings.service';

await savingsService.getSavingsGoals(userId, activeOnly);
await savingsService.getSavingsGoal(goalId);
await savingsService.createSavingsGoal(userId, goal);
await savingsService.updateSavingsGoal(goalId, updates);
await savingsService.completeSavingsGoal(goalId);
await savingsService.deleteSavingsGoal(goalId);

await savingsService.addSavingsContribution(userId, contribution);
await savingsService.getSavingsContributions(goalId);
await savingsService.updateSavingsContribution(contributionId, updates);
await savingsService.deleteSavingsContribution(contributionId);

await savingsService.getSavingsGoalProgress(userId);
await savingsService.getTotalSavings(userId);
```

### Investments Service

```typescript
import * as investmentsService from '@/services/investments.service';

await investmentsService.getInvestmentAccounts(userId);
await investmentsService.createInvestmentAccount(userId, account);
await investmentsService.updateInvestmentAccount(accountId, updates);
await investmentsService.deleteInvestmentAccount(accountId);

await investmentsService.getInvestmentHoldings(userId, accountId);
await investmentsService.createInvestmentHolding(userId, holding);
await investmentsService.updateInvestmentHolding(holdingId, updates);
await investmentsService.deleteInvestmentHolding(holdingId);

await investmentsService.createInvestmentTransaction(userId, transaction);
await investmentsService.getInvestmentTransactions(userId, filters);

await investmentsService.getInvestmentSummary(userId);
await investmentsService.getPortfolioAllocation(userId);
await investmentsService.getInvestmentPerformance(userId);
await investmentsService.getPortfolioValue(userId);
await investmentsService.getRealizedGains(userId);
```

### Net Worth Service

```typescript
import * as networthService from '@/services/networth.service';

await networthService.getNetWorthSnapshots(userId, months);
await networthService.createNetWorthSnapshot(userId, snapshot);

await networthService.getAssetAccounts(userId);
await networthService.createAssetAccount(userId, account);
await networthService.updateAssetAccount(accountId, updates);
await networthService.deleteAssetAccount(accountId);

await networthService.getDebtAccounts(userId);
await networthService.createDebtAccount(userId, account);
await networthService.updateDebtAccount(accountId, updates);
await networthService.deleteDebtAccount(accountId);

await networthService.getNetWorthDetail(userId);
await networthService.getTotalAssets(userId);
await networthService.getTotalDebt(userId);
await networthService.getLiquidityAnalysis(userId);
await networthService.getDebtSummary(userId);
```

### Dashboard Service

```typescript
import * as dashboardService from '@/services/dashboard.service';

await dashboardService.getDashboardSummary(userId);
await dashboardService.getFinancialHealthMetrics(userId);
await dashboardService.getAnnualSummary(userId);
await dashboardService.getNetWorthHistory(userId, months);
await dashboardService.getExpenseAnalytics(userId, months);
await dashboardService.getBudgetPerformance(userId);
await dashboardService.getAssetAllocationHistory(userId, months);
await dashboardService.getIncomeAnalysis(userId, months);
await dashboardService.getFinancialMetrics(userId);
await dashboardService.getSpendingVsIncome(userId);
await dashboardService.getGoalsProgress(userId);
await dashboardService.calculateNetWorth(userId, date);
await dashboardService.getKeyMetrics(userId);
await dashboardService.refreshMaterializedViews();
```

## Return Types

All service functions return an object with:

```typescript
{
  data: T | null,           // The requested data
  error: string | null      // Error message if operation failed
}
```

Example:

```typescript
const { data: expenses, error } = await getExpenses(userId);

if (error) {
  console.error('Failed to fetch expenses:', error);
} else {
  console.log('Expenses:', expenses);
}
```

## Error Handling

```typescript
import { SupabaseError } from '@/lib/supabase';

try {
  const result = await someService.someFunction();
  if (result.error) {
    console.error('Operation failed:', result.error);
  }
} catch (error) {
  if (error instanceof SupabaseError) {
    console.error(`[${error.code}] ${error.message}`);
    console.error('Details:', error.details);
  }
}
```

## Common Patterns

### Fetch and Display Data

```typescript
function ExpenseList() {
  const { user } = useCurrentUser();
  const { data: expenses, loading, error, refetch } = useExpenses(user?.id);

  if (loading) return <ActivityIndicator />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <FlatList
      data={expenses}
      renderItem={({ item }) => <ExpenseItem expense={item} />}
      onRefresh={refetch}
      refreshing={loading}
    />
  );
}
```

### Create with Error Handling

```typescript
function CreateExpense() {
  const { user } = useCurrentUser();
  const { createExpense, loading, error } = useCreateExpense(user?.id);

  const handleCreate = async (formData) => {
    const result = await createExpense(formData);

    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      alert('Expense created!');
      // Navigate back or refresh list
    }
  };

  return (
    <ExpenseForm
      onSubmit={handleCreate}
      isLoading={loading}
    />
  );
}
```

### Real-time Updates (Subscribe)

```typescript
useEffect(() => {
  const subscription = supabase
    .from('expenses')
    .on('*', (payload) => {
      console.log('Change received!', payload);
      refetch(); // Refetch local data
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Performance Tips

1. **Limit results** - Use `limit` and `offset` for pagination
2. **Filter early** - Use database filters instead of filtering in JS
3. **Select specific fields** - Don't select all columns if you don't need them
4. **Cache data** - Use hooks which cache results
5. **Batch operations** - Combine multiple queries where possible
6. **Index queries** - Check `supabase/README.md` for index recommendations

## Rate Limiting

Default Supabase free tier limits:
- 200 requests/second
- 2GB database size
- 50MB file storage

See `SUPABASE_SETUP.md` for production deployment checklist.
