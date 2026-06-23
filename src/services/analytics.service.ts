import PostHog from 'posthog-react-native';

// ─── Singleton client ─────────────────────────────────────────────────────────

let _client: PostHog | null = null;

export function getAnalytics(): PostHog | null {
  return _client;
}

export function initAnalytics(): PostHog {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';
  if (!apiKey || apiKey.startsWith('phc_REPLACE')) {
    // PostHog not configured — no-op client won't be created.
    // All capture() calls below guard against null, so this is safe.
    return _client!;
  }
  if (_client) return _client;
  _client = new PostHog(apiKey, { host: 'https://us.i.posthog.com', flushAt: 1, captureScreenViews: false });
  return _client;
}

// ─── Identity ─────────────────────────────────────────────────────────────────

export function identifyUser(userId: string, properties?: Record<string, string | number | boolean | null | undefined>) {
  _client?.identify(userId, properties as Record<string, string>);
}

export function resetAnalyticsUser() {
  _client?.reset();
}

// ─── Typed event catalogue ────────────────────────────────────────────────────

type OnboardingStep = 'accounts' | 'networth' | 'budget' | 'notifications';

export function trackAppOpened() {
  _client?.capture('app_opened');
}

export function trackOnboardingStepCompleted(step: OnboardingStep) {
  _client?.capture('onboarding_step_completed', { step });
}

export function trackOnboardingAbandoned(step: OnboardingStep) {
  _client?.capture('onboarding_abandoned', { step });
}

export function trackOnboardingCompleted() {
  _client?.capture('onboarding_completed');
}

export function trackNetWorthRevealed(netWorth: number) {
  _client?.capture('net_worth_revealed', { net_worth: netWorth });
}

/** Call immediately after a user first sees their net worth — measures TTFV. */
export function trackTTFV(installTimestampMs: number) {
  const seconds = Math.round((Date.now() - installTimestampMs) / 1000);
  _client?.capture('ttfv_achieved', { ttfv_seconds: seconds });
}

export function trackFirstExpenseLogged() {
  _client?.capture('first_expense_logged');
}

export function trackFirstBudgetCreated() {
  _client?.capture('first_budget_created');
}

export function trackExpenseLogged(properties?: { category?: string }) {
  _client?.capture('expense_logged', properties);
}

export function trackPaywallViewed(trigger?: string) {
  _client?.capture('paywall_viewed', trigger ? { trigger } : undefined);
}

export function trackTrialStarted() {
  _client?.capture('trial_started');
}

export function trackSubscriptionConverted(plan: 'monthly' | 'annual') {
  _client?.capture('subscription_converted', { plan });
}

export function trackScreen(screenName: string) {
  _client?.screen(screenName);
}
