import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const PIN_KEY = 'fintrack_pin_hash';

export async function hashPIN(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export async function storePIN(pin: string): Promise<void> {
  const hash = await hashPIN(pin);
  await SecureStore.setItemAsync(PIN_KEY, hash);
}

export async function verifyPIN(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  if (!stored) return false;
  const hash = await hashPIN(pin);
  return hash === stored;
}

export async function clearPIN(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}
