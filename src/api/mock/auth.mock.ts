import type { AuthResponse, RegisterCredentials } from '../../types/models';
import { SEED_USER } from '../../data/seed';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function mockLogin(
  email: string,
  _password: string,
): Promise<AuthResponse> {
  await delay(900);

  if (email.toLowerCase() === 'fail@test.com') {
    throw new Error('Invalid email or password.');
  }

  return {
    user:  { ...SEED_USER, email },
    token: `mock-jwt-${Date.now()}`,
  };
}

export async function mockRegister(
  credentials: RegisterCredentials,
): Promise<AuthResponse> {
  await delay(1100);

  const initials = credentials.name
    .trim()
    .split(/\s+/)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  return {
    user: {
      id:             String(Date.now()),
      name:           credentials.name,
      email:          credentials.email,
      avatarInitials: initials || 'U',
      currency:       'USD',
      memberSince:    new Date().toISOString().slice(0, 10),
    },
    token: `mock-jwt-${Date.now()}`,
  };
}
