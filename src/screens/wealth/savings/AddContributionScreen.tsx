import React, { useMemo, useState } from 'react';
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
import { useTheme } from '../../../hooks/ui/useTheme';
import { useSavingsGoals, SAVINGS_GOALS_KEY } from '../../../hooks/queries/useSavingsGoals';
import type { WealthStackParamList } from '../../../navigation/types';
import type { SavingsGoal } from '../../../types/models';

type Props = StackScreenProps<WealthStackParamList, 'AddContribution'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESETS = [500, 1000, 2000, 5000];

function fmt(n: number): string {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── AddContributionScreen ────────────────────────────────────────────────────

export function AddContributionScreen({ navigation, route }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();
  const { goalId }  = route.params;

  const [amountStr, setAmountStr] = useState('');
  const [note,      setNote]      = useState('');

  const { data: goals } = useSavingsGoals();
  const goal = useMemo<SavingsGoal | undefined>(
    () => goals?.find(g => g.id === goalId),
    [goals, goalId],
  );

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;
  const H_PAD  = spacing[5];

  const parsed     = parseFloat(amountStr) || 0;
  const canSave    = parsed > 0;
  const remaining  = goal ? Math.max(goal.targetAmount - goal.savedAmount, 0) : 0;
  const willFinish = goal ? goal.savedAmount + parsed >= goal.targetAmount : false;

  function setPreset(v: number) {
    Haptics.selectionAsync();
    setAmountStr(String(v));
  }

  function handleSave() {
    if (!canSave || !goal) return;
    const newSaved = goal.savedAmount + parsed;
    queryClient.setQueryData(
      SAVINGS_GOALS_KEY,
      (old: SavingsGoal[] | undefined) =>
        (old ?? []).map(g =>
          g.id === goalId ? { ...g, savedAmount: Math.min(newSaved, g.targetAmount) } : g,
        ),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (willFinish) {
      navigation.replace('GoalAchieved', { goalId });
    } else {
      navigation.goBack();
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.bg.base }]}
    >
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: H_PAD, paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Add Money</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: btmPad + spacing[4] }}
      >
        {/* ── Goal context card ── */}
        {goal && (
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: H_PAD, padding: spacing[4], marginBottom: spacing[5] }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
              <View style={{ backgroundColor: goal.color + '22', borderRadius: borderRadius.full, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22, lineHeight: 28 }}>{goal.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.text.primary }} numberOfLines={1}>
                  {goal.name}
                </Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                  {fmt(goal.savedAmount)} / {fmt(goal.targetAmount)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: goal.color }}>
                  {Math.round((goal.savedAmount / goal.targetAmount) * 100)}%
                </Text>
                <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                  {fmt(remaining)} left
                </Text>
              </View>
            </View>
            {/* Mini progress bar */}
            <View style={{ height: 4, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99, marginTop: spacing[3], overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)}%`, backgroundColor: goal.color, borderRadius: 99 }} />
            </View>
          </View>
        )}

        {/* ── Amount input ── */}
        <View style={{ alignItems: 'center', paddingVertical: spacing[6] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 44, fontFamily: fontFamily.bold, color: parsed > 0 ? colors.income : colors.text.muted, lineHeight: 52, marginRight: 4 }}>
              ₱
            </Text>
            <TextInput
              value={amountStr}
              onChangeText={v => {
                const c = v.replace(/[^0-9.]/g, '');
                if (c.split('.').length <= 2) setAmountStr(c);
              }}
              placeholder="0"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              autoFocus
              style={{ fontSize: 44, fontFamily: fontFamily.bold, color: colors.text.primary, minWidth: 80, padding: 0 }}
            />
          </View>
          <View style={{ width: 160, height: 2, backgroundColor: parsed > 0 ? colors.income : colors.border.subtle, borderRadius: 1, marginTop: spacing[2] }} />

          {willFinish && (
            <View style={{ backgroundColor: colors.income + '15', borderRadius: borderRadius.full, paddingHorizontal: spacing[3], paddingVertical: spacing[1], marginTop: spacing[3] }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.income }}>
                🎉 This will complete your goal!
              </Text>
            </View>
          )}
          {!willFinish && parsed > remaining && remaining > 0 && (
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.warning, marginTop: spacing[2] }}>
              Will be capped at {fmt(remaining)}
            </Text>
          )}
        </View>

        {/* ── Quick presets ── */}
        <View style={[styles.presetRow, { paddingHorizontal: H_PAD, gap: spacing[3], marginBottom: spacing[5] }]}>
          {PRESETS.map(v => {
            const label = v >= 1000 ? `₱${v / 1000}k` : `₱${v}`;
            return (
              <Pressable
                key={v}
                onPress={() => setPreset(v)}
                style={({ pressed }) => [
                  styles.presetBtn,
                  {
                    backgroundColor: parsed === v ? colors.income + '20' : colors.bg.surface,
                    borderRadius:    borderRadius.button,
                    borderWidth:     1,
                    borderColor:     parsed === v ? colors.income : colors.border.subtle,
                    flex:            1,
                    height:          38,
                    opacity:         pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: parsed === v ? colors.income : colors.text.secondary }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Note ── */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: spacing[5] }}>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>
            NOTE (optional)
          </Text>
          <View style={{ backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: note ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], paddingVertical: spacing[3] }}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Monthly savings transfer"
              placeholderTextColor={colors.text.muted}
              returnKeyType="done"
              style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.primary, padding: 0 }}
            />
          </View>
        </View>

        {/* ── Date (read-only) ── */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: spacing[6] }}>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>DATE</Text>
          <View style={{ backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: colors.border.subtle, paddingHorizontal: spacing[4], height: 50, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.secondary }}>
              {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* ── Save button ── */}
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              marginHorizontal: H_PAD,
              backgroundColor: !canSave
                ? colors.bg.surfaceMuted
                : willFinish
                  ? pressed ? colors.income + 'cc' : colors.income
                  : pressed ? colors.accent.pressed : colors.accent.primary,
              borderRadius: borderRadius.button,
              height: 52,
            },
          ]}
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: canSave ? '#FFFFFF' : colors.text.muted }}>
            {willFinish ? '🎉 Complete Goal' : 'Add Contribution'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  presetRow: { flexDirection: 'row' },
  presetBtn: { alignItems: 'center', justifyContent: 'center' },
  saveBtn:   { alignItems: 'center', justifyContent: 'center' },
});

export default AddContributionScreen;
