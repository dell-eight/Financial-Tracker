import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../../hooks/ui/useTheme';
import { useSavingsGoals, SAVINGS_GOALS_KEY } from '../../../hooks/queries/useSavingsGoals';
import { ASSETS_KEY } from '../../../hooks/queries/useNetWorth';
import { getContributions, deleteSavingsGoal, type Contribution } from '../../../services/finance.service';
import type { WealthStackParamList } from '../../../navigation/types';
import { useCurrency } from '../../../utils/currency';
import { LoadingOverlay } from '../../../components/common/LoadingOverlay';
import type { SavingsGoal } from '../../../types/models';
import { useScreenAnimation } from '../../../hooks/ui/useScreenAnimation';

type Props = StackScreenProps<WealthStackParamList, 'GoalDetail'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── CircleProgress ───────────────────────────────────────────────────────────

function CircleProgress({ ratio, color, size = 160, emoji, strokeWidth = 12 }: {
  ratio:       number;
  color:       string;
  size?:       number;
  emoji:       string;
  strokeWidth?: number;
}) {
  const theme  = useTheme();
  const { colors, fontSize, fontFamily } = theme;
  const r      = (size - strokeWidth) / 2;
  const circ   = 2 * Math.PI * r;
  const filled = Math.min(ratio, 1) * circ;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background track */}
      <View style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2, borderWidth: strokeWidth, borderColor: `${color}22` }]} />
      {/* Filled arc via rotation trick — use a single View clipped */}
      {/* Simplified approach: gradient border effect */}
      <View style={{
        position:    'absolute',
        width:       size,
        height:      size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: 'transparent',
        borderTopColor: ratio > 0 ? color : 'transparent',
        borderRightColor: ratio > 0.25 ? color : 'transparent',
        borderBottomColor: ratio > 0.5 ? color : 'transparent',
        borderLeftColor: ratio > 0.75 ? color : 'transparent',
        transform: [{ rotate: '-45deg' }],
      }} />
      {/* Center content */}
      <Text style={{ fontSize: 40, lineHeight: 48 }}>{emoji}</Text>
      <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: 2 }}>
        {Math.round(ratio * 100)}%
      </Text>
    </View>
  );
}

// ─── ContributionRow ──────────────────────────────────────────────────────────

function ContributionRow({ c, isLast }: { c: Contribution; isLast: boolean }) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const { fmt } = useCurrency();
  return (
    <View style={[cStyles.row, { paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle }]}>
      <View style={[cStyles.dot, { backgroundColor: colors.income + '30', borderRadius: borderRadius.full, width: 32, height: 32 }]}>
        <Text style={{ fontSize: 14 }}>💰</Text>
      </View>
      <View style={{ flex: 1, marginLeft: spacing[3] }}>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>{c.note}</Text>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>{c.date}</Text>
      </View>
      <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.income }}>
        +{fmt(c.amount)}
      </Text>
    </View>
  );
}

const cStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { alignItems: 'center', justifyContent: 'center' },
});

// ─── GoalDetailScreen ─────────────────────────────────────────────────────────

export function GoalDetailScreen({ navigation, route }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmtCompact: fmtShort } = useCurrency();
  const queryClient = useQueryClient();
  const { goalId }  = route.params;
  const [deleting, setDeleting] = useState(false);
  const [headerStyle, progressStyle, listStyle] = useScreenAnimation(3);

  const { data: goals } = useSavingsGoals();
  const goal = useMemo<SavingsGoal | undefined>(
    () => goals?.find(g => g.id === goalId),
    [goals, goalId],
  );

  const { data: contributions = [] } = useQuery<Contribution[]>({
    queryKey: ['contributions', goalId],
    queryFn:  () => getContributions(goalId),
    staleTime: 30_000,
  });

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  if (!goal) {
    return (
      <View style={[s.screen, { backgroundColor: colors.bg.base }]}>
        <StatusBar style={theme.statusBarStyle} />
        <View style={{ paddingTop: topPad + spacing[2], paddingHorizontal: spacing[5] }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
          </Pressable>
        </View>
        <View style={s.centered}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: spacing[3] }}>
            Goal not found
          </Text>
        </View>
      </View>
    );
  }

  const ratio       = goal.targetAmount > 0 ? goal.savedAmount / goal.targetAmount : 0;
  const remaining   = Math.max(goal.targetAmount - goal.savedAmount, 0);
  const isComplete  = goal.savedAmount >= goal.targetAmount;
  const monthlyEst  = remaining > 0 ? Math.ceil(remaining / 5000) : 0;

  function handleDelete() {
    const goalName = goal?.name ?? '';
    Alert.alert('Delete Goal', `Delete "${goalName}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setDeleting(true);
          try {
            await deleteSavingsGoal(goalId);
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: SAVINGS_GOALS_KEY }),
              queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
              queryClient.invalidateQueries({ queryKey: ['accounts'] }),
            ]);
          } catch {
            // navigate back regardless
          } finally {
            setDeleting(false);
          }
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ── */}
      <Animated.View style={[s.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }, headerStyle]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Goal Detail
        </Text>
        <Pressable onPress={handleDelete} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.expense }}>Delete</Text>
        </Pressable>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[6] }}>

        {/* ── Hero ── */}
        <Animated.View style={[s.hero, { paddingVertical: spacing[6], paddingHorizontal: spacing[5] }, progressStyle]}>
          <CircleProgress ratio={ratio} color={goal.color} emoji={goal.emoji} />

          <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[4], textAlign: 'center' }}>
            {goal.name}
          </Text>

          {isComplete && (
            <View style={[s.badge, { backgroundColor: colors.income + '20', borderRadius: borderRadius.full, marginTop: spacing[2], paddingHorizontal: spacing[3], paddingVertical: spacing[1] }]}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.income }}>🎉 Goal Achieved!</Text>
            </View>
          )}

          {/* Amount row */}
          <View style={[s.amtRow, { marginTop: spacing[5] }]}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontFamily: fontFamily.bold, color: colors.text.primary, letterSpacing: -0.4 }}>
                {fmtShort(goal.savedAmount)}
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>Saved</Text>
            </View>
            <View style={{ width: 1, height: 36, backgroundColor: colors.border.subtle }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontFamily: fontFamily.bold, color: colors.text.secondary, letterSpacing: -0.4 }}>
                {fmtShort(goal.targetAmount)}
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>Target</Text>
            </View>
            <View style={{ width: 1, height: 36, backgroundColor: colors.border.subtle }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontFamily: fontFamily.bold, color: isComplete ? colors.income : colors.expense, letterSpacing: -0.4 }}>
                {isComplete ? '✓' : fmtShort(remaining)}
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                {isComplete ? 'Complete' : 'Left'}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={{ width: '100%', marginTop: spacing[4] }}>
            <View style={[s.track, { backgroundColor: colors.bg.surfaceMuted, borderRadius: 99 }]}>
              <View style={[s.fill, { width: `${Math.min(ratio * 100, 100)}%`, backgroundColor: goal.color, borderRadius: 99 }]} />
            </View>
            {!isComplete && monthlyEst > 0 && (
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2], textAlign: 'center' }}>
                ~{monthlyEst} months at {fmtShort(5000)}/mo
              </Text>
            )}
          </View>
        </Animated.View>

        {/* ── CTA Buttons ── */}
        <View style={[s.ctaRow, { paddingHorizontal: spacing[5], gap: spacing[3], marginBottom: spacing[5] }]}>
          <Pressable
            onPress={() => navigation.push('AddContribution', { goalId })}
            style={({ pressed }) => [
              s.ctaBtn,
              { backgroundColor: pressed ? colors.accent.pressed : colors.accent.primary, borderRadius: borderRadius.button, flex: 1, height: 48 },
            ]}
          >
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>+ Add Money</Text>
          </Pressable>
          {isComplete && (
            <Pressable
              onPress={() => navigation.push('GoalAchieved', { goalId })}
              style={({ pressed }) => [
                s.ctaBtn,
                { backgroundColor: pressed ? `${colors.income}cc` : colors.income, borderRadius: borderRadius.button, flex: 1, height: 48 },
              ]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>🎉 Celebrate</Text>
            </Pressable>
          )}
        </View>

        {/* ── Contribution history ── */}
        <Animated.View style={listStyle}>
          <View style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}>
            <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
              Contribution History
            </Text>
          </View>
          {contributions.length === 0 ? (
            <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], padding: spacing[5], alignItems: 'center' }]}>
              <Text style={{ fontSize: 32, marginBottom: spacing[2] }}>💰</Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center' }}>
                {'No contributions yet. Tap "+ Add Money" to start saving!'}
              </Text>
            </View>
          ) : (
            <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], overflow: 'hidden' }]}>
              {contributions.map((c, i) => (
                <ContributionRow key={c.id} c={c} isLast={i === contributions.length - 1} />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
      <LoadingOverlay visible={deleting} message="Deleting goal…" />
    </View>
  );
}

const s = StyleSheet.create({
  screen:  { flex: 1 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero:    { alignItems: 'center' },
  badge:   {},
  amtRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', gap: 8 },
  track:   { height: 8, width: '100%', overflow: 'hidden' },
  fill:    { position: 'absolute', left: 0, top: 0, height: '100%' },
  ctaRow:  { flexDirection: 'row' },
  ctaBtn:  { alignItems: 'center', justifyContent: 'center' },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default GoalDetailScreen;
