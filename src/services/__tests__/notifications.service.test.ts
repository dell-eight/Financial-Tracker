// expo-constants is mocked in jest.setup.ts to return executionEnvironment = 'storeClient'
// so IS_EXPO_GO = true and getNotifs() returns null for all functions below.

import {
  requestPermissionsAndGetToken,
  checkBudgetThresholds,
  syncWeeklySummary,
  addResponseListener,
} from '../notifications.service';
import type { Budget } from '../../types/models';

const mockBudget: Budget = {
  id:       'b1',
  category: 'food',
  label:    'Food',
  icon:     '🍔',
  color:    '#FF0000',
  limit:    5000,
  spent:    4500,
  month:    6,
  year:     2026,
};

describe('notifications.service — Expo Go guards', () => {
  it('requestPermissionsAndGetToken returns null in Expo Go', async () => {
    await expect(requestPermissionsAndGetToken()).resolves.toBeNull();
  });

  it('checkBudgetThresholds resolves without throwing in Expo Go', async () => {
    await expect(
      checkBudgetThresholds([mockBudget], true, true),
    ).resolves.toBeUndefined();
  });

  it('syncWeeklySummary resolves without throwing in Expo Go', async () => {
    await expect(syncWeeklySummary(true)).resolves.toBeUndefined();
  });

  it('addResponseListener returns a no-op remove stub in Expo Go', () => {
    const sub = addResponseListener(jest.fn());
    expect(sub).toHaveProperty('remove');
    expect(() => sub.remove()).not.toThrow();
  });
});
