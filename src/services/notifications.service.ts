import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { Budget } from '../types/models';
import type { CategoryKey } from '../theme';

// expo-notifications auto-registers for push tokens at import time via TokenAutoRegistration.fxs.js,
// triggering a console error in Expo Go since SDK 53 removed remote push support.
// Lazy-loading via require() prevents the module from loading (and auto-registering) in Expo Go.
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type Notifs = typeof import('expo-notifications');
let _notifs: Notifs | null = null;

function getNotifs(): Notifs | null {
  if (IS_EXPO_GO) return null;
  if (!_notifs) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _notifs = require('expo-notifications') as Notifs;
    _notifs.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert:  true,
        shouldShowBanner: true,
        shouldShowList:   true,
        shouldPlaySound:  true,
        shouldSetBadge:   false,
      }),
    });
  }
  return _notifs;
}

// ── Permission + token ──────────────────────────────────────────────────────────

export async function requestPermissionsAndGetToken(): Promise<string | null> {
  const N = getNotifs();
  if (!N) return null;

  const { status: existing } = await N.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await N.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('budget-alerts', {
      name:             'Budget Alerts',
      importance:       N.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#755DEF',
    });
    await N.setNotificationChannelAsync('weekly-summary', {
      name:       'Weekly Summary',
      importance: N.AndroidImportance.DEFAULT,
    });
  }

  try {
    const { data } = await N.getExpoPushTokenAsync();
    return data;
  } catch {
    return null;
  }
}

export async function savePushToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('push_tokens')
    .upsert(
      { user_id: user.id, token, platform: Platform.OS, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
}

// ── Budget threshold notifications ─────────────────────────────────────────────
// Deduplication key: "notif_<threshold>_<budgetId>_<year>_<month>"
// Stored in AsyncStorage so each threshold fires at most once per budget per month.

const DEDUP_PREFIX = 'notif_fired_';

async function wasAlreadyFired(key: string): Promise<boolean> {
  return (await AsyncStorage.getItem(DEDUP_PREFIX + key)) === '1';
}

async function markFired(key: string): Promise<void> {
  await AsyncStorage.setItem(DEDUP_PREFIX + key, '1');
}

export async function checkBudgetThresholds(
  budgets: Budget[],
  alert80Enabled:  boolean,
  alert100Enabled: boolean,
  categoryAlertOverrides: Partial<Record<CategoryKey, boolean>> = {},
): Promise<void> {
  const N = getNotifs();
  if (!N) return;

  for (const budget of budgets) {
    if (budget.limit <= 0) continue;
    if (categoryAlertOverrides[budget.category] === false) continue;
    const ratio = budget.spent / budget.limit;
    const monthKey = `${budget.year}_${budget.month}`;

    if (alert100Enabled && ratio >= 1) {
      const key = `100_${budget.id}_${monthKey}`;
      if (!(await wasAlreadyFired(key))) {
        await N.scheduleNotificationAsync({
          identifier: key,
          content: {
            title:            `🚨 Over Budget: ${budget.label}`,
            body:             `You've exceeded your ${budget.label} budget (limit ₱${budget.limit.toLocaleString('en-PH', { minimumFractionDigits: 0 })}).`,
            data:             { type: 'budget_over', budgetId: budget.id },
            categoryIdentifier: 'budget-alerts',
          },
          trigger: null,
        });
        await markFired(key);
      }
    } else if (alert80Enabled && ratio >= 0.8) {
      const key = `80_${budget.id}_${monthKey}`;
      if (!(await wasAlreadyFired(key))) {
        await N.scheduleNotificationAsync({
          identifier: key,
          content: {
            title:            `⚠️ Budget Warning: ${budget.label}`,
            body:             `You've used ${Math.round(ratio * 100)}% of your ${budget.label} budget.`,
            data:             { type: 'budget_warning', budgetId: budget.id },
            categoryIdentifier: 'budget-alerts',
          },
          trigger: null,
        });
        await markFired(key);
      }
    }
  }
}

// ── Debug test notifications ───────────────────────────────────────────────────

export type TestNotificationType = 'push' | 'weekly_summary' | 'budget_warning' | 'budget_over';

export type TestNotificationResult =
  | { ok: true }
  | { ok: false; reason: 'expo_go' | 'permission_denied' | 'error'; message: string };

export async function fireTestNotification(type: TestNotificationType): Promise<TestNotificationResult> {
  if (IS_EXPO_GO) {
    return {
      ok:      false,
      reason:  'expo_go',
      message: 'Notifications are not supported in Expo Go (SDK 53+). Run a dev build via EAS to test notifications.',
    };
  }

  const N = getNotifs()!;

  const { status } = await N.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: requested } = await N.requestPermissionsAsync();
    if (requested !== 'granted') {
      return {
        ok:      false,
        reason:  'permission_denied',
        message: 'Notification permission was denied. Enable it in your device Settings → Notifications.',
      };
    }
  }

  const contentMap: Record<TestNotificationType, { title: string; body: string }> = {
    push: {
      title: '🔔 Test Notification',
      body:  'Push notifications are working correctly!',
    },
    weekly_summary: {
      title: '📊 Weekly Budget Summary',
      body:  "Here's how your spending tracked this week — tap to review.",
    },
    budget_warning: {
      title: '⚠️ Budget Warning: Food',
      body:  "You've used 85% of your Food budget this month.",
    },
    budget_over: {
      title: '🚨 Over Budget: Entertainment',
      body:  "You've exceeded your Entertainment budget limit.",
    },
  };

  try {
    await N.scheduleNotificationAsync({
      content: { ...contentMap[type], data: { type, _test: true } },
      trigger: null,
    });
    return { ok: true };
  } catch (e) {
    return {
      ok:      false,
      reason:  'error',
      message: e instanceof Error ? e.message : 'Unknown error scheduling notification.',
    };
  }
}

// ── Notification response listener (deep-link on tap) ──────────────────────────

export function addResponseListener(
  listener: (response: import('expo-notifications').NotificationResponse) => void,
): { remove: () => void } {
  const N = getNotifs();
  if (!N) return { remove: () => {} };
  return N.addNotificationResponseReceivedListener(listener);
}

// ── Weekly summary ──────────────────────────────────────────────────────────────

const WEEKLY_SUMMARY_ID = 'weekly-budget-summary';

export async function syncWeeklySummary(enabled: boolean): Promise<void> {
  const N = getNotifs();
  if (!N) return;

  await N.cancelScheduledNotificationAsync(WEEKLY_SUMMARY_ID);

  if (!enabled) return;

  await N.scheduleNotificationAsync({
    identifier: WEEKLY_SUMMARY_ID,
    content: {
      title:              '📊 Weekly Budget Summary',
      body:               'Tap to see how your spending tracked this week.',
      data:               { type: 'weekly_summary' },
      categoryIdentifier: 'weekly-summary',
    },
    trigger: {
      type:    N.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour:    9,
      minute:  0,
    },
  });
}
