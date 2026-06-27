import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/ui/useTheme';
import { useAppStore } from '../../store/app.store';
import { WIN } from '../../constants/tutorials';

const WINS = [
  { key: WIN.ACCOUNT_ADDED,       label: 'Add an account',             emoji: '🏦' },
  { key: WIN.TRANSACTION_LOGGED,  label: 'Log your first transaction',  emoji: '💸' },
  { key: WIN.BUDGET_CREATED,      label: 'Create a budget',             emoji: '🎯' },
  { key: WIN.GOAL_CREATED,        label: 'Create a savings goal',       emoji: '🌟' },
  { key: WIN.HEALTH_SCORE_VIEWED, label: 'Health Score',                emoji: '💚', isHealthScore: true },
] as const;

interface Props {
  onItemPress?: (key: string) => void;
  onDismiss?: () => void;
  // Health score progress (0-4 based on account, txn, budget, goal)
  healthScoreProgress?: number;
}

export function FirstWinsChecklist({ onItemPress, onDismiss, healthScoreProgress = 0 }: Props) {
  const theme      = useTheme();
  const completed  = useAppStore(s => s.tutorialsCompleted);
  const styles     = makeStyles(theme);

  const doneCount = useMemo(
    () => WINS.filter(w => completed[w.key]).length,
    [completed],
  );
  const allDone   = doneCount === WINS.length;
  const progress  = doneCount / WINS.length;

  if (allDone) {
    return (
      <View style={styles.completeCard}>
        <Text style={styles.completeEmoji}>🎉</Text>
        <Text style={styles.completeTitle}>Financial Setup Complete!</Text>
        <Text style={styles.completeBody}>Your Health Score is fully active.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Networthy Setup</Text>
        {onDismiss && (
          <Pressable onPress={onDismiss} hitSlop={12}>
            <Text style={styles.dismiss}>Maybe later</Text>
          </Pressable>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: theme.colors.accent.primary, width: `${progress * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.progressLabel}>{doneCount} of {WINS.length} complete</Text>

      {/* Win items */}
      <View style={styles.winList}>
        {WINS.map((win) => {
          const done = !!completed[win.key];

          if (win.key === WIN.HEALTH_SCORE_VIEWED) {
            // Health Score row with its own progress bar
            const hsPct = Math.min(healthScoreProgress / 4, 1);
            return (
              <Pressable
                key={win.key}
                style={styles.winRow}
                onPress={() => onItemPress?.(win.key)}
              >
                <Text style={styles.winEmoji}>{done ? '✅' : win.emoji}</Text>
                <View style={styles.healthScoreContent}>
                  <Text style={[styles.winLabel, done && styles.winLabelDone]}>
                    {win.label}
                  </Text>
                  {!done && (
                    <View style={styles.hsPtrackRow}>
                      <View style={styles.hsProgressTrack}>
                        <View style={[styles.hsProgressFill, { width: `${hsPct * 100}%` }]} />
                      </View>
                      <Text style={styles.hsPctLabel}>{Math.round(hsPct * 100)}%</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={win.key}
              style={styles.winRow}
              onPress={() => !done && onItemPress?.(win.key)}
            >
              <Text style={styles.winEmoji}>{done ? '✅' : '☐'}</Text>
              <Text style={[styles.winLabel, done && styles.winLabelDone]}>
                {win.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.borderRadius.cardLg,
      padding: 20,
      marginHorizontal: 16,
      marginBottom: 16,
      ...theme.shadows.card,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: theme.fontSize.bodyMd,
      fontFamily: theme.fontFamily.bold,
      color: theme.colors.text.primary,
    },
    dismiss: {
      fontSize: theme.fontSize.micro,
      fontFamily: theme.fontFamily.regular,
      color: theme.colors.text.muted,
    },
    progressTrack: {
      height: 6,
      backgroundColor: theme.colors.bg.card,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressFill: {
      height: 6,
      borderRadius: 3,
    },
    progressLabel: {
      fontSize: theme.fontSize.micro,
      fontFamily: theme.fontFamily.regular,
      color: theme.colors.text.muted,
      marginBottom: 16,
    },
    winList: {
      gap: 10,
    },
    winRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    winEmoji: {
      fontSize: 18,
      width: 24,
      textAlign: 'center',
    },
    winLabel: {
      fontSize: theme.fontSize.bodySm,
      fontFamily: theme.fontFamily.medium,
      color: theme.colors.text.primary,
      flex: 1,
    },
    winLabelDone: {
      color: theme.colors.text.muted,
      textDecorationLine: 'line-through',
    },
    // Health Score row
    healthScoreContent: {
      flex: 1,
    },
    hsPtrackRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 3,
    },
    hsProgressTrack: {
      flex: 1,
      height: 4,
      backgroundColor: theme.colors.bg.card,
      borderRadius: 2,
      overflow: 'hidden',
    },
    hsProgressFill: {
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.income,
    },
    hsPctLabel: {
      fontSize: theme.fontSize.micro,
      fontFamily: theme.fontFamily.regular,
      color: theme.colors.text.muted,
      width: 30,
    },
    // Complete state
    completeCard: {
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.borderRadius.cardLg,
      padding: 20,
      marginHorizontal: 16,
      marginBottom: 16,
      alignItems: 'center',
      ...theme.shadows.card,
    },
    completeEmoji: {
      fontSize: 32,
      marginBottom: 8,
    },
    completeTitle: {
      fontSize: theme.fontSize.bodyMd,
      fontFamily: theme.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    completeBody: {
      fontSize: theme.fontSize.bodySm,
      fontFamily: theme.fontFamily.regular,
      color: theme.colors.text.secondary,
    },
  });
}
