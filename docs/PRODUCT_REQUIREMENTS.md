# PRODUCT_REQUIREMENTS.md — Financial Tracker App
> Version 1.0 | Status: Draft | Platform: iOS & Android (React Native)
> Companion document to DESIGN_SPEC.md

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [User Personas](#2-user-personas)
3. [Core Features](#3-core-features)
4. [User Stories](#4-user-stories)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Navigation Requirements](#7-navigation-requirements)
8. [State Management Requirements](#8-state-management-requirements)
9. [Data Model Requirements](#9-data-model-requirements)
10. [Analytics Requirements](#10-analytics-requirements)

---

## 1. Product Vision

### 1.1 Vision Statement

To be the most intuitive personal finance companion for individuals who want clarity over their money — not complexity. Every feature must earn its place by answering a single question the user actually has, and every screen must answer it faster than they expected.

### 1.2 Mission

Empower individuals to understand where their money goes, set meaningful spending boundaries, and build better financial habits — all within thirty seconds of opening the app.

### 1.3 Problem Statement

Most people do not track their spending because the tools that exist either require manual effort that feels like a second job, or present so much data that the signal is buried in noise. The result is that people consistently overspend in a small number of categories while remaining unaware until it is too late to course-correct within a billing period.

### 1.4 Solution

A mobile-first, visually clear finance tracker that makes logging an expense as fast as unlocking a phone, surfaces budget status at a glance without navigation, and converts raw transaction data into actionable spending patterns through approachable charts and ranked summaries.

### 1.5 Success Metrics (North Star)

| Metric                              | Target (6 months post-launch) |
|-------------------------------------|-------------------------------|
| Day-7 retention                     | ≥ 40%                         |
| Day-30 retention                    | ≥ 25%                         |
| Median expenses logged per user/week| ≥ 5                           |
| Budgets created per active user     | ≥ 3                           |
| App Store rating                    | ≥ 4.6 / 5.0                   |
| Crash-free sessions                 | ≥ 99.5%                       |
| P95 screen load time                | ≤ 1.5 seconds                 |

### 1.6 Scope Boundaries

**In scope for v1.0:**
- Manual expense logging
- Manual account balance entry
- Budget creation and tracking by category
- Spending analytics (weekly / monthly / yearly)
- Dark mode and light mode
- Email authentication + Google / Apple Sign-In
- Local-first data with cloud sync

**Out of scope for v1.0 (future roadmap):**
- Open Banking / Plaid bank account linking
- Bill detection from SMS or email parsing
- Recurring transaction automation
- Multi-currency support
- Shared / household budgets
- Investment portfolio tracking
- Tax reporting exports

---

## 2. User Personas

### Persona A — "The Budget-Conscious Millennial"

| Attribute     | Detail                                                                 |
|---------------|------------------------------------------------------------------------|
| Name          | Maya, 28                                                               |
| Occupation    | Marketing coordinator                                                  |
| Income        | $52,000/year, paid bi-weekly                                          |
| Tech comfort  | High — daily smartphone user, comfortable with apps                   |
| Financial maturity | Aware she overspends but unsure where exactly                   |
| Pain points   | Checks bank statement after the damage is done; hates spreadsheets    |
| Goals         | Stay within a monthly food budget; save $200/month                    |
| Key behavior  | Logs expenses impulsively in the moment; forgets to do it later       |
| Quote         | "I know I spend too much on eating out — I just don't know how much." |

**What this persona needs from the app:**
- Add expense in under 10 seconds
- Visual budget remaining at a glance without navigating
- A monthly summary that doesn't require interpretation

---

### Persona B — "The Deliberate Saver"

| Attribute     | Detail                                                                 |
|---------------|------------------------------------------------------------------------|
| Name          | Daniel, 34                                                             |
| Occupation    | Software engineer                                                      |
| Income        | $110,000/year                                                          |
| Tech comfort  | Very high — uses multiple productivity apps                           |
| Financial maturity | Tracks net worth monthly, reads personal finance content         |
| Pain points   | Existing apps are either too simple or too complex with bank sync     |
| Goals         | Optimize spending by category; identify trends over 3–6 months       |
| Key behavior  | Logs weekly in batches; cares deeply about chart accuracy            |
| Quote         | "I want trends, not just totals — and I don't want to hand over my banking credentials." |

**What this persona needs from the app:**
- Reliable, accurate charts over long periods
- Category customization and fine-grained filtering
- Data export or at minimum verifiable history

---

### Persona C — "The Anxious First-Timer"

| Attribute     | Detail                                                                 |
|---------------|------------------------------------------------------------------------|
| Name          | Sofia, 22                                                              |
| Occupation    | Recent graduate, junior designer                                       |
| Income        | $38,000/year (first real job)                                          |
| Tech comfort  | Medium-high for consumer apps; low for finance concepts               |
| Financial maturity | Low — first time budgeting independently                        |
| Pain points   | Overwhelmed by financial apps; doesn't know what categories to use   |
| Goals         | Not overdraft; understand where her paycheck goes                    |
| Key behavior  | Needs gentle defaults and guardrails; won't customize unless prompted |
| Quote         | "I just want it to tell me if I'm spending too much — simply."        |

**What this persona needs from the app:**
- Opinionated defaults (pre-built categories, suggested budget amounts)
- Clear onboarding that doesn't assume financial literacy
- Non-judgmental feedback when over budget (soft warnings, not red alarms)

---

### Persona D — "The Dual-Income Household Manager"

| Attribute     | Detail                                                                 |
|---------------|------------------------------------------------------------------------|
| Name          | James, 41                                                              |
| Occupation    | Operations manager                                                     |
| Income        | Household $185,000/year (dual income)                                  |
| Tech comfort  | Medium — uses what works, dislikes learning curves                    |
| Financial maturity | High practical knowledge; tracks manually in Notes app today    |
| Pain points   | Wants one place for all household spending; tired of manual CSV entry |
| Goals         | Category-level budget awareness; month-end summary for planning       |
| Key behavior  | Reviews finances once a week, Sunday evening                         |
| Quote         | "I don't need real-time alerts — I just need a weekly picture."       |

**What this persona needs from the app:**
- Reliable weekly digest view
- Easy batch entry for the week's expenses
- Stable, consistent data — no surprises or data loss

---

## 3. Core Features

Features are prioritized using MoSCoW: **M**ust Have, **S**hould Have, **C**ould Have, **W**on't Have (v1.0).

### Feature Map

| ID   | Feature                          | Priority | Persona        |
|------|----------------------------------|----------|----------------|
| F-01 | Email authentication             | M        | All            |
| F-02 | Social auth (Google / Apple)     | M        | A, C           |
| F-03 | Password reset via email         | M        | All            |
| F-04 | Dashboard — total balance        | M        | All            |
| F-05 | Dashboard — account cards        | M        | All            |
| F-06 | Dashboard — income/expense chips | M        | All            |
| F-07 | Dashboard — recent transactions  | M        | A, C           |
| F-08 | Add / log expense                | M        | A, C           |
| F-09 | Expense list with date grouping  | M        | All            |
| F-10 | Expense category filter          | M        | B, D           |
| F-11 | Expense search                   | S        | B, D           |
| F-12 | Edit / delete expense            | M        | All            |
| F-13 | Budget creation by category      | M        | All            |
| F-14 | Budget progress visualization    | M        | A, C, D        |
| F-15 | Budget month navigation          | M        | B, D           |
| F-16 | Edit / delete budget             | M        | All            |
| F-17 | Analytics — bar chart (spending) | M        | B, D           |
| F-18 | Analytics — line chart (balance) | M        | B, D           |
| F-19 | Analytics — donut chart (categories) | M    | A, B           |
| F-20 | Analytics — period toggle        | M        | B, D           |
| F-21 | Analytics — category drill-down  | S        | B              |
| F-22 | Dark mode / light mode toggle    | M        | All            |
| F-23 | Notification bell (in-app)       | S        | A              |
| F-24 | Profile / settings screen        | M        | All            |
| F-25 | Budget overspend alert           | S        | A, C           |
| F-26 | Empty state guidance             | M        | C              |
| F-27 | Receipt photo attachment         | C        | B, D           |
| F-28 | Data export (CSV)                | C        | B, D           |

---

## 4. User Stories

### 4.1 Authentication

**US-AUTH-01**
> As a new user, I want to create an account with my email and password so that my financial data is personal and secure.

*Acceptance Criteria:*
- User can enter name, email, password, confirm password
- Password must be ≥ 8 characters, contain at least 1 uppercase, 1 number
- Duplicate email shows inline error: "An account with this email already exists"
- Success navigates directly to Dashboard (no extra confirmation screen)
- Account is created in the backend with email unverified flag

---

**US-AUTH-02**
> As a returning user, I want to sign in with my email and password so I can access my saved data.

*Acceptance Criteria:*
- Successful credentials → Dashboard
- Wrong credentials → inline error: "Incorrect email or password"
- After 5 failed attempts → 30-second lockout with countdown timer
- "Show password" toggle reveals password in plain text

---

**US-AUTH-03**
> As a user, I want to sign in with Google or Apple so I don't have to remember another password.

*Acceptance Criteria:*
- Google OAuth flow uses system browser or native SDK (no WebView)
- Apple Sign-In complies with App Store requirement (required when Google is offered on iOS)
- New social auth user gets account created automatically with social provider's display name
- Existing social auth user is signed in on subsequent taps (no duplicate account)
- On error, toast message: "Sign-in failed. Please try again."

---

**US-AUTH-04**
> As a user who forgot my password, I want to reset it via email so I can regain access without losing my data.

*Acceptance Criteria:*
- "Forgot Password?" triggers email input screen
- App sends reset email using backend service (not client-side)
- On-screen confirmation: "Check your inbox — a reset link has been sent"
- Reset link expires in 60 minutes
- New password must pass same validation rules as registration

---

**US-AUTH-05**
> As a signed-in user, I want the app to keep me logged in across sessions so I don't re-authenticate every time.

*Acceptance Criteria:*
- Auth token persisted securely (Keychain on iOS, Keystore on Android)
- Token refreshed silently in background when near expiry
- Explicit sign-out clears all local tokens and navigates to Splash

---

### 4.2 Dashboard

**US-DASH-01**
> As a user, I want to see my total balance on the home screen so I know my overall financial position immediately.

*Acceptance Criteria:*
- Total balance is the sum of all manually entered account balances
- Displayed with two decimal places and currency symbol
- Month-over-month delta shown as percentage with directional arrow
- Balance card visible without scrolling on any supported device

---

**US-DASH-02**
> As a user, I want to see linked accounts on the dashboard so I can quickly check individual balances.

*Acceptance Criteria:*
- Each account card shows: institution name, masked last-4 digits, balance, type (debit/credit)
- Cards are horizontally scrollable; next card peeks at right edge
- Tapping a card opens an Account Detail view (v1.0: shows balance + name only)
- Accounts can be added and named manually

---

**US-DASH-03**
> As a user, I want to see this month's total income and total expenses on the dashboard so I understand my cash flow at a glance.

*Acceptance Criteria:*
- Income chip: sum of all income-type transactions for current calendar month
- Expense chip: sum of all expense-type transactions for current calendar month
- Both values update in real-time when new transactions are added
- Income shown in green with upward arrow; expense in red with downward arrow

---

**US-DASH-04**
> As a user, I want to see my most recent transactions on the home screen so I can verify recent activity without navigating.

*Acceptance Criteria:*
- Shows last 5 transactions, sorted by date descending
- Each row: category icon, merchant name, category, date, amount
- "See All" link navigates to full Expense List
- Pull-to-refresh reloads dashboard data

---

### 4.3 Expense Tracking

**US-EXP-01**
> As a user, I want to log an expense in under 10 seconds so that I don't forget to record it in the moment.

*Acceptance Criteria:*
- FAB accessible from Expense List screen and Dashboard
- Add Expense screen requires: amount (mandatory), category (mandatory), date (defaults to today)
- Note and payment method are optional
- "Add Expense" button is enabled as soon as amount > 0 and category is selected
- On save, expense appears immediately in list; user is returned to previous screen
- Haptic feedback on successful save (iOS: UIImpactFeedbackGenerator; Android: Vibration API)

---

**US-EXP-02**
> As a user, I want to view all my expenses in a date-grouped list so I can scan what I spent on any given day.

*Acceptance Criteria:*
- Expenses grouped by date, newest first
- Group labels: "Today", "Yesterday", then formatted date (e.g. "Jun 8, 2026")
- Each item shows: category icon, merchant name, category, time, amount
- Expenses (money out) shown in red; income entries (money in) shown in green
- Infinite scroll or pagination — loads in batches of 30

---

**US-EXP-03**
> As a user, I want to filter expenses by category so I can review spending in one area without noise from others.

*Acceptance Criteria:*
- Filter chips displayed horizontally below header: All, Food, Transport, Shopping, Bills, Health, Entertainment, Education, Other
- "All" chip selected by default
- Only one category chip active at a time
- Selecting a chip filters the list instantly (no loading state for local data)
- Active chip count badge shows the number of results

---

**US-EXP-04**
> As a user, I want to search my expenses by merchant name or note so I can find a specific transaction quickly.

*Acceptance Criteria:*
- Search icon in header expands to full-width text input on tap
- Search filters list in real-time as user types (debounced 200ms)
- Search is case-insensitive; matches on merchant name and note fields
- No results state shown with prompt to clear search
- Clear button ("×") appears inside input when text is present
- Keyboard dismiss collapses search bar; returns to full list

---

**US-EXP-05**
> As a user, I want to edit an expense after saving it so I can fix mistakes without deleting and re-entering.

*Acceptance Criteria:*
- Tapping any transaction opens a Transaction Detail / Edit screen
- All fields from Add Expense are editable
- "Save Changes" overwrites the existing record
- Changes reflected immediately in list and on Dashboard

---

**US-EXP-06**
> As a user, I want to delete an expense so I can remove erroneous entries.

*Acceptance Criteria:*
- Delete action available on Transaction Detail screen and via swipe-left on list item
- Confirmation bottom sheet: "Delete this expense?" with "Delete" (destructive red) and "Cancel"
- On confirm, item removed from list with slide-out animation
- Dashboard balance/stats update immediately

---

**US-EXP-07**
> As a user, I want to attach a photo of a receipt to an expense so I have a record for reimbursement or tax purposes.

*Acceptance Criteria:* *(Could Have — v1.0 optional)*
- Camera icon on Add/Edit Expense screen
- Tapping opens image picker: camera or photo library
- Image compressed to ≤ 1MB before upload
- Thumbnail shown on expense detail after attach
- Stored in cloud storage, linked by URL to the expense record

---

### 4.4 Budget Management

**US-BUD-01**
> As a user, I want to create a budget for a spending category so I have a limit to track against.

*Acceptance Criteria:*
- Add Budget requires: category (mandatory), budget limit amount (mandatory)
- Budget name pre-fills from category but is editable
- Date range defaults to current calendar month; user can customize start/end date
- Cannot create two active budgets for the same category in the same period
- On save, budget appears in Budget Overview immediately

---

**US-BUD-02**
> As a user, I want to see all my budgets and how much I've spent against each so I know where I stand.

*Acceptance Criteria:*
- Budget Overview lists all budgets for the selected month
- Each item shows: category icon, name, limit, amount spent, amount remaining, progress bar
- Progress bar color: accent (≤70% spent), orange (71–90%), red (>90%)
- Summary card at top shows total budget vs. total spent with a donut chart
- Budgets with no matching expenses in the period show $0.00 spent

---

**US-BUD-03**
> As a user, I want to navigate to previous months' budgets so I can review past periods.

*Acceptance Criteria:*
- Month selector in Budget Overview header, shows "Month Year ▾"
- Tapping opens a month picker (scrollable list or calendar grid)
- Selecting a past month loads that month's budget + actual data
- Future months can be selected to set budgets ahead of time
- Current month is always the default on open

---

**US-BUD-04**
> As a user, I want to receive a warning when I'm close to or over a budget limit so I can adjust my spending.

*Acceptance Criteria:*
- At 80% budget consumed → progress bar turns orange; optional in-app notification badge on Budget tab
- At 100% budget consumed → progress bar turns red; push notification (if permission granted): "[Category] budget reached. You've spent $X of your $Y limit."
- At >100% → progress bar shows overflow indicator (e.g. red overage segment beyond full bar); label reads "Over by $Z"
- Notifications require explicit push permission grant; no silent background notifications

---

**US-BUD-05**
> As a user, I want to edit a budget's limit or date range so I can adjust it as my financial situation changes.

*Acceptance Criteria:*
- Edit Budget screen is same form as Add Budget, pre-populated with existing values
- Changing the limit recalculates spent/remaining immediately
- Edits reflected on Budget Overview without a full reload

---

**US-BUD-06**
> As a user, I want to delete a budget so I can remove categories I no longer need to track.

*Acceptance Criteria:*
- Delete available from Edit Budget screen
- Confirmation dialog before deletion
- Associated expense entries are not deleted; only the budget limit record is removed
- Budget tab updates immediately

---

### 4.5 Analytics

**US-ANA-01**
> As a user, I want to see a bar chart of my spending by day or week so I can spot high-spend periods.

*Acceptance Criteria:*
- Weekly period: bars represent each day (Mon–Sun), showing total spent
- Monthly period: bars represent each week of the month
- Yearly period: bars represent each month (Jan–Dec)
- Tapping a bar shows a tooltip with exact date label and amount
- Empty days/weeks show a zero-height placeholder bar

---

**US-ANA-02**
> As a user, I want to see a line chart of my balance over time so I can understand my financial trend.

*Acceptance Criteria:*
- Line plot uses net balance (income minus expenses) summed cumulatively
- X-axis: dates within selected period
- Y-axis: dynamically scaled to data range with at least 5 tick marks
- Tapping the line shows a data point callout with date and balance value
- Gradient fill below the line for visual clarity

---

**US-ANA-03**
> As a user, I want to see a donut chart of spending by category so I can understand my spending composition at a glance.

*Acceptance Criteria:*
- Each arc represents a category's share of total spending in the period
- Categories with <2% of total are grouped into "Other"
- Legend shows: category color, name, amount, and percentage
- Tapping a segment navigates to Analytics Detail for that category
- Center displays total spending amount

---

**US-ANA-04**
> As a user, I want to toggle between weekly, monthly, and yearly views so I can analyze different time horizons.

*Acceptance Criteria:*
- Period pill toggle persists selection within the Analytics tab session
- Switching period reloads all three chart types for the new range
- Default period on open: Monthly
- Current period is always the most recent (current week / current month / current year)

---

**US-ANA-05**
> As a user, I want to drill into a specific category in Analytics so I can see every transaction contributing to that category's total.

*Acceptance Criteria:*
- Accessible by tapping a donut segment or a category in the top-spending list
- Shows: category name + period as title, total for category, chart (bar or line) for category only, scrollable list of all transactions in that category for the period
- Back navigation returns to Analytics Overview with same period selected
- Empty state if no transactions in category for period

---

### 4.6 Settings & Profile

**US-SET-01**
> As a user, I want to switch between dark and light mode so the app suits my environment and preference.

*Acceptance Criteria:*
- Theme toggle in Profile / Settings screen
- Options: "Dark", "Light", "System (follow device)"
- Change applies immediately without app restart
- Selection persisted across sessions

---

**US-SET-02**
> As a user, I want to manage my linked accounts so I can keep my balance information accurate.

*Acceptance Criteria:*
- Accounts list in Settings shows all manually added accounts
- Add account: name, balance, type (checking / savings / credit / cash)
- Edit account: update name or balance
- Delete account: with confirmation; removes account card from dashboard
- Account list limited to 10 accounts in v1.0

---

**US-SET-03**
> As a user, I want to sign out of the app so that my data is protected on shared devices.

*Acceptance Criteria:*
- "Sign Out" button in Profile screen
- Confirmation dialog before sign-out
- On confirm: local auth token cleared, app navigates to Splash screen
- Locally cached data cleared from device memory (not from cloud)

---

## 5. Functional Requirements

### 5.1 Authentication

| ID      | Requirement                                                                                   | Priority |
|---------|-----------------------------------------------------------------------------------------------|----------|
| FR-A01  | App shall support email/password registration with server-side validation                     | M        |
| FR-A02  | App shall support Google OAuth 2.0 sign-in                                                    | M        |
| FR-A03  | App shall support Apple Sign-In on iOS (mandatory per App Store guidelines)                   | M        |
| FR-A04  | Passwords shall be hashed using bcrypt (cost factor ≥ 12) before storage                     | M        |
| FR-A05  | Auth tokens shall be JWT with 15-minute access token and 7-day refresh token                  | M        |
| FR-A06  | Refresh tokens shall be rotated on use (rolling refresh)                                      | M        |
| FR-A07  | Failed sign-in attempts shall be rate-limited (5 attempts per IP per 10 minutes)              | M        |
| FR-A08  | Password reset tokens shall expire in 60 minutes and be single-use                            | M        |
| FR-A09  | Email verification link shall be sent on new email/password registration                      | S        |
| FR-A10  | App shall support biometric unlock (Face ID / Touch ID / Fingerprint) for session re-auth    | S        |

### 5.2 Expense Management

| ID      | Requirement                                                                                   | Priority |
|---------|-----------------------------------------------------------------------------------------------|----------|
| FR-E01  | User shall be able to create an expense with: amount, category, date, note (optional), payment method (optional) | M |
| FR-E02  | Amount field shall accept values from $0.01 to $999,999.99                                    | M        |
| FR-E03  | Date shall default to device local date; user can select any past date and up to 7 days future | M       |
| FR-E04  | Expense category shall be selected from a fixed taxonomy (v1.0) with one "Other" fallback    | M        |
| FR-E05  | User shall be able to edit any field of a previously saved expense                            | M        |
| FR-E06  | User shall be able to delete an expense with a confirmation prompt                            | M        |
| FR-E07  | Expense list shall support filter by category and free-text search on merchant/note           | M        |
| FR-E08  | Expense list shall paginate in batches of 30 records                                          | M        |
| FR-E09  | User shall be able to record income entries (positive transactions) in addition to expenses   | M        |
| FR-E10  | Expense entries shall be synced to cloud within 5 seconds of creation on active network       | M        |
| FR-E11  | Expenses created offline shall sync automatically when connectivity is restored               | M        |

### 5.3 Budget Management

| ID      | Requirement                                                                                   | Priority |
|---------|-----------------------------------------------------------------------------------------------|----------|
| FR-B01  | User shall be able to create a budget with: category, limit amount, date range                | M        |
| FR-B02  | Budget "spent" amount shall be automatically calculated from expenses matching the category and date range | M |
| FR-B03  | One active budget per category per overlapping date range shall be enforced                   | M        |
| FR-B04  | Budget progress shall update in real-time when a new expense is added in that category        | M        |
| FR-B05  | App shall display a warning indicator when a budget reaches 80% consumption                   | M        |
| FR-B06  | App shall display an overspent state with overflow amount when 100% is exceeded               | M        |
| FR-B07  | User shall be able to navigate to any past or future month's budget view                     | M        |
| FR-B08  | Deleting a budget shall not delete associated expense records                                 | M        |
| FR-B09  | App shall support up to 20 budget categories simultaneously per period                        | S        |

### 5.4 Analytics

| ID      | Requirement                                                                                   | Priority |
|---------|-----------------------------------------------------------------------------------------------|----------|
| FR-AN01 | Analytics shall aggregate expense data by: day (weekly view), week (monthly view), month (yearly view) | M |
| FR-AN02 | All three chart types (bar, line, donut) shall update when the period toggle is changed       | M        |
| FR-AN03 | Bar chart shall display $0 bars for periods with no transactions (no gaps)                    | M        |
| FR-AN04 | Donut chart shall group categories below 2% of total into "Other"                             | M        |
| FR-AN05 | Tapping a donut segment shall navigate to the category drill-down screen                      | M        |
| FR-AN06 | Category drill-down shall list all individual transactions for the category in the period     | M        |
| FR-AN07 | Analytics shall show comparison delta vs. the prior equivalent period (e.g., vs. last month) | M        |
| FR-AN08 | Analytics data shall be computed server-side for yearly aggregations; client-side for weekly  | S        |
| FR-AN09 | Top spending categories list shall show the top 5 categories ranked by amount for the period  | M        |

### 5.5 Dashboard

| ID      | Requirement                                                                                   | Priority |
|---------|-----------------------------------------------------------------------------------------------|----------|
| FR-D01  | Dashboard total balance shall equal the sum of all manually entered account balances          | M        |
| FR-D02  | Month-over-month delta shall compare current calendar month net cash flow vs. prior month     | M        |
| FR-D03  | Income and expense chips shall reflect current calendar month only                            | M        |
| FR-D04  | Recent Transactions shall show the 5 most recent entries across all categories                | M        |
| FR-D05  | Pull-to-refresh shall reload dashboard data and resolve any pending sync conflicts            | M        |
| FR-D06  | Dashboard shall load with cached data instantly and refresh data in background               | M        |

### 5.6 Settings

| ID      | Requirement                                                                                   | Priority |
|---------|-----------------------------------------------------------------------------------------------|----------|
| FR-S01  | App shall support Dark, Light, and System (device) theme modes                                | M        |
| FR-S02  | Theme preference shall persist across app restarts                                            | M        |
| FR-S03  | User shall be able to add, edit, and delete manual account entries                           | M        |
| FR-S04  | User shall be able to update their display name and profile avatar                            | S        |
| FR-S05  | User shall be able to change their account password (requires current password confirmation)  | M        |
| FR-S06  | User shall be able to delete their account, which removes all associated cloud data          | M        |
| FR-S07  | App shall support push notification opt-in for budget alerts                                  | S        |
| FR-S08  | User shall be able to export all expense data as a CSV file                                   | C        |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID       | Requirement                                                                                    |
|----------|-----------------------------------------------------------------------------------------------|
| NFR-P01  | App cold start (launch to Dashboard visible) shall complete in ≤ 2 seconds on a mid-range 2022 device |
| NFR-P02  | Screen transitions shall complete in ≤ 300ms                                                  |
| NFR-P03  | Expense list scroll shall maintain 60fps on devices with 3GB+ RAM                             |
| NFR-P04  | Chart render (bar, line, donut) shall complete in ≤ 500ms for up to 365 data points          |
| NFR-P05  | API response time (P95) for all read endpoints shall be ≤ 500ms under normal load            |
| NFR-P06  | API response time (P95) for write endpoints (create expense, create budget) shall be ≤ 800ms |
| NFR-P07  | App shall cache the last known state locally so that Dashboard loads instantly without network |

### 6.2 Reliability

| ID       | Requirement                                                                                    |
|----------|-----------------------------------------------------------------------------------------------|
| NFR-R01  | App shall achieve ≥ 99.5% crash-free session rate (measured via crash reporting tool)        |
| NFR-R02  | Backend API shall have ≥ 99.9% uptime (excluding planned maintenance windows)                |
| NFR-R03  | Offline expense creation shall be queued and synced without data loss when connectivity returns |
| NFR-R04  | Data sync conflicts (same record edited on two devices) shall be resolved using server timestamp wins |
| NFR-R05  | App shall not lose user data on force-close, OS kill, or background eviction                  |

### 6.3 Security

| ID       | Requirement                                                                                    |
|----------|-----------------------------------------------------------------------------------------------|
| NFR-S01  | All API communication shall use HTTPS with TLS 1.2 minimum (TLS 1.3 preferred)               |
| NFR-S02  | Auth tokens shall be stored in Keychain (iOS) / Keystore (Android), never in AsyncStorage    |
| NFR-S03  | No sensitive financial data (amounts, account numbers) shall be logged to crash reporters     |
| NFR-S04  | App shall implement certificate pinning for API host                                          |
| NFR-S05  | Backend API shall enforce authentication on all non-public endpoints                          |
| NFR-S06  | User data shall be logically isolated per account — no cross-account data access possible     |
| NFR-S07  | Account deletion shall permanently purge all user records from the database within 30 days    |
| NFR-S08  | App shall not request unnecessary device permissions (no contacts, no location, no microphone) |
| NFR-S09  | API shall validate and sanitize all inputs server-side regardless of client-side validation   |
| NFR-S10  | Masked account numbers (last 4 digits only) shall be displayed; full PAN shall never be stored |

### 6.4 Accessibility

| ID       | Requirement                                                                                    |
|----------|-----------------------------------------------------------------------------------------------|
| NFR-AC01 | All interactive elements shall have a minimum touch target of 44×44dp                        |
| NFR-AC02 | Color contrast for all text shall meet WCAG 2.1 AA (4.5:1 for body text, 3:1 for large text) |
| NFR-AC03 | All icon-only buttons shall have an accessible label (accessibilityLabel on RN)               |
| NFR-AC04 | Chart data shall have an accessible text summary available to screen readers                  |
| NFR-AC05 | App shall respect device font size settings; text shall not be clipped at 200% scale          |
| NFR-AC06 | App shall support iOS VoiceOver and Android TalkBack at a functional level                    |
| NFR-AC07 | No UI element shall convey state through color alone (always pair with icon or text)          |

### 6.5 Compatibility

| ID       | Requirement                                                                                    |
|----------|-----------------------------------------------------------------------------------------------|
| NFR-C01  | App shall support iOS 15.0 and above                                                          |
| NFR-C02  | App shall support Android 10 (API level 29) and above                                        |
| NFR-C03  | App shall render correctly on screens from 320dp to 430dp width (phone range)                |
| NFR-C04  | App shall adapt layout for tablet screens ≥ 768dp (navigation rail, two-column where applicable) |
| NFR-C05  | App shall support both portrait and landscape orientations on phone                            |

### 6.6 Maintainability

| ID       | Requirement                                                                                    |
|----------|-----------------------------------------------------------------------------------------------|
| NFR-M01  | Codebase shall have ≥ 70% unit test coverage on business logic (non-UI) modules               |
| NFR-M02  | All API contracts shall be documented in an OpenAPI 3.0 spec                                  |
| NFR-M03  | Design tokens (colors, spacing, typography) shall be defined as constants; no hard-coded values in component files |
| NFR-M04  | App shall integrate a crash reporting service (e.g. Sentry) with source map upload in CI     |
| NFR-M05  | App versioning shall follow semantic versioning (major.minor.patch)                           |

---

## 7. Navigation Requirements

### 7.1 Navigation Architecture

The app uses a two-level navigation structure:

```
Root Navigator (Stack)
├── Unauthenticated Stack
│   ├── Splash
│   ├── Sign In
│   ├── Sign Up
│   └── Forgot Password
│
└── Authenticated Navigator (Bottom Tabs)
    ├── Home Tab (Stack)
    │   ├── Dashboard
    │   ├── Account Detail
    │   └── Transaction Detail
    │
    ├── Budget Tab (Stack)
    │   ├── Budget Overview
    │   ├── Add Budget (Modal)
    │   └── Edit Budget (Modal)
    │
    ├── Expenses Tab (Stack)
    │   ├── Expense List
    │   ├── Add Expense (Modal)
    │   └── Expense Detail / Edit
    │
    ├── Analytics Tab (Stack)
    │   ├── Analytics Overview
    │   └── Analytics Category Detail
    │
    └── Profile Tab (Stack)
        ├── Profile / Settings
        ├── Edit Profile
        ├── Change Password
        ├── Manage Accounts
        └── Notification Settings
```

### 7.2 Navigation Rules

| ID      | Rule                                                                                           |
|---------|-----------------------------------------------------------------------------------------------|
| NAV-01  | An unauthenticated user shall never be able to reach any authenticated screen                 |
| NAV-02  | Token expiry during an authenticated session shall redirect to Sign In, not Splash            |
| NAV-03  | Back navigation from the first screen of a tab stack shall not exit the tab or navigate to another tab |
| NAV-04  | "Add Expense" and "Add Budget" forms shall be presented as modals (slide up from bottom) not pushed screens |
| NAV-05  | Modal forms shall include a dismiss control (back arrow or "Cancel") that discards unsaved changes after confirmation |
| NAV-06  | Deep links shall be supported for: sign-in, password reset, and (v1.0 future) shared expense view |
| NAV-07  | Pressing the active tab icon a second time shall scroll that tab's root screen to the top     |
| NAV-08  | Android hardware back button shall dismiss modals and navigate back within stacks; it shall not exit the app from Dashboard |
| NAV-09  | Navigation state shall not be reset when the app returns from background after < 30 minutes   |
| NAV-10  | After 30 minutes in background, app shall require biometric re-authentication (if enabled) before showing data |

### 7.3 Tab Bar Behavior

| ID      | Requirement                                                                                   |
|---------|-----------------------------------------------------------------------------------------------|
| NAV-T01 | Tab bar shall be visible on all root-level tab screens and hidden on pushed/modal screens     |
| NAV-T02 | Active tab icon shall use accent-primary color; inactive tabs use text-muted                  |
| NAV-T03 | Budget tab icon shall show a badge (dot) when any budget reaches 80% consumption             |
| NAV-T04 | Tab bar shall respect the device safe area inset at the bottom                                |
| NAV-T05 | On tablet (≥ 768dp), tab bar shall be replaced with a left navigation rail                   |

---

## 8. State Management Requirements

### 8.1 Architecture

The app shall use a layered state management approach:

```
UI Layer (React Native Components)
    │  reads from / dispatches to
    ▼
State Layer (e.g. Zustand stores or Redux Toolkit slices)
    │  calls
    ▼
Service Layer (API clients, local DB adapters)
    │  persists to
    ▼
Persistence Layer (SQLite / MMKV local cache + REST API)
```

### 8.2 State Domains

Each domain shall have an isolated store or slice:

| Domain       | Responsibility                                                                 |
|--------------|--------------------------------------------------------------------------------|
| auth         | currentUser, authToken, refreshToken, isAuthenticated, authStatus              |
| accounts     | list of linked accounts, total balance, loading/error states                   |
| expenses     | paginated expense list, active filters, search query, selected expense, sync queue |
| budgets      | budget list, selected month, budget summary totals, loading/error states       |
| analytics    | aggregated chart data, selected period, drill-down category, loading states    |
| ui           | theme (dark/light/system), active bottom tab, keyboard visibility, toast queue  |
| sync         | offline queue, sync status (idle/syncing/error), last sync timestamp           |

### 8.3 State Requirements

| ID      | Requirement                                                                                   |
|---------|-----------------------------------------------------------------------------------------------|
| SM-01   | Auth state shall be rehydrated from secure storage on app launch before rendering any screen  |
| SM-02   | Dashboard data shall be served from local cache immediately; background refresh shall reconcile with server |
| SM-03   | Optimistic updates shall be applied immediately on expense create/edit/delete; rolled back on API error |
| SM-04   | Offline mutations (create/edit/delete) shall be persisted to a local queue and replayed in order when online |
| SM-05   | Analytics data for the current and previous period shall be cached; older periods fetched on demand |
| SM-06   | UI state (selected tab, filter chip, period toggle) shall not persist across app restarts unless explicitly specified |
| SM-07   | A global error boundary shall catch unhandled exceptions and show a non-destructive error screen |
| SM-08   | Loading states shall be tracked per-domain; a loading spinner/skeleton shall replace content during initial fetch |
| SM-09   | Skeleton loaders shall be used in preference to full-screen spinners for list and card content |
| SM-10   | Theme preference shall be persisted to MMKV or AsyncStorage and applied before first render  |

### 8.4 Sync & Conflict Resolution

| ID      | Requirement                                                                                   |
|---------|-----------------------------------------------------------------------------------------------|
| SM-SY01 | Every record shall carry a `updatedAt` server timestamp and a `localUpdatedAt` client timestamp |
| SM-SY02 | On sync, server timestamp wins over local timestamp for conflict resolution                    |
| SM-SY03 | Records created offline shall be assigned a local UUID until the server assigns a canonical ID |
| SM-SY04 | Sync shall be triggered on: app foreground, network reconnect, pull-to-refresh                |
| SM-SY05 | Sync status shall be displayed subtly (e.g. small indicator in header) but shall not block UI |

---

## 9. Data Model Requirements

### 9.1 Entity: User

```
User {
  id              : UUID (PK)
  email           : string (unique, indexed)
  displayName     : string
  avatarUrl       : string | null
  authProvider    : enum [email, google, apple]
  passwordHash    : string | null          // null for social auth
  emailVerified   : boolean
  currency        : string (ISO 4217, default "USD")
  themePreference : enum [dark, light, system]
  createdAt       : timestamp
  updatedAt       : timestamp
  deletedAt       : timestamp | null       // soft delete
}
```

**Constraints:**
- `email` is case-insensitively unique
- `authProvider = email` requires `passwordHash`; social providers set it null
- Soft-delete: `deletedAt` set on account deletion; hard purge scheduled 30 days after

---

### 9.2 Entity: Account

```
Account {
  id          : UUID (PK)
  userId      : UUID (FK → User)
  name        : string
  type        : enum [checking, savings, credit, cash]
  balance     : decimal(12, 2)
  currency    : string (ISO 4217)
  institution : string | null
  lastFourDigits : string(4) | null
  displayOrder : integer
  createdAt   : timestamp
  updatedAt   : timestamp
}
```

**Constraints:**
- Max 10 accounts per user (v1.0)
- `balance` may be negative (credit card debt)
- `lastFourDigits` stored as masked display value only; no full PAN stored

---

### 9.3 Entity: Transaction (Expense / Income)

```
Transaction {
  id              : UUID (PK)
  userId          : UUID (FK → User, indexed)
  accountId       : UUID (FK → Account) | null
  type            : enum [expense, income]
  amount          : decimal(10, 2)           // always positive; type determines sign
  currency        : string (ISO 4217)
  category        : enum [food, transport, shopping, bills, health,
                          entertainment, education, other, income_salary,
                          income_freelance, income_other]
  merchant        : string
  note            : string | null
  date            : date                     // calendar date (not timestamp)
  time            : time | null              // optional time of day
  receiptUrl      : string | null
  tags            : string[]                 // v1.0: empty array; reserved for v2
  syncStatus      : enum [synced, pending, conflict]
  localId         : UUID                     // stable client-side ID for optimistic updates
  createdAt       : timestamp
  updatedAt       : timestamp
}
```

**Indexes:**
- `(userId, date DESC)` — expense list query
- `(userId, category, date)` — budget calculation and analytics
- `(userId, updatedAt)` — sync query

**Constraints:**
- `amount > 0` enforced at DB level; `type` determines income/expense semantic
- `merchant` max 100 characters
- `note` max 500 characters
- `date` cannot be more than 7 days in the future

---

### 9.4 Entity: Budget

```
Budget {
  id          : UUID (PK)
  userId      : UUID (FK → User, indexed)
  category    : enum [food, transport, shopping, bills, health,
                      entertainment, education, other]
  name        : string
  limitAmount : decimal(10, 2)
  currency    : string (ISO 4217)
  startDate   : date
  endDate     : date
  colorHex    : string(7) | null     // custom color, defaults to category color
  iconKey     : string | null        // custom icon key, defaults to category icon
  createdAt   : timestamp
  updatedAt   : timestamp
}
```

**Computed fields (not stored, calculated on read):**
- `spentAmount` — SUM of Transaction.amount WHERE userId AND category AND date BETWEEN startDate AND endDate AND type = expense
- `remainingAmount` — limitAmount - spentAmount
- `percentageUsed` — (spentAmount / limitAmount) × 100

**Constraints:**
- Unique constraint: `(userId, category, startDate, endDate)` — no duplicate budgets
- `limitAmount > 0`
- `endDate >= startDate`

---

### 9.5 Entity: Notification

```
Notification {
  id          : UUID (PK)
  userId      : UUID (FK → User)
  type        : enum [budget_warning, budget_exceeded, weekly_summary]
  title       : string
  body        : string
  relatedId   : UUID | null          // budgetId or null
  isRead      : boolean
  sentAt      : timestamp
  createdAt   : timestamp
}
```

---

### 9.6 Entity: SyncQueue (local only, not persisted to server)

```
SyncQueueItem {
  localId     : UUID
  entityType  : enum [transaction, budget, account]
  operation   : enum [create, update, delete]
  payload     : JSON
  attempts    : integer
  lastAttempt : timestamp | null
  createdAt   : timestamp
}
```

**Rules:**
- Max 3 retry attempts before marking as failed
- Failed items surfaced to user as a sync error indicator
- Items processed in FIFO order

---

### 9.7 Derived / Computed Data

The following are computed at query time and never stored as columns:

| Derived Value           | Calculation                                                      | Used In                    |
|-------------------------|------------------------------------------------------------------|----------------------------|
| totalBalance            | SUM(Account.balance) for userId                                  | Dashboard hero card        |
| monthlyIncome           | SUM(Transaction.amount) WHERE type=income AND date in month      | Dashboard chip             |
| monthlyExpense          | SUM(Transaction.amount) WHERE type=expense AND date in month     | Dashboard chip             |
| monthOverMonthDelta     | (currentMonth net) - (priorMonth net) / abs(priorMonth net)     | Dashboard delta indicator  |
| budgetSpent             | SUM(Transaction.amount) matching budget category and date range  | Budget progress bar        |
| categoryTotal(period)   | SUM grouped by category for date range                           | Donut chart, top-5 list    |
| dailyTotal(period)      | SUM grouped by date for date range                               | Bar chart                  |
| runningBalance(period)  | Cumulative net by date                                           | Line chart                 |

---

### 9.8 API Endpoints (Reference)

| Method | Path                                | Description                              | Auth |
|--------|-------------------------------------|------------------------------------------|------|
| POST   | /auth/register                      | Create email/password account            | No   |
| POST   | /auth/login                         | Sign in, returns access + refresh tokens | No   |
| POST   | /auth/refresh                       | Exchange refresh token for new pair      | No   |
| POST   | /auth/logout                        | Invalidate refresh token                 | Yes  |
| POST   | /auth/password-reset/request        | Send reset email                         | No   |
| POST   | /auth/password-reset/confirm        | Apply new password with reset token      | No   |
| GET    | /users/me                           | Fetch current user profile               | Yes  |
| PATCH  | /users/me                           | Update display name, avatar, currency    | Yes  |
| DELETE | /users/me                           | Request account deletion                 | Yes  |
| GET    | /accounts                           | List user's accounts                     | Yes  |
| POST   | /accounts                           | Create account                           | Yes  |
| PATCH  | /accounts/:id                       | Update account name/balance              | Yes  |
| DELETE | /accounts/:id                       | Delete account                           | Yes  |
| GET    | /transactions                       | List with filters (category, date, type) | Yes  |
| POST   | /transactions                       | Create transaction                       | Yes  |
| GET    | /transactions/:id                   | Fetch single transaction                 | Yes  |
| PATCH  | /transactions/:id                   | Update transaction                       | Yes  |
| DELETE | /transactions/:id                   | Delete transaction                       | Yes  |
| POST   | /transactions/bulk                  | Batch create (offline sync replay)       | Yes  |
| GET    | /budgets                            | List budgets, optional ?month=YYYY-MM    | Yes  |
| POST   | /budgets                            | Create budget                            | Yes  |
| PATCH  | /budgets/:id                        | Update budget                            | Yes  |
| DELETE | /budgets/:id                        | Delete budget                            | Yes  |
| GET    | /analytics/summary                  | Aggregated totals for period             | Yes  |
| GET    | /analytics/by-category              | Category breakdown for period            | Yes  |
| GET    | /analytics/by-date                  | Daily/weekly/monthly totals for period   | Yes  |
| GET    | /analytics/balance-trend            | Running balance series for period        | Yes  |
| GET    | /notifications                      | List unread notifications for user       | Yes  |
| PATCH  | /notifications/:id/read             | Mark notification as read                | Yes  |

---

## 10. Analytics Requirements

### 10.1 Product Analytics (App Telemetry)

The app shall instrument the following events to enable product decision-making. No personally identifiable information (PII) or financial amounts shall be included in any telemetry event.

#### 10.1.1 Authentication Events

| Event Name              | Trigger                                     | Properties                          |
|-------------------------|---------------------------------------------|-------------------------------------|
| `auth_signup_started`   | User taps Get Started on Splash             | —                                   |
| `auth_signup_completed` | Successful account creation                 | `method: email|google|apple`        |
| `auth_signup_failed`    | Registration API error                      | `method`, `error_code`              |
| `auth_login_completed`  | Successful sign-in                          | `method: email|google|apple`        |
| `auth_login_failed`     | Failed sign-in attempt                      | `method`, `error_code`              |
| `auth_logout`           | User signs out                              | —                                   |

#### 10.1.2 Expense Events

| Event Name                  | Trigger                                     | Properties                          |
|-----------------------------|---------------------------------------------|-------------------------------------|
| `expense_add_started`       | User opens Add Expense screen               | `source: fab|header|dashboard`      |
| `expense_add_completed`     | Expense saved successfully                  | `category`, `has_note: bool`, `has_receipt: bool` |
| `expense_add_abandoned`     | User exits Add Expense without saving       | `filled_fields: []`                 |
| `expense_edit_completed`    | Expense updated                             | `fields_changed: []`                |
| `expense_delete_completed`  | Expense deleted                             | `category`                          |
| `expense_search_used`       | User activates search input                 | —                                   |
| `expense_filter_applied`    | Category filter chip tapped                 | `category`                          |

#### 10.1.3 Budget Events

| Event Name                  | Trigger                                     | Properties                          |
|-----------------------------|---------------------------------------------|-------------------------------------|
| `budget_create_completed`   | Budget saved                                | `category`, `has_custom_dates: bool` |
| `budget_edit_completed`     | Budget updated                              | `fields_changed: []`                |
| `budget_delete_completed`   | Budget deleted                              | `category`                          |
| `budget_warning_shown`      | 80% threshold reached and badge shown       | `category`                          |
| `budget_exceeded_shown`     | 100%+ shown in UI                           | `category`                          |

#### 10.1.4 Analytics / Navigation Events

| Event Name                  | Trigger                                     | Properties                          |
|-----------------------------|---------------------------------------------|-------------------------------------|
| `analytics_period_changed`  | Period toggle tapped                        | `period: weekly|monthly|yearly`     |
| `analytics_chart_tapped`    | User taps a chart element                   | `chart_type: bar|line|donut`, `segment` |
| `analytics_drilldown_opened`| Category drill-down navigated to           | `category`                          |
| `tab_switched`              | Bottom tab tapped                           | `from_tab`, `to_tab`                |
| `screen_viewed`             | Screen becomes active                       | `screen_name`                       |

#### 10.1.5 Settings Events

| Event Name                  | Trigger                                     | Properties                          |
|-----------------------------|---------------------------------------------|-------------------------------------|
| `theme_changed`             | Theme preference updated                    | `theme: dark|light|system`          |
| `account_added`             | Manual account created                      | `account_type`                      |
| `account_deleted`           | Account deleted                             | —                                   |
| `notification_permission_granted` | User grants push permission         | —                                   |
| `notification_permission_denied`  | User denies push permission         | —                                   |

### 10.2 Telemetry Requirements

| ID       | Requirement                                                                                    |
|----------|-----------------------------------------------------------------------------------------------|
| AN-T01   | Events shall be batched client-side and flushed every 30 seconds or on app background, whichever comes first |
| AN-T02   | Events shall be queued locally when offline and flushed on connectivity restore               |
| AN-T03   | No PII (name, email, device ID) shall be included in any event payload                       |
| AN-T04   | No financial values (amounts, balances) shall be included in any event payload               |
| AN-T05   | Each event shall include: `event_name`, `timestamp`, `session_id` (anonymous), `app_version`, `platform` |
| AN-T06   | Analytics SDK shall be configurable to be disabled entirely for privacy-compliant builds      |
| AN-T07   | User shall be informed of telemetry in the privacy policy; no additional in-app consent required for aggregate telemetry |

### 10.3 Business Intelligence Metrics

The backend shall produce the following computed metrics for product review (not visible to end users):

| Metric                          | Description                                                           | Cadence  |
|---------------------------------|-----------------------------------------------------------------------|----------|
| Daily Active Users (DAU)        | Unique users with ≥ 1 session in last 24h                            | Daily    |
| Weekly Active Users (WAU)       | Unique users with ≥ 1 session in last 7 days                         | Weekly   |
| Monthly Active Users (MAU)      | Unique users with ≥ 1 session in last 30 days                        | Monthly  |
| DAU/MAU ratio                   | Engagement stickiness indicator                                       | Daily    |
| Retention D1 / D7 / D30         | % of new users returning on day 1, 7, 30                            | Cohort   |
| Avg. expenses logged per DAU    | Mean transactions created per active user per day                    | Daily    |
| Budgets created per new user    | Mean budgets created in first 7 days                                 | Cohort   |
| Feature adoption rate           | % of active users who used each core feature at least once           | Weekly   |
| Expense add funnel              | started → amount entered → category selected → saved (% at each step)| Weekly   |
| Crash rate                      | Crashes per 1,000 sessions                                            | Daily    |
| API error rate                  | 4xx and 5xx responses per 1,000 API calls                            | Daily    |
| Sync failure rate               | Failed offline sync replays per 1,000 sync attempts                  | Daily    |

---

## Appendix A — Category Taxonomy (v1.0)

| Category Key    | Display Name   | Applies To          |
|-----------------|----------------|---------------------|
| food            | Food & Dining  | expense             |
| transport       | Transport      | expense             |
| shopping        | Shopping       | expense             |
| bills           | Bills          | expense             |
| health          | Health         | expense             |
| entertainment   | Entertainment  | expense             |
| education       | Education      | expense             |
| other           | Other          | expense             |
| income_salary   | Salary         | income              |
| income_freelance| Freelance      | income              |
| income_other    | Other Income   | income              |

---

## Appendix B — Error Handling Standards

| Scenario                        | User-Facing Message                                          | Technical Action               |
|---------------------------------|--------------------------------------------------------------|-------------------------------|
| No internet connection          | "No connection. Changes will sync when you're back online."  | Queue to local sync store      |
| API 401 Unauthorized            | Silent → attempt token refresh → if fails, navigate to Sign In | Clear tokens, redirect        |
| API 404 Not Found               | "This item no longer exists."                                | Remove from local cache        |
| API 500 Server Error            | "Something went wrong. Please try again."                    | Log to crash reporter          |
| API timeout (>10s)              | "Taking longer than expected. Check your connection."        | Cancel request, allow retry    |
| Validation error (client)       | Inline field error, specific to the field                    | Block form submission          |
| Sync conflict                   | Silent resolution (server wins); no user notification        | Log conflict count             |

---

## Appendix C — Glossary

| Term             | Definition                                                                       |
|------------------|----------------------------------------------------------------------------------|
| Transaction      | A single expense or income entry logged by the user                              |
| Budget           | A spending limit set by the user for a category over a date range                |
| Account          | A manually entered financial account (bank, credit card, cash) with a balance    |
| Period           | The time window selected in Analytics (weekly / monthly / yearly)                |
| Total Balance    | The sum of all account balances for a user                                       |
| Net Cash Flow    | Total income minus total expenses for a given period                             |
| Optimistic Update| Applying a UI change immediately before the API confirms the operation           |
| Sync Queue       | A local list of offline mutations waiting to be sent to the server               |
| Category         | A classification for a transaction (Food, Transport, etc.)                       |
| DAU/WAU/MAU      | Daily / Weekly / Monthly Active Users                                            |

---

*End of PRODUCT_REQUIREMENTS.md*
