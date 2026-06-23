import * as Sentry from '@sentry/react-native';

export function initCrashReporting() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
  if (!dsn || dsn.includes('REPLACE')) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Only report errors — keep performance overhead minimal for launch
    enableAutoPerformanceTracing: false,
  });
}

export function logError(error: unknown, context?: Record<string, unknown>) {
  if (context) Sentry.setContext('extra', context);
  if (error instanceof Error) {
    Sentry.captureException(error);
  } else {
    Sentry.captureMessage(String(error), 'error');
  }
}

export function setUserContext(userId: string) {
  Sentry.setUser({ id: userId });
}

export function clearUserContext() {
  Sentry.setUser(null);
}
