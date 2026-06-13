# Supabase Integration Setup Guide

Complete guide to set up and use Supabase with your Financial Tracker app.

## Prerequisites

- Node.js 16+ and npm/yarn
- Supabase account (free tier available at https://supabase.com)
- Expo CLI installed

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: `financial-tracker`
   - **Database Password**: Generate strong password (save it)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine to start

5. Wait for project to initialize (5-10 minutes)

## Step 2: Get Credentials

1. Go to **Settings > API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** → `SUPABASE_URL`
   - **Anon Key** (public) → `SUPABASE_ANON_KEY`
   - **Service Role Key** (secret) → Keep safe, only for backend

## Step 3: Configure Environment Variables

Create or update `.env.local` in project root:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Update `app.json` with environment config:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project.supabase.co",
      "supabaseAnonKey": "your-anon-key-here"
    }
  }
}
```

## Step 4: Apply Database Migrations

### Option A: Using Supabase Dashboard (Easiest)

1. Go to **SQL Editor** in Supabase dashboard
2. Copy the entire contents of each migration file in order:
   - `supabase/migrations/001_init.sql`
   - `supabase/migrations/002_views.sql`
   - `supabase/migrations/003_materialized_views.sql`
   - `supabase/migrations/004_rls_policies.sql`
   - `supabase/migrations/005_dashboard_queries.sql`

3. Paste into Supabase SQL Editor
4. Click "Run" for each migration

### Option B: Using CLI (Requires Supabase CLI)

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Step 5: Load Seed Data (Optional)

For development/testing, load sample data:

1. Open `supabase/migrations/006_seed_data.sql`
2. **IMPORTANT**: Replace the user ID `'00000000-0000-0000-0000-000000000001'` with your actual user ID
3. Copy and paste into SQL Editor and run

To get your user ID:
1. Go to **Authentication > Users** in Supabase
2. Create a test user or use your own
3. Copy the UUID in the `ID` column

## Step 6: Install Dependencies

```bash
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-react-native  # Optional, for auth helpers
```

## Step 7: Verify Setup

Create a test file `src/lib/supabase.test.ts`:

```typescript
import { supabase } from './supabase';

async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

testConnection();
```

Run it:

```bash
npx ts-node src/lib/supabase.test.ts
```

## Step 8: Configure Authentication

### Enable Email/Password Auth

1. Go to **Authentication > Providers** in Supabase
2. Click "Email"
3. Toggle ON "Email/Password"
4. Configure email settings as desired
5. Click "Save"

### Configure Google OAuth (Optional)

1. Go to **Authentication > Providers**
2. Click "Google"
3. Add your Google OAuth credentials
4. Click "Save"

## Step 9: Set Up Secure Storage for Auth Tokens

For React Native/Expo, use Secure Storage to persist auth tokens:

```bash
npm install expo-secure-store
```

Create `src/lib/secureStorage.ts`:

```typescript
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error reading secure storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error writing secure storage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing secure storage:', error);
    }
  },
};
```

## Step 10: Start Using Services

### Example: Get User Dashboard

In a React component:

```typescript
import { useDashboardSummary, useCurrentUser } from '@/hooks/useSupabase';

function Dashboard() {
  const { user } = useCurrentUser();
  const { data: summary, loading, error } = useDashboardSummary(user?.id);

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View>
      <Text>Net Worth: ${summary?.net_worth}</Text>
      <Text>Monthly Income: ${summary?.monthly_income}</Text>
      <Text>Monthly Expenses: ${summary?.monthly_expenses}</Text>
    </View>
  );
}
```

### Example: Create Expense

```typescript
import { useCreateExpense } from '@/hooks/useSupabase';

function CreateExpenseForm() {
  const { user } = useCurrentUser();
  const { createExpense, loading } = useCreateExpense(user?.id);

  const handleSubmit = async (data: any) => {
    const result = await createExpense({
      category_id: data.category,
      description: data.description,
      amount: data.amount,
      date: data.date,
    });

    if (!result.error) {
      console.log('Expense created:', result.expense);
    }
  };

  return (
    // Form JSX
  );
}
```

## Available Hooks

### Auth
- `useCurrentUser()` - Get logged-in user
- `useSignIn()` - Sign in with email/password
- `useSignUp()` - Register new account

### Expenses
- `useExpenseCategories(userId)` - Get expense categories
- `useExpenses(userId)` - Get all expenses
- `useCreateExpense(userId)` - Create new expense
- `useExpenseBreakdown(userId)` - Get expense breakdown by category
- `useMonthlyBudgetComparison(userId)` - Compare budget vs actual

### Income
- `useIncomeSources(userId)` - Get income sources
- `useIncomeRecords(userId)` - Get income records
- `useMonthlyCashFlow(userId)` - Get cash flow (income - expenses)
- `useIncomeBreakdown(userId)` - Get income breakdown by source

### Savings Goals
- `useSavingsGoals(userId)` - Get all goals
- `useSavingsGoalProgress(userId)` - Get goal progress with tracking
- `useCreateSavingsGoal(userId)` - Create new goal

### Investments
- `useInvestmentAccounts(userId)` - Get investment accounts
- `useInvestmentHoldings(userId)` - Get investment holdings
- `usePortfolioAllocation(userId)` - Get asset allocation
- `usePortfolioValue(userId)` - Get total portfolio value

### Net Worth
- `useNetWorthSnapshots(userId)` - Get historical net worth
- `useAssetAccounts(userId)` - Get asset accounts
- `useDebtAccounts(userId)` - Get debt accounts
- `useTotalAssets(userId)` - Calculate total assets
- `useTotalDebt(userId)` - Calculate total debt

### Dashboard
- `useDashboardSummary(userId)` - Get dashboard overview
- `useFinancialHealthMetrics(userId)` - Get key metrics
- `useNetWorthHistory(userId)` - Get net worth trend
- `useKeyMetrics(userId)` - Get key metrics summary
- `useGoalsProgress(userId)` - Get goals progress

## Direct Service Functions

For more control, use services directly:

```typescript
import {
  getExpenses,
  createExpense,
  getDashboardSummary,
  getNetWorthHistory,
} from '@/services';

// Direct API calls
const { expenses, error } = await getExpenses(userId);
const { summary } = await getDashboardSummary(userId);
```

See `src/services/` for all available functions.

## Troubleshooting

### "Missing Supabase credentials"

Check that environment variables are set correctly:

```bash
# In terminal
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

### RLS Policy Errors

If you get "permission denied" errors:

1. Verify user is authenticated: `useCurrentUser()`
2. Check that RLS policies are enabled:
   - Go to **Authentication > Policies** in Supabase
   - Verify policies are created for your table
3. Ensure user ID matches in policies

### Slow Queries

Check `supabase/README.md` for query optimization tips.

### Refresh Materialized Views

Views auto-refresh daily. To manually refresh:

```typescript
import { refreshMaterializedViews } from '@/services/dashboard.service';

await refreshMaterializedViews();
```

## Next Steps

1. **Set up sign-up/login screens** using `useSignUp()` and `useSignIn()`
2. **Create dashboard screens** using dashboard hooks
3. **Add expense tracking** using expense services
4. **Set up investment tracking** using investment services
5. **Configure push notifications** for budget alerts (optional)

## Production Deployment

Before going live:

1. **Enable 2FA** for your Supabase account
2. **Rotate API keys** - Create new keys for production
3. **Configure CORS** - Add your app domain to allowed origins
4. **Set up backups** - Enable automatic backups in Supabase
5. **Monitor usage** - Check database size and query stats
6. **Enable rate limiting** - In Authentication > Rate Limiting
7. **Test thoroughly** - Use seed data to test all features

## Resources

- Supabase Docs: https://supabase.com/docs
- Supabase Examples: https://github.com/supabase/examples
- React Native Supabase: https://supabase.com/docs/guides/realtime/quickstarts/react-native
- Database Schema: `supabase/README.md`
- API Types: `src/types/supabase.ts`

## Support

- Supabase Discord: https://discord.supabase.io
- GitHub Issues: Create an issue in your repo
- Stack Overflow: Tag with `supabase` and `react-native`
