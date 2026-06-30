import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../../hooks/ui/useTheme';
import { useSavingsGoals } from '../../../hooks/queries/useSavingsGoals';
import { QueryError } from '../../../components/common/QueryError';
import type { WealthStackParamList } from '../../../navigation/types';
import { useCurrency } from '../../../utils/currency';

type Navigation = StackScreenProps<WealthStackParamList, 'WealthMain'>['navigation'];

const addBtn = { paddingHorizontal: 14, paddingVertical: 8 } as const;

export function SavingsTab({ navigation }: { navigation: Navigation }) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { data: goals, isLoading, isError: goalsErr, refetch: refetchGoals } = useSavingsGoals();

  const totalSaved  = useMemo(() => (goals ?? []).reduce((s, g) => s + g.savedAmount,  0), [goals]);
  const totalTarget = useMemo(() => (goals ?? []).reduce((s, g) => s + g.targetAmount, 0), [goals]);
  const overallPct  = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const { fmtCompact: fmtShort } = useCurrency();

  if (goalsErr) {
    return <QueryError onRetry={refetchGoals} />;
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}
    >
      {/* ── Summary hero ── */}
      <View style={[shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5] }]}>
        <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
          Total Saved
        </Text>
        <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[1], letterSpacing: -1 }}>
          {fmtShort(totalSaved)}
        </Text>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
          of {fmtShort(totalTarget)} total target · {overallPct}% overall
        </Text>
        <View style={{ height: 6, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99, marginTop: spacing[3], overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${Math.min(overallPct, 100)}%`, backgroundColor: colors.accent.primary, borderRadius: 99 }} />
        </View>
      </View>

      {/* ── Goals header row ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
            Savings Goals
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
            {(goals ?? []).length} active {(goals ?? []).length === 1 ? 'goal' : 'goals'}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.push('CreateGoal')}
          style={[addBtn, { backgroundColor: colors.accent.primary, borderRadius: borderRadius.button }]}
        >
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>+ New Goal</Text>
        </Pressable>
      </View>

      {/* ── Goal cards ── */}
      {isLoading ? (
        <View style={{ paddingVertical: spacing[8], alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      ) : (goals ?? []).length === 0 ? (
        <View style={{ backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[6], alignItems: 'center', borderWidth: 1, borderColor: colors.border.subtle }}>
          <Text style={{ fontSize: 36 }}>🎯</Text>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: spacing[3] }}>
            No goals yet
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2], textAlign: 'center' }}>
            Create your first savings goal to start tracking your progress.
          </Text>
          <Pressable
            onPress={() => navigation.push('CreateGoal')}
            style={{ backgroundColor: colors.accent.primary, borderRadius: borderRadius.button, paddingHorizontal: spacing[5], paddingVertical: spacing[3], marginTop: spacing[4] }}
          >
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>Create Goal</Text>
          </Pressable>
        </View>
      ) : (
        (goals ?? []).map(goal => {
          const pct        = goal.targetAmount > 0 ? Math.round((goal.savedAmount / goal.targetAmount) * 100) : 0;
          const isComplete = goal.savedAmount >= goal.targetAmount;
          return (
            <Pressable
              key={goal.id}
              onPress={() => navigation.push('GoalDetail', { goalId: goal.id })}
              style={({ pressed }) => [
                shadows.card,
                { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4], opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: goal.color + '18', borderRadius: borderRadius.full, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: spacing[3] }}>
                  <Text style={{ fontSize: 22, lineHeight: 28 }}>{goal.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.text.primary }} numberOfLines={1}>
                    {goal.name}
                  </Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                    {fmtShort(goal.savedAmount)} / {fmtShort(goal.targetAmount)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {isComplete ? (
                    <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.income }}>🎉 Done</Text>
                  ) : (
                    <>
                      <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: goal.color, letterSpacing: -0.3 }}>
                        {pct}%
                      </Text>
                      <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                        {fmtShort(goal.targetAmount - goal.savedAmount)} left
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <View style={{ height: 4, backgroundColor: colors.bg.surfaceMuted, borderRadius: 2, marginTop: spacing[3], overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: isComplete ? colors.income : goal.color, borderRadius: 2 }} />
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}
