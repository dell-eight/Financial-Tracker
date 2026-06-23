/**
 * delete-account Edge Function
 *
 * Permanently deletes the authenticated user's account and all associated data.
 * Must be called with a valid user JWT — users can only delete their own account.
 *
 * Deletion order is intentional:
 *  1. expenses        — unblocks RESTRICT on expense_categories
 *  2. income_records  — unblocks RESTRICT on income_sources
 *  3. transfers       — unblocks FK on asset_accounts (no cascade defined)
 *  4. users row       — cascades all remaining app tables
 *  5. auth.deleteUser — cascades user_security_settings, notifications, other_assets
 *
 * Deploy: npx supabase functions deploy delete-account
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── 1. Verify caller identity from JWT ────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // User-scoped client — verifies JWT and resolves the user
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const uid = user.id;

    // ── 2. Admin client for privileged operations ─────────────────────────────
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // ── 3. Delete in dependency order ─────────────────────────────────────────

    // expenses first — expense_categories has ON DELETE RESTRICT from expenses
    const { error: expErr } = await admin
      .from('expenses')
      .delete()
      .eq('user_id', uid);
    if (expErr) throw new Error(`expenses: ${expErr.message}`);

    // income_records — income_sources has ON DELETE RESTRICT from income_records
    const { error: incErr } = await admin
      .from('income_records')
      .delete()
      .eq('user_id', uid);
    if (incErr) throw new Error(`income_records: ${incErr.message}`);

    // transfers — asset_accounts has no cascade defined
    const { error: trfErr } = await admin
      .from('transfers')
      .delete()
      .eq('user_id', uid);
    if (trfErr) throw new Error(`transfers: ${trfErr.message}`);

    // users row — cascades everything remaining in the app schema:
    //   user_settings, expense_categories, income_sources, savings_goals,
    //   savings_goal_contributions, investment_accounts, investment_holdings,
    //   investment_transactions, asset_accounts, debt_accounts,
    //   net_worth_snapshots, wealth_milestones
    const { error: usrErr } = await admin
      .from('users')
      .delete()
      .eq('id', uid);
    if (usrErr) throw new Error(`users: ${usrErr.message}`);

    // auth user — cascades: user_security_settings, notifications, other_assets
    const { error: authErr } = await admin.auth.admin.deleteUser(uid);
    if (authErr) throw new Error(`auth.deleteUser: ${authErr.message}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
