# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npx expo start          # start dev server (Expo Go / dev build)
npx expo start --android
npx expo start --ios
npx tsc --noEmit        # type-check (no build output — CI gate)
```

No lint script is configured. No test runner is set up yet (Phase 15).

## Architecture

### Stack
Expo SDK 54 · React Native 0.81 · TypeScript · Supabase (Postgres + Auth) · React Query v5 · Zustand v5

### Navigation
Six nested React Navigation stacks, all typed in `src/navigation/types.ts`:

```
Root stack
├── Auth stack          (Welcome → Login / SignUp / ForgotPassword)
└── Main tab bar
    ├── Home stack      (Dashboard, HealthScoreDetail, Search, Profile, …)
    ├── Transactions stack
    ├── Budget stack
    ├── Wealth stack    (savings goals, investments, net worth)
    └── Analytics stack
```

`RootNavigator` also mounts `QuickAddSheet` as a transparent modal and conditionally renders `BiometricLockScreen` before the main navigator.

### Data flow
```
Supabase DB
  └── src/services/finance.service.ts   ← all DB queries live here
        └── src/hooks/queries/use*.ts   ← React Query wrappers (one file per domain)
              └── screen components     ← consume via useQuery / useMutation
```

All services share a single `uid()` helper that throws if the user is not authenticated. Domain splits: `finance.service.ts` (primary, all budget/transaction/wealth queries), `notifications.service.ts`, `auth.service.ts`.

React Query is configured with `networkMode: 'offlineFirst'` so screens serve cached data when offline. Default `staleTime` is 5 minutes; most query hooks override it per their freshness needs.

### State management
Two Zustand stores:

| Store | Persisted | Contents |
|---|---|---|
| `src/store/auth.store.ts` | No | Supabase `User` object, `isAuthenticated`, loading/error |
| `src/store/app.store.ts` | Yes (AsyncStorage) | `themePreference`, `currency`, notification flags, `biometricEnabled` |

`isBiometricUnlocked` is intentionally excluded from persistence (session-only).

### Theme
`useTheme()` (`src/hooks/ui/useTheme.ts`) reads `themePreference` from `app.store` and the device `useColorScheme()`, then returns either `darkTheme` or `lightTheme` from `src/theme/`. Always destructure the full theme object in components — never import individual token files directly.

### Currency
`useCurrency()` (`src/utils/currency.ts`) returns `{ currency, symbol, fmt, fmtCompact }` where `fmt` and `fmtCompact` are bound to the user's current currency and are fully reactive.

**Critical rule:** Always call `useCurrency()` inside a component body. Module-level functions that call `useAppStore.getState().currency` are non-reactive — the component will never re-render when currency changes. The `hook-refactor` agent (`.claude/agents/hook-refactor.md`) can fix violations automatically.

### Supabase auth token storage
`src/lib/supabase.ts` uses a custom `SecureStoreAdapter` with chunking to work around two iOS SecureStore limits:
- Keys must be ≤ 30 characters (keys are sanitized and capped at 24 chars to leave room for chunk suffixes like `.0`, `.n`)
- Values must be ≤ 2048 bytes (tokens are split into 1900-byte chunks stored as `key.0`, `key.1`, …, with `key.n` holding the count)

### expo-notifications
`src/services/notifications.service.ts` lazy-loads `expo-notifications` via `require()` inside a `getNotifs()` function rather than a static import. This prevents the library's `TokenAutoRegistration` module-level side effect from running in Expo Go, which would otherwise throw a console error on SDK 53+ (remote push was removed from Expo Go in SDK 53). Always follow this pattern for any future notification code — do not add a static import.
