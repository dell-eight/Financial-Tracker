# Privacy Policy — Financial Tracker

**Last updated: 2026-06-18**

## 1. Information We Collect

**Account data** — When you create an account we collect your email address and the display name you provide. This is stored securely in Supabase (PostgreSQL), hosted on infrastructure that complies with SOC 2 Type II.

**Financial data you enter** — Transactions, budget limits, savings goals, and account balances are stored under your authenticated user ID. We never share this data with third parties.

**Device data** — We do not collect device identifiers, advertising IDs, or location data.

**Notification tokens** — If you enable push notifications, your Expo push token is stored so we can deliver budget-alert notifications. You can disable notifications at any time in app settings.

## 2. How We Use Your Information

- To provide and maintain the core app features (budgeting, transaction tracking, wealth overview).
- To send you budget-threshold notifications you have explicitly opted into.
- To authenticate you securely via Supabase Auth (email/password or Google Sign-In).

We do **not** sell, trade, or rent your personal information to third parties.

## 3. Data Storage and Security

All data is stored in Supabase-managed PostgreSQL databases with row-level security (RLS) enforced: you can only read and write your own rows.

Network traffic uses TLS 1.2+ with certificate pinning on iOS to prevent man-in-the-middle attacks.

Auth tokens are stored in iOS Keychain / Android Keystore via `expo-secure-store` and are never written to unencrypted local storage.

## 4. Biometric Data

If you enable biometric lock (Face ID / Touch ID / Fingerprint), the authentication is handled entirely by the operating system. We do not store or transmit biometric data.

## 5. Third-Party Services

| Service | Purpose | Privacy Policy |
|---|---|---|
| Supabase | Database & Auth | https://supabase.com/privacy |
| Google Sign-In | Optional OAuth login | https://policies.google.com/privacy |
| Expo / EAS | Build & update delivery | https://expo.dev/privacy |

## 6. Data Retention and Deletion

You may delete your account and all associated data at any time from **Profile → Delete Account**. Deletion is permanent and processed within 30 days.

## 7. Children

This app is not directed at children under 13. We do not knowingly collect personal information from children under 13.

## 8. Changes to This Policy

We will notify you of material changes via an in-app banner or push notification. Continued use after the effective date constitutes acceptance of the updated policy.

## 9. Contact

Questions about this policy: **support@financialtracker.app**
