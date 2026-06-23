# Store Metadata — Networthy

Use this document when filling in App Store Connect and Google Play Console fields.

---

## iOS — App Store Connect

| Field | Value |
|---|---|
| **Name** | Networthy |
| **Subtitle** | Budget, Wealth & Expenses |
| **Bundle ID** | com.networthy.app |
| **SKU** | com.networthy.app |
| **Primary Category** | Finance |
| **Secondary Category** | Productivity |
| **Age Rating** | 4+ |
| **Privacy Policy URL** | https://networthy.app/privacy |
| **Support URL** | https://networthy.app/support |

### Keywords (max 100 chars)
```
budget,expense tracker,money manager,savings goals,net worth,wealth,personal finance
```

### Description (max 4 000 chars)
```
Networthy is a beautiful, privacy-first personal finance app that gives you a complete picture of your money — all in one place.

TRACK EVERY PESO (OR DOLLAR)
Log income and expenses in seconds. Categorise transactions automatically, add notes, and attach them to any account. A real-time dashboard shows your cash flow at a glance.

BUDGETS THAT ACTUALLY WORK
Set monthly spending limits per category and get notified before you overspend. Colour-coded progress bars and an intuitive Budget Health score make it easy to stay on track.

GROW YOUR WEALTH
Track savings goals, investments, and debt in the Wealth tab. Watch your net worth climb over time with animated charts.

ANALYTICS THAT MATTER
Month-over-month spending trends, category breakdowns, and income-vs-expense comparisons help you spot patterns and make better financial decisions.

BUILT FOR PRIVACY
• All data is stored under your account with row-level security — nobody else can read it
• iOS certificate pinning prevents man-in-the-middle attacks
• Biometric lock (Face ID / Touch ID) keeps prying eyes out
• Auth tokens live in the secure Keychain, never in plain storage

WORKS EVERYWHERE
Supports multiple currencies (PHP, USD, EUR, and more). Syncs across devices. Works offline — changes upload automatically when you reconnect.

Download free and take control of your finances today.
```

### What's New (version 1.0.0)
```
Initial release — budget tracking, expense logging, savings goals, net worth dashboard, and analytics.
```

---

## Android — Google Play Console

| Field | Value |
|---|---|
| **Title** | Networthy — Budget & Wealth |
| **Package** | com.networthy.app |
| **Category** | Finance |
| **Content Rating** | Everyone |
| **Privacy Policy URL** | https://networthy.app/privacy |

### Short Description (max 80 chars)
```
Track budgets, expenses, savings goals, and your net worth in one place.
```

### Full Description (max 4 000 chars)
*(Use the same text as the iOS description above.)*

---

## Required Screenshots

Capture screenshots on the following device sizes before submitting:

### iOS (required)
| Device | Size | Notes |
|---|---|---|
| iPhone 6.9" (iPhone 16 Pro Max) | 1320 × 2868 px | Required |
| iPhone 6.5" (iPhone 14 Plus) | 1284 × 2778 px | Required |
| iPad Pro 13" | 2064 × 2752 px | Required if `supportsTablet: true` |

### Android (required)
| Type | Size |
|---|---|
| Phone screenshot | min 320 px, max 3 840 px on any side |
| 16:9 or 9:16 feature graphic | 1024 × 500 px |

### Suggested screens to capture
1. Dashboard (Health Score + balance summary)
2. Transaction list with a few entries
3. Budget overview with progress bars
4. Savings Goals — Wealth tab
5. Analytics — monthly breakdown chart
6. Dark mode variant of the Dashboard

---

## Credentials Checklist (complete before `eas submit`)

### iOS
- [ ] Apple Developer account enrolled in Apple Developer Program ($99/yr)
- [ ] Run `eas credentials --platform ios` to generate / import:
  - Distribution certificate (`.p12`)
  - App Store provisioning profile
- [ ] App created in App Store Connect with bundle ID `com.networthy.app`
- [ ] Fill in `eas.json` → `submit.production.ios`:
  - `appleId`: your Apple ID email
  - `ascAppId`: the numeric App Store Connect App ID (found in App Information)
  - `appleTeamId`: 10-character team ID (found in Membership section)

### Android
- [ ] Google Play Developer account enrolled ($25 one-time fee)
- [ ] Run `eas credentials --platform android` to generate the upload keystore
- [ ] Create a Google Cloud service account with Play Developer API access and download JSON key
- [ ] Save the key as `google-service-account.json` (gitignored) in the project root
- [ ] App created in Google Play Console with package `com.networthy.app`
- [ ] Fill in `eas.json` → `submit.production.android`:
  - `serviceAccountKeyPath`: `./google-service-account.json`

---

## Submission Commands

```bash
# 1. Configure credentials (one-time, interactive)
eas credentials --platform ios
eas credentials --platform android

# 2. Build production binaries
eas build --platform all --profile production

# 3. Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```
