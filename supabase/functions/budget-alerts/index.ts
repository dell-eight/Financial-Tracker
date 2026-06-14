/**
 * budget-alerts Edge Function
 *
 * Runs on a pg_cron schedule (daily at 08:00 UTC).
 * Finds every user whose current-month budget category is at ≥ 80 % or ≥ 100 %
 * and sends an Expo push notification to their registered device.
 *
 * Deploy:  npx supabase functions deploy budget-alerts
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY are injected automatically.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to:    string;
  title: string;
  body:  string;
  data?: Record<string, unknown>;
  sound?: 'default';
}

async function sendPushBatch(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  await fetch(EXPO_PUSH_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body:    JSON.stringify(messages),
  });
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const now   = new Date();
  const year  = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-based

  // 1. Get all budget categories with a limit set (not deleted)
  const { data: categories, error: catErr } = await supabase
    .from('expense_categories')
    .select('id, user_id, name, icon, budget_limit')
    .not('budget_limit', 'is', null)
    .gt('budget_limit', 0)
    .is('deleted_at', null);

  if (catErr) {
    return new Response(JSON.stringify({ error: catErr.message }), { status: 500 });
  }

  if (!categories || categories.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  // 2. For each category, sum spending for the current month
  const categoryIds = categories.map(c => c.id);

  const { data: spendingRows } = await supabase
    .from('transactions')
    .select('expense_category_id, amount')
    .in('expense_category_id', categoryIds)
    .eq('type', 'expense')
    .gte('date', `${year}-${String(month).padStart(2, '0')}-01`)
    .lt('date', month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`,
    );

  // Aggregate spent per category
  const spentMap: Record<string, number> = {};
  for (const row of spendingRows ?? []) {
    if (!row.expense_category_id) continue;
    spentMap[row.expense_category_id] = (spentMap[row.expense_category_id] ?? 0) + Number(row.amount);
  }

  // 3. Find over-threshold categories and collect user_ids
  const alerts: Array<{ userId: string; title: string; body: string; type: string }> = [];

  for (const cat of categories) {
    const spent = spentMap[cat.id] ?? 0;
    const ratio = spent / cat.budget_limit;

    if (ratio >= 1) {
      alerts.push({
        userId: cat.user_id,
        title:  `🚨 Over Budget: ${cat.name}`,
        body:   `${cat.icon} You've exceeded your ${cat.name} budget (₱${Math.round(spent).toLocaleString()} / ₱${cat.budget_limit.toLocaleString()}).`,
        type:   'budget_over',
      });
    } else if (ratio >= 0.8) {
      alerts.push({
        userId: cat.user_id,
        title:  `⚠️ Budget Warning: ${cat.name}`,
        body:   `${cat.icon} You've used ${Math.round(ratio * 100)}% of your ${cat.name} budget.`,
        type:   'budget_warning',
      });
    }
  }

  if (alerts.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  // 4. Fetch push tokens for the affected users
  const userIds = [...new Set(alerts.map(a => a.userId))];

  const { data: tokenRows } = await supabase
    .from('push_tokens')
    .select('user_id, token')
    .in('user_id', userIds);

  const tokenMap: Record<string, string> = {};
  for (const row of tokenRows ?? []) {
    tokenMap[row.user_id] = row.token;
  }

  // 5. Build and send Expo push messages
  const messages: ExpoPushMessage[] = [];

  for (const alert of alerts) {
    const token = tokenMap[alert.userId];
    if (!token) continue;
    messages.push({
      to:    token,
      title: alert.title,
      body:  alert.body,
      data:  { type: alert.type },
      sound: 'default',
    });
  }

  await sendPushBatch(messages);

  return new Response(JSON.stringify({ sent: messages.length }), { status: 200 });
});
