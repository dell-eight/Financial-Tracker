# Security Posture

## Transport Security — Certificate Pinning

TLS connections to `*.supabase.co` are pinned to the **WE1 intermediate CA** and the **GTS Root R4** root CA (SPKI SHA-256). Pinning to CA certificates (rather than leaf certs) tolerates leaf-cert rotation while still blocking MITM proxies that present an alternative chain.

| Layer     | Mechanism                                                      |
|-----------|----------------------------------------------------------------|
| Android   | `network_security_config.xml` via `plugins/withAndroidNetworkSecurity.js` |
| iOS       | `NSPinnedDomains` / `NSPinnedCAIdentities` in `app.json` `infoPlist` |

**Expiration:** Pins were derived 2026-06-17 with an explicit expiration of 2027-06-17.  
**Renewal:** Run `node scripts/get-cert-pins.js` annually and update the three pin locations above.

### Pins (SPKI SHA-256 / base64)

| Certificate        | Hash                                         |
|--------------------|----------------------------------------------|
| WE1 (intermediate) | `kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=` |
| GTS Root R4 (root) | `mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=` |

---

## Authentication Rate Limiting

Failed login attempts are tracked in the persisted Zustand `app.store` (`loginAttempts`, `loginLockoutUntil`). After **5 consecutive failures**, the login screen is locked for **5 minutes**. The lockout survives app restarts (stored via AsyncStorage) to prevent bypass by force-quitting.

The lockout UI shows a countdown banner and disables the Sign In button and input fields until the lockout expires. Successful authentication resets the counter.

---

## Data Storage

| Data type             | Storage location          | Encrypted          |
|-----------------------|---------------------------|--------------------|
| Auth tokens           | `expo-secure-store`       | Yes (AES-256/Keychain) |
| App preferences       | `AsyncStorage`            | No (non-sensitive) |
| Financial data        | Supabase (cloud Postgres) | At rest + in transit |

Auth tokens are chunked (≤ 1900 bytes) to work around iOS SecureStore limits. Keys are capped at 24 characters to leave room for chunk suffixes.

---

## Row Level Security

Every Supabase table has RLS enabled. Financial tables (`expenses`, `income_records`, `savings_goals`, `investment_*`, `asset_accounts`, `debt_accounts`) are protected by:

- **SELECT** — `auth.uid() = user_id AND deleted_at IS NULL` — soft-deleted rows invisible at DB layer  
- **INSERT / UPDATE** — `auth.uid() = user_id`  
- **DELETE** — `USING (FALSE)` — hard DELETE blocked; application must set `deleted_at` (soft delete only)

Applied in migration `010_soft_delete_enforcement.sql`.

---

## Secret Exposure Prevention

CI verifies that all `process.env.*` references in `src/` use the `EXPO_PUBLIC_` prefix. Expo strips any unprefixed env var from the client bundle — this CI gate ensures no server-side secrets are accidentally referenced in app code.

Only two env vars are used:
- `EXPO_PUBLIC_SUPABASE_URL` — safe to expose (points to public Supabase endpoint)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — safe to expose (restricted by RLS; not a service key)

---

## Biometric Lock

The app supports optional biometric authentication (FaceID / Fingerprint) via `expo-local-authentication`. When enabled, `isBiometricUnlocked` is checked on resume. This flag is **not persisted** (session-only Zustand state), so every cold launch re-prompts biometric verification.

---

## Known Limitations / Future Work

- **No backend rate limiting** — the client-side lockout can be bypassed by clearing AsyncStorage. A Supabase Edge Function or Postgres function enforcing per-IP or per-email attempt limits is the recommended next step.
- **No jailbreak/root detection** — consider `expo-device` + `react-native-jail-monkey` for high-risk deployments.
- **Google OAuth redirect** — uses `Linking.createURL` which is a universal link; ensure the scheme is registered to prevent URL hijacking on Android.
