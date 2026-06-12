import type { NavigatorScreenParams } from '@react-navigation/native';

// ── Auth stack ─────────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Welcome:  undefined;
  SignUp:   undefined;
  Login:    undefined;
};

// ── Main tab bar (placeholder until tab screens are built) ─────────────────────
export type MainTabParamList = {
  Home:      undefined;
  Budget:    undefined;
  Expenses:  undefined;
  Analytics: undefined;
  Profile:   undefined;
};

// ── Root ───────────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// ── Typed navigation helpers ───────────────────────────────────────────────────
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
