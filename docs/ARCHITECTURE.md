# ARCHITECTURE.md — Networthy App
> React Native · Expo · TypeScript · Zustand · React Query · React Navigation
> Companion to DESIGN_SPEC.md and PRODUCT_REQUIREMENTS.md

---

## Table of Contents

1. [Guiding Principles](#1-guiding-principles)
2. [Technology Decisions](#2-technology-decisions)
3. [Full Folder Structure](#3-full-folder-structure)
4. [Folder-by-Folder Rationale](#4-folder-by-folder-rationale)
5. [Data Flow Architecture](#5-data-flow-architecture)
6. [State Domains and Ownership](#6-state-domains-and-ownership)
7. [Navigation Architecture](#7-navigation-architecture)
8. [API and Service Layer](#8-api-and-service-layer)
9. [Offline-First Strategy](#9-offline-first-strategy)
10. [Theme System](#10-theme-system)
11. [Type System](#11-type-system)
12. [File Naming Conventions](#12-file-naming-conventions)
13. [Dependency Map](#13-dependency-map)

---

## 1. Guiding Principles

Every architectural decision follows these rules, derived from the product requirements:

| Principle             | What it means in practice                                                     |
|-----------------------|------------------------------------------------------------------------------|
| **Local-first**       | Every read comes from cache. Network updates are additive, never blocking.   |
| **Domain isolation**  | Each feature area (auth, expenses, budgets, analytics) owns its own slice of state, services, and types. No cross-domain state mutation. |
| **Unidirectional data flow** | UI reads from store. Store is updated by services. Services call the API. No component writes directly to the API. |
| **One concern per file** | A component renders. A hook composes logic. A service talks to the network. A store holds state. These never double up. |
| **Type safety end-to-end** | Every API response, store shape, navigation param, and component prop is typed. No `any`. |
| **Testability by design** | Business logic lives in hooks and services, not inside components. Every function that makes a decision is importable and testable in isolation. |

---

## 2. Technology Decisions

| Library                  | Role                                               | Why this choice                                                                 |
|--------------------------|----------------------------------------------------|---------------------------------------------------------------------------------|
| **Expo (SDK 51+)**       | Build toolchain, device APIs                       | Managed workflow for camera, notifications, secure storage, OTA updates — no native build config per feature |
| **TypeScript**           | Language                                           | Enforces correctness across store ↔ service ↔ component boundaries             |
| **React Navigation v6**  | In-app routing                                     | De facto standard; supports nested stacks, typed params, deep links             |
| **Zustand**              | Client state (auth, UI, sync queue, derived totals)| Minimal boilerplate; store is a plain JS object; no Provider wrapping required  |
| **React Query (TanStack)**| Server state (fetching, caching, refetching)       | Handles stale-while-revalidate, background refresh, optimistic mutations, and retry — maps directly to NFR-R02/SM-02 |
| **Axios**                | HTTP client                                        | Interceptor chain for token injection, refresh, and error normalization          |
| **React Native Reanimated v3** | Animations                                  | Runs on UI thread; needed for 60fps chart draw-on, tab transitions, skeleton pulses |
| **React Native SVG**     | Charts and icons                                   | Required by all charting; vector icons scale across device densities            |
| **Expo SecureStore**     | Token persistence                                  | Backed by Keychain (iOS) / Keystore (Android) — satisfies NFR-S02               |
| **MMKV (via expo-community)** | Non-sensitive fast storage (theme, filters)   | Synchronous reads; no async overhead for theme on launch                        |
| **Expo Notifications**   | Push notifications                                 | Handles permission flow, token registration, and foreground display             |
| **Expo Image Picker**    | Receipt photo attachment (F-27)                    | Unified camera/library API across platforms                                     |

---

## 3. Full Folder Structure

```
networthy/
│
├── app.json                          # Expo app configuration
├── App.tsx                           # Root component — providers only, no logic
├── babel.config.js
├── tsconfig.json
├── .env.example                      # Environment variable template
├── DESIGN_SPEC.md
├── PRODUCT_REQUIREMENTS.md
├── ARCHITECTURE.md
│
└── src/
    │
    ├── assets/
    │   ├── fonts/
    │   │   └── PlusJakartaSans/
    │   │       ├── PlusJakartaSans-Regular.ttf
    │   │       ├── PlusJakartaSans-Medium.ttf
    │   │       ├── PlusJakartaSans-SemiBold.ttf
    │   │       └── PlusJakartaSans-Bold.ttf
    │   ├── images/
    │   │   ├── logo.png
    │   │   ├── logo@2x.png
    │   │   ├── logo@3x.png
    │   │   └── splash.png
    │   ├── illustrations/
    │   │   ├── empty-transactions.svg
    │   │   ├── empty-budgets.svg
    │   │   └── empty-analytics.svg
    │   └── animations/
    │       └── sync-spinner.json     # Lottie (optional)
    │
    ├── components/
    │   ├── index.ts                  # Barrel export for all components
    │   │
    │   ├── common/
    │   │   ├── Button/
    │   │   │   ├── Button.tsx
    │   │   │   ├── Button.types.ts
    │   │   │   └── index.ts
    │   │   ├── IconButton/
    │   │   │   ├── IconButton.tsx
    │   │   │   └── index.ts
    │   │   ├── FAB/
    │   │   │   ├── FAB.tsx
    │   │   │   └── index.ts
    │   │   ├── PillToggle/
    │   │   │   ├── PillToggle.tsx
    │   │   │   ├── PillToggle.types.ts
    │   │   │   └── index.ts
    │   │   ├── Badge/
    │   │   │   ├── Badge.tsx
    │   │   │   └── index.ts
    │   │   ├── Avatar/
    │   │   │   ├── Avatar.tsx
    │   │   │   └── index.ts
    │   │   └── Divider/
    │   │       ├── Divider.tsx
    │   │       └── index.ts
    │   │
    │   ├── inputs/
    │   │   ├── TextInput/
    │   │   │   ├── TextInput.tsx
    │   │   │   ├── TextInput.types.ts
    │   │   │   └── index.ts
    │   │   ├── PasswordInput/
    │   │   │   ├── PasswordInput.tsx
    │   │   │   └── index.ts
    │   │   ├── AmountInput/
    │   │   │   ├── AmountInput.tsx        # Calculator-style large display input
    │   │   │   ├── AmountInput.types.ts
    │   │   │   └── index.ts
    │   │   ├── DatePickerInput/
    │   │   │   ├── DatePickerInput.tsx
    │   │   │   └── index.ts
    │   │   ├── CategoryPickerGrid/
    │   │   │   ├── CategoryPickerGrid.tsx
    │   │   │   ├── CategoryPickerGrid.types.ts
    │   │   │   └── index.ts
    │   │   ├── DropdownSelector/
    │   │   │   ├── DropdownSelector.tsx
    │   │   │   ├── DropdownSelector.types.ts
    │   │   │   └── index.ts
    │   │   └── SearchInput/
    │   │       ├── SearchInput.tsx
    │   │       └── index.ts
    │   │
    │   ├── cards/
    │   │   ├── BalanceHeroCard/
    │   │   │   ├── BalanceHeroCard.tsx
    │   │   │   ├── BalanceHeroCard.types.ts
    │   │   │   └── index.ts
    │   │   ├── AccountCard/
    │   │   │   ├── AccountCard.tsx
    │   │   │   ├── AccountCard.types.ts
    │   │   │   └── index.ts
    │   │   ├── StatChip/
    │   │   │   ├── StatChip.tsx           # Income / Expense summary chip pair
    │   │   │   ├── StatChip.types.ts
    │   │   │   └── index.ts
    │   │   ├── BudgetCategoryCard/
    │   │   │   ├── BudgetCategoryCard.tsx
    │   │   │   ├── BudgetCategoryCard.types.ts
    │   │   │   └── index.ts
    │   │   └── AnalyticsChartCard/
    │   │       ├── AnalyticsChartCard.tsx
    │   │       └── index.ts
    │   │
    │   ├── lists/
    │   │   ├── TransactionItem/
    │   │   │   ├── TransactionItem.tsx
    │   │   │   ├── TransactionItem.types.ts
    │   │   │   └── index.ts
    │   │   ├── TransactionList/
    │   │   │   ├── TransactionList.tsx    # FlatList wrapper with date grouping
    │   │   │   ├── TransactionList.types.ts
    │   │   │   └── index.ts
    │   │   ├── DateGroupHeader/
    │   │   │   ├── DateGroupHeader.tsx
    │   │   │   └── index.ts
    │   │   ├── FilterChipRow/
    │   │   │   ├── FilterChipRow.tsx
    │   │   │   ├── FilterChipRow.types.ts
    │   │   │   └── index.ts
    │   │   └── SectionHeaderRow/
    │   │       ├── SectionHeaderRow.tsx
    │   │       └── index.ts
    │   │
    │   ├── charts/
    │   │   ├── BarChart/
    │   │   │   ├── BarChart.tsx
    │   │   │   ├── BarChart.types.ts
    │   │   │   └── index.ts
    │   │   ├── LineChart/
    │   │   │   ├── LineChart.tsx
    │   │   │   ├── LineChart.types.ts
    │   │   │   └── index.ts
    │   │   ├── DonutChart/
    │   │   │   ├── DonutChart.tsx
    │   │   │   ├── DonutChart.types.ts
    │   │   │   └── index.ts
    │   │   ├── BudgetProgressBar/
    │   │   │   ├── BudgetProgressBar.tsx
    │   │   │   ├── BudgetProgressBar.types.ts
    │   │   │   └── index.ts
    │   │   └── ChartTooltip/
    │   │       ├── ChartTooltip.tsx
    │   │       └── index.ts
    │   │
    │   ├── feedback/
    │   │   ├── EmptyState/
    │   │   │   ├── EmptyState.tsx
    │   │   │   ├── EmptyState.types.ts
    │   │   │   └── index.ts
    │   │   ├── SkeletonLoader/
    │   │   │   ├── SkeletonLoader.tsx     # Animated placeholder via Reanimated
    │   │   │   ├── SkeletonCard.tsx
    │   │   │   ├── SkeletonList.tsx
    │   │   │   └── index.ts
    │   │   ├── Toast/
    │   │   │   ├── Toast.tsx
    │   │   │   ├── ToastProvider.tsx
    │   │   │   └── index.ts
    │   │   ├── ErrorBoundary/
    │   │   │   ├── ErrorBoundary.tsx
    │   │   │   └── index.ts
    │   │   └── SyncStatusIndicator/
    │   │       ├── SyncStatusIndicator.tsx
    │   │       └── index.ts
    │   │
    │   ├── layout/
    │   │   ├── ScreenWrapper/
    │   │   │   ├── ScreenWrapper.tsx      # SafeAreaView + scroll + padding
    │   │   │   └── index.ts
    │   │   ├── BottomSheetModal/
    │   │   │   ├── BottomSheetModal.tsx
    │   │   │   ├── BottomSheetModal.types.ts
    │   │   │   └── index.ts
    │   │   ├── KeyboardAvoidingWrapper/
    │   │   │   ├── KeyboardAvoidingWrapper.tsx
    │   │   │   └── index.ts
    │   │   └── Header/
    │   │       ├── Header.tsx
    │   │       ├── Header.types.ts
    │   │       └── index.ts
    │   │
    │   └── auth/
    │       ├── SocialAuthButton/
    │       │   ├── SocialAuthButton.tsx   # Google / Apple button with brand assets
    │       │   ├── SocialAuthButton.types.ts
    │       │   └── index.ts
    │       └── AuthDivider/
    │           ├── AuthDivider.tsx        # "— or continue with —" divider
    │           └── index.ts
    │
    ├── navigation/
    │   ├── index.ts                       # Exports RootNavigator
    │   ├── RootNavigator.tsx              # Switches between Auth and App stacks
    │   ├── AuthNavigator.tsx              # Unauthenticated screens stack
    │   ├── AppNavigator.tsx               # Bottom tab navigator (authenticated)
    │   ├── HomeNavigator.tsx              # Stack: Dashboard → AccountDetail → TransactionDetail
    │   ├── BudgetNavigator.tsx            # Stack: BudgetOverview → (modals)
    │   ├── ExpensesNavigator.tsx          # Stack: ExpenseList → ExpenseDetail
    │   ├── AnalyticsNavigator.tsx         # Stack: AnalyticsOverview → CategoryDetail
    │   ├── ProfileNavigator.tsx           # Stack: Profile → EditProfile → ManageAccounts → etc.
    │   ├── linking.ts                     # Deep link URL configuration
    │   └── types.ts                       # All NavigationParamList types per navigator
    │
    ├── screens/
    │   ├── auth/
    │   │   ├── SplashScreen.tsx
    │   │   ├── SignInScreen.tsx
    │   │   ├── SignUpScreen.tsx
    │   │   └── ForgotPasswordScreen.tsx
    │   │
    │   ├── dashboard/
    │   │   ├── DashboardScreen.tsx
    │   │   ├── AccountDetailScreen.tsx
    │   │   └── TransactionDetailScreen.tsx
    │   │
    │   ├── budget/
    │   │   ├── BudgetOverviewScreen.tsx
    │   │   ├── AddBudgetScreen.tsx        # Presented as modal
    │   │   └── EditBudgetScreen.tsx       # Presented as modal
    │   │
    │   ├── expenses/
    │   │   ├── ExpenseListScreen.tsx
    │   │   ├── AddExpenseScreen.tsx       # Presented as modal
    │   │   └── ExpenseDetailScreen.tsx
    │   │
    │   ├── analytics/
    │   │   ├── AnalyticsOverviewScreen.tsx
    │   │   └── CategoryDetailScreen.tsx
    │   │
    │   └── profile/
    │       ├── ProfileScreen.tsx
    │       ├── EditProfileScreen.tsx
    │       ├── ChangePasswordScreen.tsx
    │       ├── ManageAccountsScreen.tsx
    │       └── NotificationSettingsScreen.tsx
    │
    ├── store/
    │   ├── index.ts                       # Re-exports all stores
    │   ├── auth.store.ts                  # currentUser, tokens, isAuthenticated
    │   ├── accounts.store.ts              # linked accounts, total balance
    │   ├── expenses.store.ts              # active filters, search query, sync queue
    │   ├── budgets.store.ts               # selected month, budget list cache
    │   ├── analytics.store.ts             # selected period, chart data cache
    │   ├── ui.store.ts                    # theme, toast queue, keyboard state
    │   └── sync.store.ts                  # offline queue, sync status, last sync
    │
    ├── hooks/
    │   ├── index.ts
    │   │
    │   ├── auth/
    │   │   ├── useAuth.ts                 # Sign in, sign up, sign out, token refresh
    │   │   ├── useSession.ts              # Derived: isAuthenticated, currentUser
    │   │   └── useBiometric.ts            # Face ID / fingerprint re-auth
    │   │
    │   ├── expenses/
    │   │   ├── useExpenses.ts             # List with pagination, filters
    │   │   ├── useExpense.ts              # Single expense by id
    │   │   ├── useCreateExpense.ts        # Mutation: create with optimistic update
    │   │   ├── useUpdateExpense.ts        # Mutation: edit with optimistic update
    │   │   └── useDeleteExpense.ts        # Mutation: delete with optimistic update
    │   │
    │   ├── budgets/
    │   │   ├── useBudgets.ts              # Budget list for selected month
    │   │   ├── useBudgetSummary.ts        # Total budget vs. total spent (donut data)
    │   │   ├── useCreateBudget.ts
    │   │   ├── useUpdateBudget.ts
    │   │   └── useDeleteBudget.ts
    │   │
    │   ├── analytics/
    │   │   ├── useAnalyticsSummary.ts     # Total spending + delta for period
    │   │   ├── useBarChartData.ts         # Daily/weekly/monthly bar data
    │   │   ├── useLineChartData.ts        # Running balance trend data
    │   │   ├── useDonutChartData.ts       # Category breakdown percentages
    │   │   └── useCategoryDetail.ts       # Single-category transactions + chart
    │   │
    │   ├── accounts/
    │   │   ├── useAccounts.ts
    │   │   ├── useCreateAccount.ts
    │   │   ├── useUpdateAccount.ts
    │   │   └── useDeleteAccount.ts
    │   │
    │   ├── ui/
    │   │   ├── useTheme.ts                # Active theme tokens (resolves system pref)
    │   │   ├── useToast.ts                # Show/hide toast messages
    │   │   ├── useBottomSheet.ts          # Open/close bottom sheet ref
    │   │   └── useKeyboard.ts             # Keyboard height, isVisible
    │   │
    │   └── shared/
    │       ├── useDebounce.ts             # Debounce a value (search input)
    │       ├── useAppState.ts             # Foreground / background transitions
    │       ├── useNetworkStatus.ts        # Online / offline detection
    │       ├── useHaptics.ts              # Trigger haptic feedback
    │       └── useSyncQueue.ts            # Process and flush offline mutations
    │
    ├── services/
    │   ├── api/
    │   │   ├── client.ts                  # Axios instance, base URL, timeout
    │   │   ├── interceptors.ts            # Auth token injection, 401 refresh, error norm
    │   │   └── queryClient.ts             # React Query QueryClient configuration
    │   │
    │   ├── auth.service.ts                # register, login, logout, refresh, resetPassword
    │   ├── expenses.service.ts            # fetchExpenses, createExpense, updateExpense, deleteExpense, bulkCreate
    │   ├── budgets.service.ts             # fetchBudgets, createBudget, updateBudget, deleteBudget
    │   ├── analytics.service.ts           # fetchSummary, fetchByCategory, fetchByDate, fetchBalanceTrend
    │   ├── accounts.service.ts            # fetchAccounts, createAccount, updateAccount, deleteAccount
    │   ├── notifications.service.ts       # fetchNotifications, markRead, registerPushToken
    │   ├── storage.service.ts             # SecureStore (tokens) + MMKV (preferences) abstraction
    │   ├── sync.service.ts                # Offline queue persistence, replay, conflict resolution
    │   └── telemetry.service.ts           # Event tracking (§10 of PRD), opt-out aware
    │
    ├── constants/
    │   ├── index.ts
    │   ├── categories.ts                  # Category enum, labels, icon keys, colors
    │   ├── routes.ts                      # Route name string constants (avoids magic strings)
    │   ├── queryKeys.ts                   # React Query key factory functions
    │   ├── config.ts                      # API base URL, timeouts, feature flags
    │   └── limits.ts                      # Max accounts (10), max budgets (20), etc.
    │
    ├── theme/
    │   ├── index.ts                       # Exports useTheme hook and ThemeProvider
    │   ├── colors.ts                      # Dark + light token objects
    │   ├── typography.ts                  # Font size, weight, line height tokens
    │   ├── spacing.ts                     # 8dp grid spacing scale
    │   ├── shadows.ts                     # Elevation/shadow presets per surface level
    │   ├── borderRadius.ts                # Radius scale (4, 8, 12, 14, 16, 20, 24, 50%)
    │   └── tokens.ts                      # Assembled theme object (colors + typo + spacing)
    │
    ├── types/
    │   ├── index.ts
    │   ├── models.ts                      # User, Account, Transaction, Budget, Notification
    │   ├── api.ts                         # Request/response shapes for every endpoint
    │   ├── navigation.ts                  # RootStackParamList, TabParamList, all nested lists
    │   ├── store.ts                       # Zustand store shapes and action signatures
    │   ├── charts.ts                      # BarDatum, LineDatum, DonutSlice, etc.
    │   └── telemetry.ts                   # Event name union, event property shapes
    │
    └── utils/
        ├── index.ts
        ├── currency.ts                    # formatCurrency, parseCurrencyInput, centsToDollars
        ├── date.ts                        # formatDate, formatRelativeDate, getMonthRange, groupByDate
        ├── validation.ts                  # Email regex, password rules, amount range checks
        ├── category.ts                    # getCategoryColor, getCategoryIcon, getCategoryLabel
        ├── analytics.ts                   # aggregateByDate, computeRunningBalance, groupByCategory
        ├── sync.ts                        # buildSyncPayload, mergeSyncConflict, retryDelay
        └── accessibility.ts               # getAccessibleChartSummary, getA11yLabel
```

---

## 4. Folder-by-Folder Rationale

---

### `src/assets/`

**What it holds:** Every static file that ships inside the bundle — fonts, raster images, SVG illustrations, and Lottie JSON animation files.

**Why it exists:** Expo's Metro bundler resolves static assets at build time. All paths must be declared or importable as modules — you cannot construct asset paths dynamically at runtime. Centralizing assets here makes them discoverable, prevents duplication, and makes it straightforward to audit bundle size.

**Sub-folder decisions:**

| Subfolder        | Reason                                                                                   |
|------------------|------------------------------------------------------------------------------------------|
| `fonts/`         | Plus Jakarta Sans is loaded via `expo-font` at app boot. Declaring font files here lets `useFonts()` resolve them without absolute paths scattered across the app. |
| `images/`        | Logo and splash are referenced in `app.json` (Expo config) and in the Splash screen. `@2x`/`@3x` variants are auto-selected by React Native's asset resolution for device pixel ratios. |
| `illustrations/` | SVG illustrations for empty states (see DESIGN_SPEC §19). Kept separate from raster images so they can be swapped without affecting image optimization pipelines. |
| `animations/`    | Reserved for Lottie JSON (sync spinner). Isolated so the Lottie dependency is easy to remove if the animation is replaced with a Reanimated-native approach later. |

---

### `src/components/`

**What it holds:** Every reusable UI element that appears on more than one screen, organized by concern. No component in this folder fetches data, reads from a Zustand store, or calls a service directly — it only accepts props.

**Why it exists:** The DESIGN_SPEC defines 30+ distinct UI patterns (buttons, cards, charts, inputs, empty states, skeletons, bottom sheets). Screens would become unmaintainable if these were defined inline. Components in this folder are the single source of truth for how each pattern looks and behaves.

**Why components are prop-only (no store access):**
Keeping components pure makes them trivially testable (render with props, assert output), reusable in Storybook, and prevents hidden coupling between unrelated features. Store access is the job of hooks. Components display; hooks decide.

**Sub-folder decisions:**

| Subfolder     | Holds                                               | Reasoning from spec                                                                       |
|---------------|-----------------------------------------------------|-------------------------------------------------------------------------------------------|
| `common/`     | Button, FAB, PillToggle, Badge, Avatar, Divider, IconButton | DESIGN_SPEC §17–18: these appear across every feature area. No domain affinity.   |
| `inputs/`     | TextInput, PasswordInput, AmountInput, DatePickerInput, CategoryPickerGrid, DropdownSelector, SearchInput | DESIGN_SPEC §15: each input has its own interaction model and validation display. Grouping them lets designers and engineers locate every form control in one place. |
| `cards/`      | BalanceHeroCard, AccountCard, StatChip, BudgetCategoryCard, AnalyticsChartCard | DESIGN_SPEC §14: the five card variants have distinct layouts and data shapes. Each needs its own prop type. |
| `lists/`      | TransactionItem, TransactionList, DateGroupHeader, FilterChipRow, SectionHeaderRow | PRD US-EXP-02 and FR-E08: the transaction list is paginated, date-grouped, and filterable. Splitting the row, the group header, and the list controller into separate components makes each independently testable. |
| `charts/`     | BarChart, LineChart, DonutChart, BudgetProgressBar, ChartTooltip | DESIGN_SPEC §16: all charts use React Native SVG + Reanimated. Isolated here so chart logic (path calculation, axis scaling) does not leak into screen files. Each chart receives only pre-shaped `data` arrays — chart shaping is done in `utils/analytics.ts`. |
| `feedback/`   | EmptyState, SkeletonLoader, Toast, ErrorBoundary, SyncStatusIndicator | NFR-R01, SM-08/SM-09: every loading, error, empty, and sync state has a designed treatment from the spec. Centralizing them ensures consistent behavior across all screens. |
| `layout/`     | ScreenWrapper, BottomSheetModal, KeyboardAvoidingWrapper, Header | DESIGN_SPEC §4, §20: safe area, keyboard avoidance, and the bottom sheet modal pattern are used on nearly every screen. A single `ScreenWrapper` guarantees consistent insets everywhere. |
| `auth/`       | SocialAuthButton, AuthDivider                       | Auth-specific UI that only appears on Sign In / Sign Up. Isolated so auth screens stay clean and social button brand assets (Google/Apple logos) are not scattered. |

**File structure per component (`Button/` as example):**
- `Button.tsx` — the component itself
- `Button.types.ts` — prop interface, variant enum, size enum
- `index.ts` — `export { Button } from './Button'` (clean import path)

This pattern avoids the common anti-pattern of a monolithic `components/Button.tsx` file that grows to 400 lines of variants.

---

### `src/navigation/`

**What it holds:** Every React Navigation navigator, the deep link configuration, and the TypeScript param list definitions for every route.

**Why it exists:** Navigation is not a screen concern. Keeping navigators separate from screens means screens do not import each other, circular dependencies are impossible, and the entire routing topology is readable in one directory.

**Why one navigator file per domain:**
The PRD §7.1 defines a two-level navigation structure with five tab stacks. If all navigators lived in one file it would exceed 300 lines immediately. One file per domain (`HomeNavigator.tsx`, `BudgetNavigator.tsx`, etc.) means adding a new screen to Budget requires touching only `BudgetNavigator.tsx` and `navigation/types.ts`.

**`navigation/types.ts` — why it's critical:**
React Navigation's typed navigation requires every screen's params to be declared in a `ParamList`. Centralizing all param lists here means TypeScript catches incorrect `navigate('ScreenName', { wrongParam })` calls at compile time across the entire app. This directly addresses NFR-M01 (testability) by making navigation errors impossible to ship.

**`linking.ts`:** Handles deep links (password reset email, future shared expense views as per PRD FR-A08). Separate file because deep link configuration is verbose and unrelated to the navigator component structure.

---

### `src/screens/`

**What it holds:** One file per screen. Each screen composes components from `components/`, reads data through hooks from `hooks/`, and handles navigation events.

**Why it exists:** The boundary between "reusable UI" and "one specific page" must be enforced. Screens are the only place where:
- A full page layout is assembled from components
- Navigation params are consumed (`route.params`)
- Domain hooks are called to provide data
- User interactions trigger mutations

**Why screens do not contain business logic:**
A screen that formats currency, validates a form, or aggregates data is untestable without rendering a full navigation tree. Moving that logic to hooks makes it testable with a simple `renderHook()` call.

**Sub-folder decisions align with navigation domains** — one folder per tab. This mirrors the navigator structure exactly, making it impossible to confuse which navigator owns which screen.

---

### `src/store/`

**What it holds:** Zustand stores — one per state domain.

**Why Zustand and not Redux:**
The PRD's state requirements (SM-01 through SM-10) need cross-cutting state (auth, sync, UI theme) accessible without prop drilling and without the boilerplate of Redux slices, reducers, and selectors. Zustand stores are plain JavaScript objects with built-in subscriptions. Any hook or component can subscribe to a single field without re-rendering on unrelated changes (`useStore(s => s.theme)` — only re-renders when `theme` changes).

**Why one store per domain (not one global store):**
A single store for all state would mean an auth change triggers re-evaluation of budget subscription logic. Domain isolation is the explicit requirement from PRD §8.2. Each store owns exactly the state listed in its domain table and nothing else.

**Why Zustand handles client state while React Query handles server state:**
These are genuinely different problems:
- **React Query** manages: "fetch this from the API, cache it, refetch when stale, retry on error." It owns transaction lists, budget data, analytics aggregates.
- **Zustand** manages: "the user is authenticated," "the selected month is June," "there is an unread notification badge," "the sync queue has 3 pending items." These have no natural TTL and do not come from the API — they are app-level facts.

**Store files:**

| Store                | Owns                                                                 |
|----------------------|----------------------------------------------------------------------|
| `auth.store.ts`      | `currentUser`, `isAuthenticated`, access/refresh token in-memory refs, `authStatus: loading|authenticated|unauthenticated` |
| `accounts.store.ts`  | Local list of accounts (mirrors React Query cache), `totalBalance` derived value |
| `expenses.store.ts`  | Active `categoryFilter`, `searchQuery`, `sortOrder`, local optimistic update registry |
| `budgets.store.ts`   | `selectedMonth` (the month picker state), local budget list cache for instant navigation |
| `analytics.store.ts` | `selectedPeriod: weekly|monthly|yearly`, `drilledCategory`, pre-computed chart data slices |
| `ui.store.ts`        | `theme: dark|light|system`, `toastQueue: Toast[]`, `activeTab`, `isKeyboardVisible` |
| `sync.store.ts`      | `offlineQueue: SyncQueueItem[]`, `syncStatus: idle|syncing|error`, `lastSyncAt`, `failedItems` |

---

### `src/hooks/`

**What it holds:** Custom React hooks that compose Zustand store reads, React Query queries/mutations, and utility functions into a single API that screens consume.

**Why it exists:** This is the layer where all the complexity lives without it being visible to screens. A screen that calls `useExpenses()` gets back `{ data, isLoading, error }` without knowing whether that data came from cache, a network request, or an optimistic update. A screen that calls `useCreateExpense()` gets back a `mutate` function without knowing about optimistic update rollbacks, sync queue writes, or haptic feedback.

**Why hooks are organized by domain:**
Each domain's hooks form a complete public API for that domain's screens. `screens/expenses/` only imports from `hooks/expenses/`. This means the service layer implementation is completely hidden from screens — you could replace the API with a mock, local SQLite, or a different backend without touching a single screen file.

**Key hooks and their responsibilities:**

| Hook                    | What it abstracts                                                                 |
|-------------------------|-----------------------------------------------------------------------------------|
| `useAuth`               | Calls auth service, writes tokens to SecureStore, updates auth.store, triggers navigation |
| `useExpenses`           | React Query `useInfiniteQuery` with category filter and search from expenses.store |
| `useCreateExpense`      | `useMutation` with optimistic update + rollback, sync queue write on offline, haptic trigger |
| `useTheme`              | Reads `ui.store.theme`, resolves `system` to device preference, returns typed token object |
| `useDebounce`           | Delays search query update by 200ms so filter doesn't fire on every keypress (PRD US-EXP-04) |
| `useNetworkStatus`      | `NetInfo` subscription — drives sync queue flush on reconnect (SM-SY04)          |
| `useSyncQueue`          | Reads sync.store queue, replays items in FIFO order on network restore, handles retry/failure |
| `useBarChartData`       | Fetches analytics/by-date, transforms response through `utils/analytics.ts` into chart-ready datum array |

---

### `src/services/`

**What it holds:** Functions that communicate with external systems — the REST API, device secure storage, MMKV, the sync queue persistence layer, and the telemetry sink.

**Why it exists:** Services are the only layer that knows the network exists. If you need to change the API base URL, add a header, or swap the storage library, you touch one file. Hooks and stores never import Axios directly.

**`api/client.ts` — the Axios instance:**
Single instance with base URL from `constants/config.ts`, a 10-second timeout (matching PRD FR error handling appendix), and a request interceptor that injects the `Authorization: Bearer <token>` header from the in-memory auth store (not AsyncStorage — satisfies NFR-S02).

**`api/interceptors.ts` — why it deserves its own file:**
The 401 refresh flow is the most complex piece of auth infrastructure. When a 401 is received, the interceptor must: pause the failing request, request a new token pair, retry the original request with the new token, and queue any concurrent requests that arrived during the refresh. This logic is 60+ lines and must be isolated from the Axios client setup.

**`api/queryClient.ts` — React Query global config:**
Defines default `staleTime` (30 seconds for lists, 5 minutes for analytics), `retry` (3 attempts with exponential backoff), and `onError` global handler (writes to crash reporter). Centralizing this means all 20+ query hooks behave consistently without per-hook configuration.

**`sync.service.ts`:** Wraps MMKV to persist the offline queue across app restarts (SM-SY01). Responsible for: writing new queue items, reading the queue on launch, marking items resolved, and handling the retry cap (SM-SY03: max 3 attempts). This is the only service that writes to both local storage and triggers API calls — it must not be called directly from components.

**`telemetry.service.ts`:** Wraps the analytics SDK. Every call checks an opt-out flag from MMKV before firing (AN-T06). No financial amounts or PII are ever passed to this service — the type definitions in `types/telemetry.ts` structurally prevent it.

---

### `src/constants/`

**What it holds:** Values that are fixed at compile time and shared across multiple files, but are not theme tokens.

**Why it exists:** Magic strings and magic numbers are the leading cause of subtle bugs in large codebases. Defining route names, query keys, and API config in one place means a rename propagates everywhere via TypeScript's find-references, not via manual grep.

**Key files:**

| File              | Contains                                                                             | Why it matters                                                                      |
|-------------------|--------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| `categories.ts`   | `CATEGORIES` array with `{ key, label, icon, color }` for all 11 taxonomy entries   | Used by CategoryPickerGrid, TransactionItem icon, filter chips, chart colors, and budget form — all from one source of truth |
| `routes.ts`       | String constants for every screen name (e.g. `export const ROUTES = { SIGN_IN: 'SignIn' }`) | Prevents typos in `navigation.navigate()` calls; TypeScript + the param list in `navigation/types.ts` catches mismatches at compile time |
| `queryKeys.ts`    | Factory functions: `expenseKeys.list(filters)`, `budgetKeys.byMonth(month)`, etc.    | React Query cache invalidation requires exact key matching. Factories guarantee consistent keys across `useQuery` and `invalidateQueries` calls |
| `config.ts`       | `API_BASE_URL`, `REQUEST_TIMEOUT_MS`, `MAX_SYNC_RETRIES`, feature flags              | Loaded from `process.env` via Expo's `extra` config, not hard-coded                 |
| `limits.ts`       | `MAX_ACCOUNTS = 10`, `MAX_BUDGETS_PER_PERIOD = 20`, `MAX_EXPENSE_AMOUNT = 999999.99` | Shared between validation utils and API service error handling                      |

---

### `src/theme/`

**What it holds:** The complete design token system derived from DESIGN_SPEC §11–13 — colors, typography, spacing, shadows, and border radii — organized so they can be consumed as a typed object by every component.

**Why it exists:** DESIGN_SPEC defines 13 color tokens per mode, 10 typography tokens, 8 spacing tokens, and 5 border radius values. If these were duplicated inside component `StyleSheet.create()` calls, a single brand color change would require touching 50+ files. The theme system makes global appearance changes a one-file edit.

**Why not `StyleSheet.create()` at the top level:**
`StyleSheet.create()` is a React Native optimization for flattening style objects. It doesn't support runtime theming (dark/light switch). Tokens are plain JavaScript objects; components apply them in their local `StyleSheet.create()` calls, which runs at component render time and respects the active theme.

**`tokens.ts` — the assembled theme object:**
Imports from all other theme files and exports two objects: `darkTheme` and `lightTheme`, both conforming to the `Theme` type defined in `types/models.ts`. `useTheme()` in `hooks/ui/useTheme.ts` returns the correct one based on the user's preference and system setting.

**Why shadows are their own file:**
Shadows differ significantly between iOS (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`) and Android (`elevation`). The `shadows.ts` file abstracts this into named presets (`shadows.card`, `shadows.modal`, `shadows.fab`) that return the correct platform-appropriate style object.

---

### `src/types/`

**What it holds:** All TypeScript interfaces and type aliases for the app's domain models, API contracts, navigation params, store shapes, chart data formats, and telemetry events.

**Why it exists and why it's centralized:**
Types are the contract between every layer of the architecture. When the API changes a field name, TypeScript will flag every affected callsite — but only if the type is defined once and imported everywhere. If types are re-declared inline in each file, TypeScript can only catch errors within that file.

**Key files:**

| File            | Contains                                                                                  |
|-----------------|-------------------------------------------------------------------------------------------|
| `models.ts`     | `User`, `Account`, `Transaction`, `Budget`, `Notification`, `SyncQueueItem` — mirrors §9 of PRD exactly |
| `api.ts`        | `LoginRequest`, `LoginResponse`, `CreateExpenseRequest`, `ExpensesListResponse`, pagination wrapper `PaginatedResponse<T>` — one type per endpoint |
| `navigation.ts` | `RootStackParamList`, `AuthStackParamList`, `AppTabParamList`, `HomeStackParamList`, etc. — enables typed `useNavigation<>()` hooks |
| `store.ts`      | Interface for each Zustand store's state + actions: `AuthStore`, `UIStore`, `SyncStore`, etc. |
| `charts.ts`     | `BarDatum { date: string; value: number }`, `LineDatum`, `DonutSlice { category; value; percent; color }` |
| `telemetry.ts`  | `TelemetryEventName` union type, per-event property shapes — structurally prevents PII/amount inclusion |

---

### `src/utils/`

**What it holds:** Pure functions with no side effects and no framework dependencies. They take inputs and return outputs. No store reads, no API calls, no hooks.

**Why it exists:** Formatting a currency string, grouping transactions by date, or computing a running balance are operations needed in multiple hooks, components, and services. They belong nowhere specific — they're utilities. Making them pure functions means they can be tested with zero setup.

**Key files:**

| File                | Functions                                                                              | Used by                                  |
|---------------------|----------------------------------------------------------------------------------------|------------------------------------------|
| `currency.ts`       | `formatCurrency(amount, currency)`, `parseCurrencyInput(string) → number`, `centsToDollars` | AmountInput, TransactionItem, BalanceHeroCard, StatChip |
| `date.ts`           | `formatDate(iso, format)`, `formatRelativeDate(iso) → "Today"|"Yesterday"|"Jun 8"`, `getMonthRange(month) → { startDate, endDate }`, `groupByDate(transactions[])` | TransactionList, DateGroupHeader, BudgetOverview, budget.service |
| `validation.ts`     | `isValidEmail(s)`, `isValidPassword(s)`, `isValidAmount(n)`, returns `{ valid, error }` | All form hooks (useAuth, useCreateExpense) |
| `category.ts`       | `getCategoryColor(key)`, `getCategoryIcon(key)`, `getCategoryLabel(key)` — reads from `constants/categories.ts` | CategoryIconCircle, FilterChipRow, DonutChart, BudgetCategoryCard |
| `analytics.ts`      | `aggregateByDate(transactions[], period)`, `computeRunningBalance(transactions[])`, `groupByCategory(transactions[])`, `computeDelta(current, prior)` | useBarChartData, useLineChartData, useDonutChartData |
| `sync.ts`           | `buildSyncPayload(operation, entity)`, `retryDelay(attempt) → ms` (exponential backoff) | sync.service, useSyncQueue |
| `accessibility.ts`  | `getAccessibleChartSummary(data[], chartType)` → readable string for VoiceOver | BarChart, DonutChart, LineChart |

---

## 5. Data Flow Architecture

### Read Path (displaying data on screen)

```
Screen
  │  calls
  ▼
Hook (e.g. useExpenses)
  │  subscribes to
  ├─► React Query cache  ────────────────► API (background refresh)
  │     └── returns cached data instantly
  │
  └─► Zustand store (active filters, search query)
        └── returns filter state
              │
              ▼
          Hook combines both → returns { data, isLoading, error }
                │
                ▼
            Screen passes data as props to Components
```

### Write Path (creating or editing data)

```
Component (Button tap)
  │  calls mutate() from
  ▼
Hook (e.g. useCreateExpense)
  │
  ├─ 1. Apply optimistic update to React Query cache immediately
  │       → UI updates in <16ms (user sees change instantly)
  │
  ├─ 2. Call expenses.service.createExpense(payload)
  │       │
  │       ├─ Online: POST /transactions → success → React Query confirms cache
  │       │                             → failure → rollback optimistic update
  │       │                                          → show toast error
  │       │
  │       └─ Offline: write to sync.store queue
  │                   → UI still shows optimistic update
  │                   → sync flushes when network returns
  │
  ├─ 3. Trigger haptic feedback (useHaptics)
  │
  └─ 4. Fire telemetry event (telemetry.service, non-blocking)
```

### Theme Resolution Path

```
Device OS setting (dark/light)
        │
        ▼
ui.store.ts (theme: 'dark' | 'light' | 'system')
        │
        ▼
useTheme() hook  ─── resolves 'system' via Appearance API
        │
        ▼
Returns typed theme object { colors, typography, spacing, ... }
        │
        ▼
Component reads tokens: colors.bg.surface, spacing[4], etc.
```

---

## 6. State Domains and Ownership

The table below shows which layer owns each piece of state and why. "Owns" means it is the single writer. All other layers read.

| State                        | Owner (Writer)        | Readers                                       | Rationale                                                      |
|------------------------------|-----------------------|-----------------------------------------------|----------------------------------------------------------------|
| Access + refresh tokens      | `auth.store`          | `api/interceptors.ts`                         | In-memory only; persisted copy in SecureStore via storage.service at write time |
| `isAuthenticated`            | `auth.store`          | `RootNavigator`, all screens                  | Derived from token presence + expiry                           |
| Transaction list             | React Query cache     | `useExpenses`, `useExpense`                   | Server state with TTL; React Query is the authority            |
| Active category filter       | `expenses.store`      | `useExpenses`, `FilterChipRow`                | UI-level filter, no API round-trip needed to switch             |
| Search query                 | `expenses.store`      | `useExpenses`, `SearchInput`                  | Debounced in hook before passing to query key                  |
| Selected budget month        | `budgets.store`       | `useBudgets`, month picker component          | Persists while user navigates between tab stacks               |
| Budget list                  | React Query cache     | `useBudgets`, `useBudgetSummary`              | Server state; invalidated when a budget is mutated             |
| Analytics selected period    | `analytics.store`     | `useBarChartData`, `useDonutChartData`, toggle | Persists within Analytics tab session                         |
| Chart data                   | React Query cache     | all analytics hooks                           | Expensive computation; cache for 5 minutes (staleTime)         |
| Theme preference              | `ui.store` + MMKV    | `useTheme`, all components                    | Persisted so it's available synchronously before first render  |
| Toast queue                  | `ui.store`            | `ToastProvider`, `useToast`                   | Global; any hook can enqueue a toast                           |
| Sync queue                   | `sync.store` + MMKV  | `useSyncQueue`, `sync.service`                | Must survive app kill; MMKV is synchronous for reliable write  |
| Sync status                  | `sync.store`          | `SyncStatusIndicator`                         | Display only; derived from queue length + network status       |

---

## 7. Navigation Architecture

### Navigator Hierarchy

```
RootNavigator (Stack)
  │
  ├── [unauthenticated] AuthNavigator (Stack)
  │     ├── SplashScreen
  │     ├── SignInScreen
  │     ├── SignUpScreen
  │     └── ForgotPasswordScreen
  │
  └── [authenticated] AppNavigator (Bottom Tabs)
        │
        ├── Tab: Home → HomeNavigator (Stack)
        │     ├── DashboardScreen             (root)
        │     ├── AccountDetailScreen
        │     └── TransactionDetailScreen
        │
        ├── Tab: Budget → BudgetNavigator (Stack)
        │     ├── BudgetOverviewScreen         (root)
        │     ├── AddBudgetScreen              (modal presentation)
        │     └── EditBudgetScreen             (modal presentation)
        │
        ├── Tab: Expenses → ExpensesNavigator (Stack)
        │     ├── ExpenseListScreen            (root)
        │     ├── AddExpenseScreen             (modal presentation)
        │     └── ExpenseDetailScreen
        │
        ├── Tab: Analytics → AnalyticsNavigator (Stack)
        │     ├── AnalyticsOverviewScreen      (root)
        │     └── CategoryDetailScreen
        │
        └── Tab: Profile → ProfileNavigator (Stack)
              ├── ProfileScreen                (root)
              ├── EditProfileScreen
              ├── ChangePasswordScreen
              ├── ManageAccountsScreen
              └── NotificationSettingsScreen
```

### Navigation Type Safety

Every navigator has a corresponding `ParamList` in `navigation/types.ts`:

```
RootStackParamList        — switches between Auth and App
AuthStackParamList        — Splash, SignIn, SignUp, ForgotPassword
AppTabParamList           — 5 tab names only (no params on tabs)
HomeStackParamList        — Dashboard, AccountDetail (accountId), TransactionDetail (transactionId)
BudgetStackParamList      — BudgetOverview, AddBudget, EditBudget (budgetId)
ExpensesStackParamList    — ExpenseList, AddExpense, ExpenseDetail (expenseId)
AnalyticsStackParamList   — AnalyticsOverview, CategoryDetail (category, period)
ProfileStackParamList     — Profile, EditProfile, ChangePassword, ManageAccounts, NotificationSettings
```

---

## 8. API and Service Layer

### Request Lifecycle

```
Hook calls service function
    │
    ▼
service function calls axios client
    │
    ▼
Request interceptor runs:
  → Reads token from auth.store (in-memory, no async)
  → Adds Authorization header
    │
    ▼
Response interceptor runs:
  → 200–299: return response.data
  → 401: pause request, call /auth/refresh, retry with new token
           if refresh fails → dispatch sign-out → redirect to Sign In
  → 400: extract error message, throw typed ApiError
  → 500: log to crash reporter, throw generic ApiError
    │
    ▼
React Query receives resolved data or caught error
  → success: updates cache, triggers UI re-render
  → error: sets error state, triggers retry (up to 3x)
```

### Service Function Signature Pattern

Every service function follows this contract:
- Takes a strongly-typed request payload (from `types/api.ts`)
- Returns a `Promise` of the strongly-typed response (from `types/api.ts`)
- Never catches errors — throws to React Query's error handling
- Never reads from or writes to any store — that is the hook's responsibility

---

## 9. Offline-First Strategy

Derived from PRD requirements SM-SY01 through SM-SY05 and FR-E11.

### Offline Write Flow

```
User creates expense while offline
    │
    ▼
useCreateExpense mutation fires
    │
    ├── 1. Assign localId (UUID v4, client-generated)
    ├── 2. Apply optimistic update to React Query expense cache
    ├── 3. Write to sync.store.offlineQueue with operation=create
    ├── 4. MMKV persists queue (survives app kill)
    └── 5. Return success to UI (user sees item in list)

Later — network restored:
    │
    ▼
useNetworkStatus fires 'connected' event
    │
    ▼
useSyncQueue.flush() iterates queue FIFO:
    │
    ├── POST /transactions/bulk with all queued creates
    │     → Server returns canonical IDs
    │     → React Query cache updates: localId → serverId
    │     → Queue item marked resolved
    │
    ├── PATCH /transactions/:id for each queued update
    │
    └── DELETE /transactions/:id for each queued delete

On conflict (record edited on two devices):
    → Server timestamp wins (SM-SY02)
    → Local optimistic version replaced silently
    → No user notification (Appendix B of PRD)
```

### What is stored locally

| Data                   | Storage         | TTL                          |
|------------------------|-----------------|------------------------------|
| Auth tokens            | Expo SecureStore | Until sign-out or expiry    |
| Theme preference       | MMKV            | Indefinite                   |
| Active filters         | Zustand memory  | Session only                 |
| Sync queue             | MMKV            | Until processed              |
| Transaction list cache | React Query memory | 30s stale, 5m garbage collect |
| Analytics chart data   | React Query memory | 5m stale                    |

---

## 10. Theme System

### Token Access Pattern

Components never use raw color values. They always read from the theme object returned by `useTheme()`:

```
theme.colors.bg.base          → page background
theme.colors.bg.surface       → card backgrounds
theme.colors.accent.primary   → buttons, active states
theme.colors.text.primary     → main text
theme.colors.income           → green amounts
theme.colors.expense          → red amounts
theme.typography.displayXl    → { fontSize: 36, fontWeight: '700', lineHeight: 44 }
theme.spacing[4]              → 16
theme.borderRadius.card       → 20
theme.shadows.card            → platform-appropriate shadow style object
```

### Theme Change Flow

```
User taps "Dark" in Settings
    │
    ▼
ui.store.setTheme('dark')
    │
    ├── Persists to MMKV (next launch reads this before first render)
    │
    └── All useTheme() subscribers re-render with darkTheme tokens
          (Zustand subscription is field-level — only components
           that call useTheme() re-render, not the whole tree)
```

---

## 11. Type System

### Type Import Rules

| Layer          | May import types from           | May NOT import types from          |
|----------------|---------------------------------|------------------------------------|
| Components     | `types/models`, `types/charts`, `types/navigation` | `types/api`, `types/store` |
| Hooks          | `types/models`, `types/api`, `types/store`, `types/charts` | `types/navigation` (use `useNavigation<>()` generic instead) |
| Services       | `types/api`, `types/models`     | `types/store`, `types/navigation`, `types/charts` |
| Stores         | `types/store`, `types/models`   | `types/api`, `types/navigation`, `types/charts` |
| Utils          | `types/models`, `types/charts`  | Everything else (utils are framework-free) |
| Navigation     | `types/navigation`, `types/models` | `types/store`, `types/api`      |

This prevents the type system from creating hidden coupling between layers.

---

## 12. File Naming Conventions

| File type                | Convention               | Example                                |
|--------------------------|--------------------------|----------------------------------------|
| React component          | PascalCase + `.tsx`      | `BalanceHeroCard.tsx`                  |
| Component prop types     | PascalCase + `.types.ts` | `BalanceHeroCard.types.ts`             |
| Barrel export            | `index.ts`               | `components/cards/BalanceHeroCard/index.ts` |
| Zustand store            | camelCase + `.store.ts`  | `auth.store.ts`                        |
| Custom hook              | `use` prefix + camelCase | `useCreateExpense.ts`                  |
| Service                  | camelCase + `.service.ts`| `expenses.service.ts`                  |
| Utility                  | camelCase + `.ts`        | `currency.ts`                          |
| Constants                | camelCase + `.ts`        | `queryKeys.ts`                         |
| Navigator                | PascalCase + `Navigator.tsx` | `HomeNavigator.tsx`               |
| Screen                   | PascalCase + `Screen.tsx`| `ExpenseListScreen.tsx`                |
| Type file                | camelCase + `.ts`        | `models.ts`                            |
| Environment variable     | `EXPO_PUBLIC_` prefix    | `EXPO_PUBLIC_API_BASE_URL`             |

### Import Order (enforced by ESLint)

1. React / React Native
2. Third-party libraries (Expo, React Navigation, Zustand, React Query)
3. Internal absolute imports (`@/components`, `@/hooks`, etc.)
4. Relative imports (`./Button`, `../shared`)
5. Type-only imports (`import type { ... }`)

---

## 13. Dependency Map

How layers depend on each other (arrows = "imports from"):

```
Screens
  └──► Hooks
         ├──► Zustand Stores
         ├──► React Query (via Services)
         │         └──► Services
         │                 ├──► api/client.ts
         │                 └──► api/interceptors.ts
         ├──► Constants
         └──► Utils

Components
  └──► Theme (useTheme)
  └──► Types (prop interfaces)
  └──► Constants (categories, limits)
  └──► Utils (formatCurrency, etc.)

Navigation
  └──► Types (param lists)
  └──► Screens
  └──► Stores (auth.store for RootNavigator gate)

Stores
  └──► Types (store interface shapes)
  └──► Services (storage.service for persistence on write)

Utils
  └──► Constants (categories, config)
  └──► Types (model shapes)
  └──► [nothing else — framework-free]
```

**No circular dependencies.** The rule: layers only import from layers below them in the dependency graph. Utils import nothing internal. Services import utils and constants. Hooks import services and stores. Screens import hooks and components. Navigation imports screens. Nothing imports navigation except `App.tsx`.

---

*End of ARCHITECTURE.md*
