import React, { useEffect, useMemo, useState } from 'react';
import Animated from 'react-native-reanimated';
import { useScreenAnimation } from '../../hooks/ui/useScreenAnimation';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useBudgets, BUDGETS_KEY } from '../../hooks/queries/useBudgets';
import { useDashboard } from '../../hooks/queries/useDashboard';
import { updateBudgetLimit } from '../../services/finance.service';
import { getCategoryBgColor } from '../../theme';
import type { CategoryKey } from '../../theme';
import { EXPENSE_CATEGORIES } from '../../constants/categories';
import type { BudgetStackParamList } from '../../navigation/types';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useCurrency, formatFull } from '../../utils/currency';
import { useAppStore } from '../../store/app.store';

type Props = StackScreenProps<BudgetStackParamList, 'BudgetSetupWizard'>;

// ─── StepIndicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontFamily, fontSize } = theme;

  return (
    <View style={stepStyles.row}>
      {Array.from({ length: total }).map((_, i) => {
        const done   = i + 1 < current;
        const active = i + 1 === current;
        return (
          <React.Fragment key={i}>
            <View style={[
              stepStyles.dot,
              {
                width:           active ? 28 : 10,
                height:          10,
                borderRadius:    borderRadius.full,
                backgroundColor: active
                  ? colors.accent.primary
                  : done
                    ? colors.accent.secondary
                    : colors.bg.surfaceMuted,
              },
            ]} />
            {i < total - 1 && (
              <View style={[stepStyles.line, { backgroundColor: done ? colors.accent.secondary : colors.bg.surfaceMuted }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:  {},
  line: { flex: 1, height: 2, borderRadius: 1 },
});

// ─── CategoryRow ──────────────────────────────────────────────────────────────

function CategoryRow({
  catKey,
  label,
  emoji,
  value,
  onChange,
}: {
  catKey:   string;
  label:    string;
  emoji:    string;
  value:    string;
  onChange: (v: string) => void;
}) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontFamily, fontSize } = theme;
  const { symbol } = useCurrency();
  const catColor = (theme.categoryColors as Record<string, string>)[catKey] ?? colors.accent.primary;
  const catBg    = getCategoryBgColor(catKey as CategoryKey);

  function handleChange(text: string) {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts   = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] !== undefined && parts[1].length > 2) return;
    onChange(cleaned);
  }

  return (
    <View style={[catRowStyles.row, { paddingVertical: spacing[3] }]}>
      <View style={[catRowStyles.icon, { backgroundColor: catBg, borderRadius: borderRadius.full, width: 40, height: 40 }]}>
        <Text style={{ fontSize: 18, lineHeight: 24 }}>{emoji}</Text>
      </View>
      <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary, marginLeft: spacing[3] }} numberOfLines={1}>
        {label}
      </Text>
      <View style={[catRowStyles.inputWrap, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.input, borderWidth: 1, borderColor: value ? catColor : colors.border.subtle, paddingHorizontal: spacing[2], height: 40, width: 110 }]}>
        <Text style={{ fontSize: fontSize.bodyMd, color: colors.text.muted }}>{symbol}</Text>
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder="0"
          placeholderTextColor={colors.text.muted}
          keyboardType="decimal-pad"
          style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, padding: 0, marginLeft: 2 }}
        />
      </View>
    </View>
  );
}

const catRowStyles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center' },
  icon:      { alignItems: 'center', justifyContent: 'center' },
  inputWrap: { flexDirection: 'row', alignItems: 'center' },
});

// ─── BudgetSetupWizard ────────────────────────────────────────────────────────

export function BudgetSetupWizard({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();
  const { symbol, fmt } = useCurrency();

  // Existing budgets — used only to pre-fill limits
  const { data: existingBudgets } = useBudgets();
  const { data: dashboard }       = useDashboard();

  const [step,     setStep]     = useState(1);
  const [income,   setIncome]   = useState('');
  // allocMap key = category key (e.g. 'food', 'transport')
  const [allocMap, setAllocMap] = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Pre-fill income from dashboard monthly income (runs once when data arrives)
  useEffect(() => {
    if (dashboard?.monthlyIncome && dashboard.monthlyIncome > 0 && income === '') {
      setIncome(String(dashboard.monthlyIncome));
    }
  }, [dashboard]);

  // Pre-fill from existing Supabase budgets (match by label)
  useEffect(() => {
    if (existingBudgets && existingBudgets.length > 0 && Object.keys(allocMap).length === 0) {
      const initial: Record<string, string> = {};
      for (const b of existingBudgets) {
        // Match existing budget to a category by key
        const cat = EXPENSE_CATEGORIES.find(c => c.label.toLowerCase() === b.label.toLowerCase() || c.key === b.category);
        if (cat && b.limit > 0) initial[cat.key] = String(b.limit);
      }
      if (Object.keys(initial).length > 0) setAllocMap(initial);
    }
  }, [existingBudgets]);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;
  const H_PAD  = spacing[5];

  const parsedIncome    = parseFloat(income) || 0;
  const totalAllocated  = useMemo(
    () => Object.values(allocMap).reduce((s, v) => s + (parseFloat(v) || 0), 0),
    [allocMap],
  );
  const allocPct        = parsedIncome > 0 ? Math.round((totalAllocated / parsedIncome) * 100) : 0;
  const canStep1        = parsedIncome > 0;
  const canStep2        = totalAllocated > 0;

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const toSave = EXPENSE_CATEGORIES.filter(c => allocMap[c.key] && parseFloat(allocMap[c.key]) > 0);
      for (const c of toSave) {
        await updateBudgetLimit(c.label, c.emoji, parseFloat(allocMap[c.key]), c.color);
      }
      await queryClient.invalidateQueries({ queryKey: [...BUDGETS_KEY] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save. Please try again.');
      setSaving(false);
    }
  }

  function updateAlloc(key: string, value: string) {
    setAllocMap(prev => ({ ...prev, [key]: value }));
  }

  const [headerStyle, contentStyle, footerStyle] = useScreenAnimation(3);

  // ── Step-local style sheets ────────────────────────────────────────────────
  const step1Styles = StyleSheet.create({
    amtRow:   { flexDirection: 'row', alignItems: 'center' },
    hintCard: {},
  });

  const step2Styles = StyleSheet.create({
    totalRow: { flexDirection: 'row', alignItems: 'center' },
    track:    { height: 6, overflow: 'hidden' },
    fill:     { position: 'absolute', left: 0, top: 0, height: '100%' },
  });

  const step3Styles = StyleSheet.create({
    summaryCard: {},
    summaryRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    catRow:      { flexDirection: 'row', alignItems: 'center' },
  });

  // ── Step 1: Income ─────────────────────────────────────────────────────────
  const step1 = (
    <View style={{ flex: 1, paddingHorizontal: H_PAD }}>
      <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[6] }}>
        Monthly Income
      </Text>
      <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2], lineHeight: 22 }}>
        Your income helps us suggest realistic budget limits for each category.
      </Text>

      <View style={{ alignItems: 'center', marginTop: spacing[8] }}>
        <View style={step1Styles.amtRow}>
          <Text style={{ fontSize: 44, fontFamily: fontFamily.bold, color: income ? colors.income : colors.text.muted, lineHeight: 52, marginRight: 4 }}>
            {symbol}
          </Text>
          <TextInput
            value={income}
            onChangeText={v => {
              const c = v.replace(/[^0-9.]/g, '');
              if (c.split('.').length <= 2) setIncome(c);
            }}
            placeholder="0.00"
            placeholderTextColor={colors.text.muted}
            keyboardType="decimal-pad"
            autoFocus
            style={{ fontSize: 44, fontFamily: fontFamily.bold, color: colors.text.primary, minWidth: 100, padding: 0 }}
          />
        </View>
        <View style={{ width: 160, height: 2, backgroundColor: income ? colors.income : colors.border.subtle, borderRadius: 1, marginTop: spacing[2] }} />
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[3] }}>
          per month (after tax)
        </Text>
      </View>

      {parsedIncome > 0 && (
        <View style={[step1Styles.hintCard, { backgroundColor: colors.incomeBg, borderRadius: borderRadius.card, padding: spacing[4], marginTop: spacing[6] }]}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.income }}>
            💡 Budget tip
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary, marginTop: 4, lineHeight: 20 }}>
            The 50/30/20 rule suggests allocating {fmt(parsedIncome * 0.5)} to needs, {fmt(parsedIncome * 0.3)} to wants, and {fmt(parsedIncome * 0.2)} to savings.
          </Text>
        </View>
      )}
    </View>
  );

  // ── Step 2: Category Allocations ───────────────────────────────────────────
  const step2 = (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: H_PAD }}>
        <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[6] }}>
          Allocate Budget
        </Text>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2] }}>
          Set a spending limit for each category.
        </Text>

        {/* Running total */}
        <View style={[step2Styles.totalRow, { marginTop: spacing[4], backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
              Allocated
            </Text>
            <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: allocPct > 100 ? colors.expense : colors.text.primary, letterSpacing: -0.3, marginTop: 2 }}>
              {fmt(totalAllocated)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
              of {fmt(parsedIncome)} income
            </Text>
            <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: allocPct > 100 ? colors.expense : colors.income, letterSpacing: -0.3, marginTop: 2 }}>
              {allocPct}%
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={[step2Styles.track, { marginTop: spacing[3], backgroundColor: colors.bg.surfaceMuted, borderRadius: 99 }]}>
          <View style={[step2Styles.fill, { width: `${Math.min(allocPct, 100)}%`, backgroundColor: allocPct > 100 ? colors.expense : colors.accent.primary, borderRadius: 99 }]} />
        </View>
      </View>

      {/* Category rows — all expense categories */}
      <View style={{ paddingHorizontal: H_PAD, marginTop: spacing[3] }}>
        {EXPENSE_CATEGORIES.map((cat, i) => (
          <React.Fragment key={cat.key}>
            <CategoryRow
              catKey={cat.key}
              label={cat.label}
              emoji={cat.emoji}
              value={allocMap[cat.key] ?? ''}
              onChange={v => updateAlloc(cat.key, v)}
            />
            {i < EXPENSE_CATEGORIES.length - 1 && (
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border.subtle }} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  // ── Step 3: Review ─────────────────────────────────────────────────────────
  const step3 = (
    <View style={{ flex: 1, paddingHorizontal: H_PAD }}>
      <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[6] }}>
        Review Budget
      </Text>
      <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2] }}>
        Confirm your monthly budget plan.
      </Text>

      {/* Summary card */}
      <View style={[shadows.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[5], marginTop: spacing[5] }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing[4], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle }}>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.muted }}>Monthly Income</Text>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.bold, color: colors.income }}>
            {fmt(parsedIncome)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[4], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle }}>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.muted }}>Total Allocated</Text>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.bold, color: colors.text.primary }}>
            {fmt(totalAllocated)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing[4] }}>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.muted }}>Unallocated</Text>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.bold, color: parsedIncome - totalAllocated >= 0 ? colors.income : colors.expense }}>
            {fmt(Math.abs(parsedIncome - totalAllocated))}
          </Text>
        </View>
      </View>

      {/* Category breakdown — only those with a limit set */}
      {EXPENSE_CATEGORIES.filter(c => parseFloat(allocMap[c.key] ?? '0') > 0).length > 0 && (
        <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginTop: spacing[4], overflow: 'hidden' }]}>
          {EXPENSE_CATEGORIES
            .filter(c => parseFloat(allocMap[c.key] ?? '0') > 0)
            .map((c, i, arr) => {
              const alloc    = parseFloat(allocMap[c.key] ?? '0');
              const catColor = (theme.categoryColors as Record<string, string>)[c.key] ?? colors.accent.primary;
              return (
                <View
                  key={c.key}
                  style={{
                    flexDirection:     'row',
                    alignItems:        'center',
                    paddingHorizontal: spacing[4],
                    paddingVertical:   spacing[3],
                    borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: colors.border.subtle,
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: spacing[3] }}>{c.emoji}</Text>
                  <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }} numberOfLines={1}>
                    {c.label}
                  </Text>
                  <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: catColor }}>
                    {fmt(alloc)}
                  </Text>
                </View>
              );
            })}
        </View>
      )}
    </View>
  );

  // ── Footer buttons ─────────────────────────────────────────────────────────
  const canContinue = step === 1 ? canStep1 : step === 2 ? canStep2 : true;

  function handleNext() {
    if (step < 3) {
      Haptics.selectionAsync();
      setStep(s => s + 1);
    } else {
      handleSave();
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.bg.base }]}
    >
      <LoadingOverlay visible={saving} message="Saving budget…" />
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: H_PAD, paddingBottom: spacing[3] }, headerStyle]}>
        <Pressable onPress={() => step > 1 ? setStep(s => s - 1) : navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>
            {step > 1 ? '← Back' : 'Cancel'}
          </Text>
        </Pressable>
        <StepIndicator current={step} total={3} />
        <View style={{ minWidth: 60 }} />
      </Animated.View>

      <Animated.View style={[{ flex: 1 }, contentStyle]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: spacing[4] }}
      >
        {step === 1 && step1}
        {step === 2 && step2}
        {step === 3 && step3}
      </ScrollView>
      </Animated.View>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.footer, { paddingHorizontal: H_PAD, paddingBottom: btmPad + spacing[3], paddingTop: spacing[3], borderTopColor: colors.border.subtle }, footerStyle]}>
        {saveError && step === 3 && (
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.expense, textAlign: 'center', marginBottom: spacing[3] }}>
            {saveError}
          </Text>
        )}
        <Pressable
          onPress={handleNext}
          disabled={!canContinue || saving}
          style={({ pressed }) => [
            styles.continueBtn,
            {
              backgroundColor: !canContinue || saving
                ? colors.bg.surfaceMuted
                : pressed
                  ? colors.accent.pressed
                  : colors.accent.primary,
              borderRadius: borderRadius.button,
              height:       52,
            },
          ]}
          accessibilityRole="button"
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: (canContinue && !saving) ? '#FFFFFF' : colors.text.muted }}>
            {step < 3 ? 'Continue' : 'Save Budget'}
          </Text>
        </Pressable>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footer:      { borderTopWidth: StyleSheet.hairlineWidth },
  continueBtn: { alignItems: 'center', justifyContent: 'center' },
});

export default BudgetSetupWizard;
