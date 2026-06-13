import React, { useEffect, useMemo, useState } from 'react';
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
import { getCategoryBgColor } from '../../theme';
import type { BudgetStackParamList } from '../../navigation/types';
import type { Budget } from '../../types/models';

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
  budget,
  value,
  onChange,
}: {
  budget:   Budget;
  value:    string;
  onChange: (v: string) => void;
}) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontFamily, fontSize } = theme;
  const catColor = theme.categoryColors[budget.category] ?? colors.accent.primary;
  const catBg    = getCategoryBgColor(budget.category);

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
        <Text style={{ fontSize: 18, lineHeight: 24 }}>{budget.icon}</Text>
      </View>
      <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary, marginLeft: spacing[3] }} numberOfLines={1}>
        {budget.label}
      </Text>
      <View style={[catRowStyles.inputWrap, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.input, borderWidth: 1, borderColor: value ? catColor : colors.border.subtle, paddingHorizontal: spacing[2], height: 40, width: 110 }]}>
        <Text style={{ fontSize: fontSize.bodyMd, color: colors.text.muted }}>₱</Text>
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

  const { data: budgets } = useBudgets();

  const [step,     setStep]     = useState(1);
  const [income,   setIncome]   = useState('4800');
  const [allocMap, setAllocMap] = useState<Record<string, string>>({});

  // Initialise allocations from live budget data
  useEffect(() => {
    if (budgets && Object.keys(allocMap).length === 0) {
      const initial: Record<string, string> = {};
      for (const b of budgets) initial[b.id] = String(b.limit);
      setAllocMap(initial);
    }
  }, [budgets]);

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

  function handleSave() {
    if (!budgets) return;
    const updated = budgets.map(b => ({
      ...b,
      limit: parseFloat(allocMap[b.id] ?? '0') || b.limit,
    }));
    queryClient.setQueryData(BUDGETS_KEY, updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  }

  function updateAlloc(id: string, value: string) {
    setAllocMap(prev => ({ ...prev, [id]: value }));
  }

  // ── Step-local style sheets (must be declared before the JSX that uses them) ──
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

  // ── Step 1: Income ────────────────────────────────────────────────────────────
  const step1 = (
    <View style={{ flex: 1, paddingHorizontal: H_PAD }}>
      <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[6] }}>
        Monthly Income
      </Text>
      <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2], lineHeight: 22 }}>
        Your income helps us suggest realistic budget limits for each category.
      </Text>

      {/* Amount input */}
      <View style={{ alignItems: 'center', marginTop: spacing[8] }}>
        <View style={step1Styles.amtRow}>
          <Text style={{ fontSize: 44, fontFamily: fontFamily.bold, color: income ? colors.income : colors.text.muted, lineHeight: 52, marginRight: 4 }}>
            ₱
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
            The 50/30/20 rule suggests allocating ₱{(parsedIncome * 0.5).toLocaleString('en-PH', { minimumFractionDigits: 0 })} to needs, ₱{(parsedIncome * 0.3).toLocaleString('en-PH', { minimumFractionDigits: 0 })} to wants, and ₱{(parsedIncome * 0.2).toLocaleString('en-PH', { minimumFractionDigits: 0 })} to savings.
          </Text>
        </View>
      )}
    </View>
  );

  // ── Step 2: Category Allocations ──────────────────────────────────────────────
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
              ₱{totalAllocated.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
              of ₱{parsedIncome.toLocaleString('en-PH', { minimumFractionDigits: 0 })} income
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

      {/* Category rows */}
      <View style={{ paddingHorizontal: H_PAD, marginTop: spacing[3] }}>
        {(budgets ?? []).map((budget, i) => (
          <React.Fragment key={budget.id}>
            <CategoryRow
              budget={budget}
              value={allocMap[budget.id] ?? ''}
              onChange={v => updateAlloc(budget.id, v)}
            />
            {i < (budgets?.length ?? 0) - 1 && (
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border.subtle }} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  // ── Step 3: Review ────────────────────────────────────────────────────────────
  const step3 = (
    <View style={{ flex: 1, paddingHorizontal: H_PAD }}>
      <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[6] }}>
        Review Budget
      </Text>
      <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2] }}>
        Confirm your monthly budget plan.
      </Text>

      {/* Summary card */}
      <View style={[step3Styles.summaryCard, shadows.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[5], marginTop: spacing[5] }]}>
        <View style={[step3Styles.summaryRow, { paddingBottom: spacing[4], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle }]}>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.muted }}>Monthly Income</Text>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.bold, color: colors.income }}>
            ₱{parsedIncome.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={[step3Styles.summaryRow, { paddingVertical: spacing[4], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle }]}>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.muted }}>Total Allocated</Text>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.bold, color: colors.text.primary }}>
            ₱{totalAllocated.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={[step3Styles.summaryRow, { paddingTop: spacing[4] }]}>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.muted }}>Unallocated</Text>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.bold, color: parsedIncome - totalAllocated >= 0 ? colors.income : colors.expense }}>
            ₱{Math.abs(parsedIncome - totalAllocated).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Category breakdown */}
      <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginTop: spacing[4], overflow: 'hidden' }]}>
        {(budgets ?? []).map((b, i) => {
          const alloc    = parseFloat(allocMap[b.id] ?? '0') || 0;
          const catColor = theme.categoryColors[b.category] ?? colors.accent.primary;
          return (
            <View
              key={b.id}
              style={[
                step3Styles.catRow,
                {
                  paddingHorizontal: spacing[4],
                  paddingVertical:   spacing[3],
                  borderBottomWidth: i < (budgets?.length ?? 0) - 1 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: colors.border.subtle,
                },
              ]}
            >
              <Text style={{ fontSize: 16, marginRight: spacing[3] }}>{b.icon}</Text>
              <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }} numberOfLines={1}>
                {b.label}
              </Text>
              {alloc > 0 ? (
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: catColor }}>
                  ₱{alloc.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                </Text>
              ) : (
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
                  No limit
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  // ── Footer buttons ────────────────────────────────────────────────────────────
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
      <StatusBar style="light" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: H_PAD, paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => step > 1 ? setStep(s => s - 1) : navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>
            {step > 1 ? '← Back' : 'Cancel'}
          </Text>
        </Pressable>
        <StepIndicator current={step} total={3} />
        <View style={{ minWidth: 60 }} />
      </View>

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

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingHorizontal: H_PAD, paddingBottom: btmPad + spacing[3], paddingTop: spacing[3], borderTopColor: colors.border.subtle }]}>
        <Pressable
          onPress={handleNext}
          disabled={!canContinue}
          style={({ pressed }) => [
            styles.continueBtn,
            {
              backgroundColor: !canContinue
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
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: canContinue ? '#FFFFFF' : colors.text.muted }}>
            {step < 3 ? 'Continue' : 'Save Budget'}
          </Text>
        </Pressable>
      </View>
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
