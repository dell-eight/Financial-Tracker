import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useCurrency } from '../../utils/currency';
import type { TransactionsStackParamList } from '../../navigation/types';
import {
  getRecurringExpenses,
  getRecurringIncomeSources,
  deleteRecurringExpense,
  deleteRecurringIncomeSource,
  RECURRING_FREQUENCY_LABELS,
  type RecurringExpense,
  type RecurringIncomeSource,
} from '../../services/finance.service';

type Props = StackScreenProps<TransactionsStackParamList, 'RecurringTransactions'>;

export const RECURRING_EXPENSES_KEY   = ['recurring', 'expenses']   as const;
export const RECURRING_INCOME_KEY     = ['recurring', 'income']     as const;

function formatNextDue(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T12:00:00');
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0)  return 'Overdue';
  if (diff < 7)  return `In ${diff} days`;
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function isDueSoon(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T12:00:00');
  return d.getTime() - today.getTime() <= 3 * 86_400_000;
}

export function RecurringTransactionsScreen({ navigation }: Props) {
  const theme   = useTheme();
  const insets  = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt } = useCurrency();
  const qc      = useQueryClient();

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const { data: expenses = [], isLoading: loadingExp } = useQuery({
    queryKey: RECURRING_EXPENSES_KEY,
    queryFn:  getRecurringExpenses,
  });

  const { data: income = [], isLoading: loadingInc } = useQuery({
    queryKey: RECURRING_INCOME_KEY,
    queryFn:  getRecurringIncomeSources,
  });

  const deleteExpMutation = useMutation({
    mutationFn: deleteRecurringExpense,
    onSuccess:  () => qc.invalidateQueries({ queryKey: RECURRING_EXPENSES_KEY }),
  });

  const deleteIncMutation = useMutation({
    mutationFn: deleteRecurringIncomeSource,
    onSuccess:  () => qc.invalidateQueries({ queryKey: RECURRING_INCOME_KEY }),
  });

  function confirmDeleteExpense(item: RecurringExpense) {
    Haptics.selectionAsync();
    Alert.alert(
      'Delete Recurring Expense',
      `Stop recurring "${item.description}"? Past transactions are kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExpMutation.mutate(item.id),
        },
      ],
    );
  }

  function confirmDeleteIncome(item: RecurringIncomeSource) {
    Haptics.selectionAsync();
    Alert.alert(
      'Stop Recurring Income',
      `Stop recurring "${item.name}" income? Past records are kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => deleteIncMutation.mutate(item.id),
        },
      ],
    );
  }

  const isLoading = loadingExp || loadingInc;
  const isEmpty   = expenses.length === 0 && income.length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Recurring
        </Text>
        <View style={{ minWidth: 60 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent.primary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 40, marginBottom: spacing[4] }}>🔁</Text>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.text.primary, textAlign: 'center' }}>
            No recurring transactions
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', marginTop: spacing[2], lineHeight: 20 }}>
            Toggle "Repeat" when adding{'\n'}an expense or income to set one up.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: btmPad + spacing[4] }}
        >
          {/* ── Expenses ──────────────────────────────────────────────────── */}
          {expenses.length > 0 && (
            <>
              <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginTop: spacing[5], marginBottom: spacing[2] }}>
                EXPENSES
              </Text>
              <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, overflow: 'hidden' }]}>
                {expenses.map((item, i) => (
                  <RecurringRow
                    key={item.id}
                    icon={item.categoryIcon}
                    title={item.description}
                    subtitle={item.categoryName}
                    amount={fmt(item.amount)}
                    amountColor={colors.expense}
                    frequency={RECURRING_FREQUENCY_LABELS[item.frequency]}
                    nextDue={formatNextDue(item.nextDueDate)}
                    dueSoon={isDueSoon(item.nextDueDate)}
                    isLast={i === expenses.length - 1}
                    onDelete={() => confirmDeleteExpense(item)}
                    colors={colors}
                    spacing={spacing}
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    borderRadius={borderRadius}
                  />
                ))}
              </View>
            </>
          )}

          {/* ── Income ────────────────────────────────────────────────────── */}
          {income.length > 0 && (
            <>
              <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginTop: spacing[5], marginBottom: spacing[2] }}>
                INCOME
              </Text>
              <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, overflow: 'hidden' }]}>
                {income.map((item, i) => (
                  <RecurringRow
                    key={item.id}
                    icon={item.icon}
                    title={item.name}
                    subtitle={item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    amount={item.latestAmount > 0 ? `+${fmt(item.latestAmount)}` : '—'}
                    amountColor={colors.income}
                    frequency={RECURRING_FREQUENCY_LABELS[item.frequency]}
                    nextDue={formatNextDue(item.nextDueDate)}
                    dueSoon={isDueSoon(item.nextDueDate)}
                    isLast={i === income.length - 1}
                    onDelete={() => confirmDeleteIncome(item)}
                    colors={colors}
                    spacing={spacing}
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    borderRadius={borderRadius}
                  />
                ))}
              </View>
            </>
          )}

          {/* ── Help text ─────────────────────────────────────────────────── */}
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', marginTop: spacing[5], lineHeight: 20 }}>
            Recurring transactions are auto-applied each time{'\n'}you open the app.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

// ── RecurringRow ──────────────────────────────────────────────────────────────

type RowProps = {
  icon: string; title: string; subtitle: string;
  amount: string; amountColor: string;
  frequency: string; nextDue: string; dueSoon: boolean;
  isLast: boolean; onDelete: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  fontSize: ReturnType<typeof useTheme>['fontSize'];
  fontFamily: ReturnType<typeof useTheme>['fontFamily'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
};

function RecurringRow({ icon, title, subtitle, amount, amountColor, frequency, nextDue, dueSoon, isLast, onDelete, colors, spacing, fontSize, fontFamily, borderRadius }: RowProps) {
  return (
    <View style={{
      flexDirection:   'row',
      alignItems:      'center',
      padding:         spacing[4],
      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: colors.border.subtle,
    }}>
      {/* Icon */}
      <View style={{
        width:           44,
        height:          44,
        borderRadius:    borderRadius.full,
        backgroundColor: colors.bg.surfaceMuted,
        alignItems:      'center',
        justifyContent:  'center',
        marginRight:     spacing[3],
      }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
          {subtitle} · {frequency}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <View style={{
            backgroundColor: dueSoon ? `${colors.expense}18` : `${colors.income}18`,
            borderRadius:    borderRadius.full,
            paddingHorizontal: spacing[2],
            paddingVertical:   2,
          }}>
            <Text style={{ fontSize: 11, fontFamily: fontFamily.medium, color: dueSoon ? colors.expense : colors.income }}>
              {nextDue}
            </Text>
          </View>
        </View>
      </View>

      {/* Amount + Delete */}
      <View style={{ alignItems: 'flex-end', marginLeft: spacing[3] }}>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.bold, color: amountColor }}>
          {amount}
        </Text>
        <Pressable onPress={onDelete} hitSlop={12} style={{ marginTop: spacing[2] }}>
          <Text style={{ fontSize: 13, color: colors.text.muted }}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1 },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
});

export default RecurringTransactionsScreen;
