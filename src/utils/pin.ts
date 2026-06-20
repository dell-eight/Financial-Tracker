import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const LEGACY_KEY = 'fintrack_pin_hash';

// iOS Keychain keys must be short; strip dashes and take first 24 chars of the UUID.
function pinKey(userId: string): string {
  return `fp_pin_${userId.replace(/-/g, '').slice(0, 24)}`;
}

export async function hashPIN(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export async function storePIN(pin: string, userId: string): Promise<void> {
  const hash = await hashPIN(pin);
  await SecureStore.setItemAsync(pinKey(userId), hash);
}

export async function verifyPIN(pin: string, userId: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(pinKey(userId));
  if (!stored) return false;
  const hash = await hashPIN(pin);
  return hash === stored;
}

export async function clearPIN(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(pinKey(userId));
}

// One-time migration from the old global key to the user-scoped key.
// Safe to call on every sign-in — no-ops if the user-scoped key already exists
// or if there was never a global PIN.
export async function migratePinIfNeeded(userId: string): Promise<void> {
  const userKey = pinKey(userId);
  const existing = await SecureStore.getItemAsync(userKey);
  if (existing) return;
  const legacy = await SecureStore.getItemAsync(LEGACY_KEY);
  if (!legacy) return;
  await SecureStore.setItemAsync(userKey, legacy);
  await SecureStore.deleteItemAsync(LEGACY_KEY);
}
