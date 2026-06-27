import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../store/app.store';
import { useTheme } from '../../hooks/ui/useTheme';
import { useCurrency } from '../../utils/currency';
import { createAsset, updateBudgetLimit } from '../../services/finance.service';
import { syncDailyReminder, requestPermissionsAndGetToken } from '../../services/notifications.service';
import {
  trackOnboardingStepCompleted,
  trackOnboardingAbandoned,
  trackOnboardingCompleted,
  trackNetWorthRevealed,
} from '../../services/analytics.service';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3;

type AccountEntry = {
  id:       string;
  name:     string;
  balance:  number;
  icon:     string;
  category: string;
};

type AccountType = { key: string; label: string; icon: string; category: string };

const ACCOUNT_TYPES: AccountType[] = [
  { key: 'cash',    label: 'Cash',       icon: '💵', category: 'cash'       },
  { key: 'bank',    label: 'Bank',       icon: '🏦', category: 'cash'       },
  { key: 'savings', label: 'Savings',    icon: '💰', category: 'cash'       },
  { key: 'invest',  label: 'Investment', icon: '📈', category: 'investment' },
  { key: 'property',label: 'Property',   icon: '🏠', category: 'real_estate'},
];

type BudgetCat = { label: string; icon: string; color: string };

const BUDGET_CATS: BudgetCat[] = [
  { label: 'Food',          icon: '🍔', color: '#F59E0B' },
  { label: 'Transport',     icon: '🚌', color: '#3B82F6' },
  { label: 'Shopping',      icon: '🛍️', color: '#8B5CF6' },
  { label: 'Entertainment', icon: '🎬', color: '#EC4899' },
  { label: 'Bills',         icon: '⚡', color: '#6B7280' },
  { label: 'Health',        icon: '💊', color: '#10B981' },
];

// ─── OnboardingScreen ─────────────────────────────────────────────────────────

export function OnboardingScreen() {
  const theme   = useTheme();
  const insets  = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { symbol, fmt } = useCurrency();

  const setHasSeenNetWorthOnboarding = useAppStore(s => s.setHasSeenNetWorthOnboarding);
  const setEveningReminderEnabled    = useAppStore(s => s.setEveningReminderEnabled);
  const resetAllTutorials            = useAppStore(s => s.resetAllTutorials);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const [step, setStep]           = useState<Step>(0);
  const [accounts, setAccounts]   = useState<AccountEntry[]>([]);
  const [saving, setSaving]       = useState(false);

  // Step 0 — account add form
  const [selectedType, setSelectedType] = useState<AccountType>(ACCOUNT_TYPES[1]);
  const [acctName, setAcctName]         = useState('');
  const [acctBalance, setAcctBalance]   = useState('');
  const [showForm, setShowForm]         = useState(false);
  const [formError, setFormError]       = useState<string | null>(null);

  // Step 2 — budget
  const [budgetCat, setBudgetCat]     = useState<BudgetCat>(BUDGET_CATS[0]);
  const [budgetLimit, setBudgetLimit] = useState('');

  // Count-up animation
  const countAnim  = useRef(new Animated.Value(0)).current;
  const [displayed, setDisplayed] = useState(0);
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);

  useEffect(() => {
    const id = countAnim.addListener(({ value }) => setDisplayed(value));
    return () => countAnim.removeListener(id);
  }, []);

  useEffect(() => {
    if (step === 1) {
      countAnim.setValue(0);
      Animated.timing(countAnim, {
        toValue:         netWorth,
        duration:        2200,
        easing:          Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        trackNetWorthRevealed(netWorth);
      });
    }
  }, [step]);

  function finish() {
    trackOnboardingCompleted();
    resetAllTutorials();
    setHasSeenNetWorthOnboarding(true);
  }

  function skipFrom(s: Step) {
    trackOnboardingAbandoned((['accounts', 'networth', 'budget', 'notifications'] as const)[s]);
    finish();
  }

  function advance() {
    const labels = ['accounts', 'networth', 'budget', 'notifications'] as const;
    trackOnboardingStepCompleted(labels[step]);
    if (step === 0 && accounts.length === 0) {
      setStep(2); // skip net worth reveal when no accounts added
    } else if (step < 3) {
      setStep((step + 1) as Step);
    } else {
      finish();
    }
  }

  // ── Step 0 helpers ──────────────────────────────────────────────────────────

  const parsedBalance = parseFloat(acctBalance.replace(/[^0-9.]/g, '')) || 0;
  const canAddAccount = acctName.trim().length > 0 && parsedBalance > 0;

  async function handleAddAccount() {
    if (!canAddAccount || saving) return;
    setSaving(true);
    setFormError(null);
    try {
      await createAsset({
        name:     acctName.trim(),
        category: selectedType.category,
        balance:  parsedBalance,
      });
      setAccounts(prev => [...prev, {
        id:       Math.random().toString(),
        name:     acctName.trim(),
        balance:  parsedBalance,
        icon:     selectedType.icon,
        category: selectedType.category,
      }]);
      setAcctName('');
      setAcctBalance('');
      setShowForm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save account.');
    } finally {
      setSaving(false);
    }
  }

  // ── Step 2 helpers ──────────────────────────────────────────────────────────

  const parsedLimit = parseFloat(budgetLimit.replace(/[^0-9.]/g, '')) || 0;

  async function handleSetBudget() {
    if (!parsedLimit || saving) return;
    setSaving(true);
    try {
      await updateBudgetLimit(budgetCat.label, budgetCat.icon, parsedLimit, budgetCat.color);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      advance();
    } catch {
      // non-fatal — skip to next step
      advance();
    } finally {
      setSaving(false);
    }
  }

  // ── Step 3 helpers ──────────────────────────────────────────────────────────

  async function handleEnableReminders() {
    // Request OS permission first — this shows the system dialog.
    // syncDailyReminder silently fails without granted permission.
    await requestPermissionsAndGetToken();
    setEveningReminderEnabled(true);
    try { await syncDailyReminder(true); } catch { /* best-effort */ }
    finish();
  }

  // ─── Progress dots ──────────────────────────────────────────────────────────

  function ProgressDots() {
    return (
      <View style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'center' }}>
        {([0, 1, 2, 3] as Step[]).map(i => (
          <View
            key={i}
            style={{
              width:         i === step ? 20 : 8,
              height:        8,
              borderRadius:  4,
              backgroundColor: i <= step ? colors.accent.primary : colors.bg.surfaceMuted,
            }}
          />
        ))}
      </View>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Step 0: Add Accounts ──────────────────────────────────────────── */}
      {step === 0 && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: topPad + spacing[4], paddingBottom: btmPad + spacing[4], paddingHorizontal: spacing[5] }}
          >
            <ProgressDots />

            <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[5], lineHeight: 40 }}>
              What accounts{'\n'}do you have?
            </Text>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2], marginBottom: spacing[5] }}>
              Add your balances to see your real net worth.
            </Text>

            {/* Account type chips */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] }}>
              {ACCOUNT_TYPES.map(t => (
                <Pressable
                  key={t.key}
                  onPress={() => { setSelectedType(t); setShowForm(true); Haptics.selectionAsync(); }}
                  style={({ pressed }) => ({
                    flexDirection:   'row',
                    alignItems:      'center',
                    gap:             6,
                    paddingHorizontal: spacing[3],
                    paddingVertical:   spacing[2],
                    borderRadius:    borderRadius.full,
                    backgroundColor: selectedType.key === t.key && showForm
                      ? colors.accent.primary
                      : colors.bg.surface,
                    borderWidth: 1,
                    borderColor: selectedType.key === t.key && showForm
                      ? colors.accent.primary
                      : colors.border.subtle,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontSize: 16 }}>{t.icon}</Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: selectedType.key === t.key && showForm ? '#fff' : colors.text.secondary }}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Inline add form */}
            {showForm && (
              <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4], marginBottom: spacing[4] }]}>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 0.8, marginBottom: spacing[2] }}>
                  {selectedType.icon} {selectedType.label.toUpperCase()}
                </Text>

                <Text style={{ fontSize: 11, letterSpacing: 1, color: colors.text.muted, fontFamily: fontFamily.semiBold, marginBottom: 6 }}>NAME</Text>
                <View style={{ backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: acctName ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[3], height: 48, justifyContent: 'center', marginBottom: spacing[3] }}>
                  <TextInput
                    value={acctName}
                    onChangeText={setAcctName}
                    placeholder={`e.g. My ${selectedType.label} Account`}
                    placeholderTextColor={colors.text.muted}
                    autoFocus
                    returnKeyType="next"
                    style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary, padding: 0 }}
                  />
                </View>

                <Text style={{ fontSize: 11, letterSpacing: 1, color: colors.text.muted, fontFamily: fontFamily.semiBold, marginBottom: 6 }}>CURRENT BALANCE</Text>
                <View style={{ backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: parsedBalance > 0 ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[3], height: 56, flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] }}>
                  <Text style={{ fontSize: fontSize.headingSm, color: colors.text.muted, marginRight: 4 }}>{symbol}</Text>
                  <TextInput
                    value={acctBalance}
                    onChangeText={v => {
                      const c = v.replace(/[^0-9.]/g, '');
                      if (c.split('.').length <= 2) setAcctBalance(c);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.text.muted}
                    returnKeyType="done"
                    onSubmitEditing={handleAddAccount}
                    style={{ flex: 1, fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, padding: 0 }}
                  />
                </View>

                {formError && (
                  <Text style={{ fontSize: fontSize.bodySm, color: colors.expense, marginBottom: spacing[2] }}>{formError}</Text>
                )}

                <View style={{ flexDirection: 'row', gap: spacing[3] }}>
                  <Pressable
                    onPress={() => { setShowForm(false); setAcctName(''); setAcctBalance(''); setFormError(null); }}
                    style={({ pressed }) => ({ flex: 1, height: 44, borderRadius: borderRadius.button, backgroundColor: colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.secondary }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAddAccount}
                    disabled={!canAddAccount || saving}
                    style={({ pressed }) => ({ flex: 1, height: 44, borderRadius: borderRadius.button, backgroundColor: canAddAccount && !saving ? (pressed ? colors.accent.pressed : colors.accent.primary) : colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center' })}
                  >
                    {saving
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: canAddAccount ? '#fff' : colors.text.muted }}>Add Account</Text>}
                  </Pressable>
                </View>
              </View>
            )}

            {/* Added accounts list */}
            {accounts.length > 0 && (
              <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, overflow: 'hidden', marginBottom: spacing[4] }]}>
                {accounts.map((a, i) => (
                  <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', padding: spacing[4], borderBottomWidth: i < accounts.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.border.subtle }}>
                    <Text style={{ fontSize: 20, marginRight: spacing[3] }}>{a.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>{a.name}</Text>
                    </View>
                    <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.bold, color: colors.income }}>{fmt(a.balance)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* CTA */}
            <Pressable
              onPress={advance}
              style={({ pressed }) => ({ height: 54, borderRadius: borderRadius.button, backgroundColor: pressed ? colors.accent.pressed : colors.accent.primary, alignItems: 'center', justifyContent: 'center', marginTop: spacing[2] })}
            >
              <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: '#fff' }}>
                {accounts.length > 0 ? 'Continue →' : "Continue →"}
              </Text>
            </Pressable>

            <Pressable onPress={() => skipFrom(0)} style={{ marginTop: spacing[4], alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
                Skip for now
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── Step 1: Net Worth Reveal ───────────────────────────────────────── */}
      {step === 1 && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[6] }}>
          <ProgressDots />

          <View style={{ alignItems: 'center', marginTop: spacing[8] }}>
            <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 2, marginBottom: spacing[3] }}>
              YOUR NET WORTH
            </Text>

            <Text style={{ fontSize: 56, fontFamily: fontFamily.bold, color: netWorth >= 0 ? colors.income : colors.expense, lineHeight: 68 }}>
              {symbol}{Math.round(displayed).toLocaleString()}
            </Text>

            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', marginTop: spacing[3], lineHeight: 24 }}>
              {netWorth > 0
                ? "You're building real wealth. 🎯"
                : netWorth < 0
                  ? "Every peso saved is progress. You've got this."
                  : "Add accounts to start tracking your net worth."}
            </Text>

            {netWorth !== 0 && (
              <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, textAlign: 'center', marginTop: spacing[5] }}>
                "Your net worth is your financial scoreboard."
              </Text>
            )}
          </View>

          <View style={{ position: 'absolute', bottom: btmPad + spacing[5], left: spacing[5], right: spacing[5] }}>
            <Pressable
              onPress={advance}
              style={({ pressed }) => ({ height: 54, borderRadius: borderRadius.button, backgroundColor: pressed ? colors.accent.pressed : colors.accent.primary, alignItems: 'center', justifyContent: 'center' })}
            >
              <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: '#fff' }}>
                Awesome, let's continue →
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Step 2: First Budget ──────────────────────────────────────────── */}
      {step === 2 && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: topPad + spacing[4], paddingBottom: btmPad + spacing[4], paddingHorizontal: spacing[5] }}
          >
            <ProgressDots />

            <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[5], lineHeight: 40 }}>
              Set a budget{'\n'}to stay on track
            </Text>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2], marginBottom: spacing[5] }}>
              Pick a category and set a monthly spending limit.
            </Text>

            {/* Category grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[5] }}>
              {BUDGET_CATS.map(cat => (
                <Pressable
                  key={cat.label}
                  onPress={() => { setBudgetCat(cat); Haptics.selectionAsync(); }}
                  style={({ pressed }) => ({
                    flexDirection:   'row',
                    alignItems:      'center',
                    gap:             6,
                    paddingHorizontal: spacing[3],
                    paddingVertical:   spacing[2],
                    borderRadius:    borderRadius.full,
                    backgroundColor: budgetCat.label === cat.label ? `${cat.color}22` : colors.bg.surface,
                    borderWidth: 1.5,
                    borderColor: budgetCat.label === cat.label ? cat.color : colors.border.subtle,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: budgetCat.label === cat.label ? cat.color : colors.text.secondary }}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Limit input */}
            <Text style={{ fontSize: 11, letterSpacing: 1, color: colors.text.muted, fontFamily: fontFamily.semiBold, marginBottom: spacing[2] }}>
              MONTHLY LIMIT FOR {budgetCat.label.toUpperCase()}
            </Text>
            <View style={{ backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: parsedLimit > 0 ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], height: 64, flexDirection: 'row', alignItems: 'center', marginBottom: spacing[5] }}>
              <Text style={{ fontSize: fontSize.headingMd, color: colors.text.muted, marginRight: 6 }}>{symbol}</Text>
              <TextInput
                value={budgetLimit}
                onChangeText={v => {
                  const c = v.replace(/[^0-9.]/g, '');
                  if (c.split('.').length <= 2) setBudgetLimit(c);
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.text.muted}
                returnKeyType="done"
                style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, padding: 0 }}
              />
            </View>

            <Pressable
              onPress={handleSetBudget}
              disabled={!parsedLimit || saving}
              style={({ pressed }) => ({ height: 54, borderRadius: borderRadius.button, backgroundColor: parsedLimit && !saving ? (pressed ? colors.accent.pressed : colors.accent.primary) : colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center' })}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: parsedLimit ? '#fff' : colors.text.muted }}>
                    Set Budget →
                  </Text>}
            </Pressable>

            <Pressable onPress={() => { skipFrom(2); }} style={{ marginTop: spacing[4], alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
                Skip for now
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── Step 3: Notifications ─────────────────────────────────────────── */}
      {step === 3 && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[6] }}>
          <ProgressDots />

          <View style={{ alignItems: 'center', marginTop: spacing[8] }}>
            <Text style={{ fontSize: 56, marginBottom: spacing[4] }}>🔔</Text>
            <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, textAlign: 'center', lineHeight: 40 }}>
              Stay on top{'\n'}of your finances
            </Text>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', marginTop: spacing[3], lineHeight: 24 }}>
              Get a daily reminder at 8:30 PM to log your expenses. Takes 30 seconds, keeps your budget accurate.
            </Text>
          </View>

          <View style={{ position: 'absolute', bottom: btmPad + spacing[5], left: spacing[5], right: spacing[5] }}>
            <Pressable
              onPress={handleEnableReminders}
              style={({ pressed }) => ({ height: 54, borderRadius: borderRadius.button, backgroundColor: pressed ? colors.accent.pressed : colors.accent.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[3] })}
            >
              <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: '#fff' }}>
                Enable Reminders
              </Text>
            </Pressable>

            <Pressable onPress={finish} style={{ alignItems: 'center', paddingVertical: spacing[2] }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
                Not now
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
