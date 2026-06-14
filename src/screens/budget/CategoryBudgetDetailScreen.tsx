import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useBudgets, BUDGETS_KEY } from '../../hooks/queries/useBudgets';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { updateBudgetLimit } from '../../services/finance.service';
import { getCategoryBgColor, getProgressColor } from '../../theme';
import { ProgressBar } from '../../components/charts/ProgressBar/ProgressBar';
import { ExpenseItem } from '../../components';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import type { BudgetStackParamList } from '../../navigation/types';
import type { Budget, Transaction } from '../../types/models';
import { useCurrency } from '../../utils/currency';

type Props = StackScreenProps<BudgetStackParamList, 'CategoryBudgetDetail'>;

function currentMonthPrefix(): string {
  return new Date().toISOString().slice(0, 7); // "2026-06"
}

function formatTime(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':');
  const h    = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

// ─── StatTile ─────────────────────────────────────────────────────────────────

function StatTile({ label, value, color }: { label: string; value: string; color?: string }) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily } = theme;
  return (
    <View style={[statStyles.tile, { backgroundColor: colors.bg.surfaceRaised, borderRadius: borderRadius.lg, padding: spacing[3], flex: 1 }]}>
      <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: color ?? colors.text.primary, letterSpacing: -0.3, lineHeight: 24 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2, lineHeight: 14 }}>
        {label}
      </Text>
    </View>
  );
}

const statStyles = StyleSheet.create({ tile: {} });

// ─── EditLimitModal ───────────────────────────────────────────────────────────

function EditLimitModal({
  currentLimit,
  onSave,
  onCancel,
}: {
  currentLimit: number;
  onSave:   (newLimit: number) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily } = theme;
  const { symbol } = useCurrency();
  const [value, setValue] = useState(String(currentLimit));

  const parsed  = parseFloat(value);
  const canSave = !isNaN(parsed) && parsed > 0;

  return (
    <View style={[modalStyles.overlay]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />
      <View style={[modalStyles.sheet, { backgroundColor: colors.bg.surfaceRaised, borderRadius: borderRadius.cardLg, margin: spacing[5], padding: spacing[6] }]}>
        <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, marginBottom: spacing[4] }}>
          Edit Budget Limit
        </Text>
        <View style={[modalStyles.inputRow, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.input, borderWidth: 1, borderColor: colors.border.subtle, paddingHorizontal: spacing[4], height: 52 }]}>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.muted, marginRight: 4 }}>{symbol}</Text>
          <TextInput
            value={value}
            onChangeText={v => {
              const c = v.replace(/[^0-9.]/g, '');
              if (c.split('.').length <= 2) setValue(c);
            }}
            keyboardType="decimal-pad"
            autoFocus
            style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, padding: 0 }}
          />
        </View>
        <View style={[modalStyles.btnRow, { marginTop: spacing[5], gap: spacing[3] }]}>
          <Pressable
            onPress={onCancel}
            style={[modalStyles.btn, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.button, flex: 1, height: 46 }]}
          >
            <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.medium, color: colors.text.secondary }}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => canSave && onSave(parsed)}
            style={[modalStyles.btn, { backgroundColor: canSave ? colors.accent.primary : colors.bg.surfaceMuted, borderRadius: borderRadius.button, flex: 1, height: 46 }]}
          >
            <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: canSave ? '#FFFFFF' : colors.text.muted }}>Save</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', zIndex: 99 },
  sheet:    {},
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  btnRow:   { flexDirection: 'row' },
  btn:      { alignItems: 'center', justifyContent: 'center' },
});

// ─── CategoryBudgetDetailScreen ───────────────────────────────────────────────

export function CategoryBudgetDetailScreen({ navigation, route }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt, fmtCompact: fmtShort } = useCurrency();
  const queryClient = useQueryClient();
  const { categoryId } = route.params;

  const [editingLimit, setEditingLimit] = useState(false);
  const [savingLimit,  setSavingLimit]  = useState(false);

  const { data: budgets }  = useBudgets();
  const { data: allTxns }  = useTransactions();

  const budget = useMemo<Budget | undefined>(
    () => budgets?.find(b => b.id === categoryId),
    [budgets, categoryId],
  );

  const monthTxns = useMemo<Transaction[]>(() => {
    if (!budget) return [];
    const prefix = currentMonthPrefix();
    return (allTxns ?? []).filter(
      t => t.category === budget.category && t.type === 'expense' && t.date.startsWith(prefix),
    ).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  }, [allTxns, budget]);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  async function handleSaveLimit(newLimit: number) {
    if (!budget || savingLimit) return;
    setSavingLimit(true);
    try {
      await updateBudgetLimit(budget.label, budget.icon, newLimit, budget.color);
      await queryClient.invalidateQueries({ queryKey: [...BUDGETS_KEY] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditingLimit(false);
    } catch {
      // silent — modal stays open so user can retry
    } finally {
      setSavingLimit(false);
    }
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!budget) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
        <StatusBar style="light" />
        <View style={{ paddingTop: topPad + spacing[2], paddingHorizontal: spacing[5] }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: spacing[3] }}>
            Budget not found
          </Text>
        </View>
      </View>
    );
  }

  const ratio       = budget.limit > 0 ? budget.spent / budget.limit : 0;
  const remaining   = budget.limit - budget.spent;
  const isOver      = budget.spent > budget.limit;
  const catColor    = theme.categoryColors[budget.category] ?? colors.accent.primary;
  const catBg       = getCategoryBgColor(budget.category);
  const fillColor   = getProgressColor(ratio, colors);

  const today      = new Date();
  const daysPassed = today.getDate();
  const dailyAvg   = daysPassed > 0 ? budget.spent / daysPassed : 0;
  const status     = ratio >= 1 ? 'Over Budget' : ratio >= 0.8 ? 'Near Limit' : 'On Track';
  const statusColor = ratio >= 1 ? colors.expense : ratio >= 0.8 ? colors.warning : colors.income;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />

      <LoadingOverlay visible={savingLimit} message="Saving…" />

      {/* Edit limit modal */}
      {editingLimit && (
        <EditLimitModal
          currentLimit={budget.limit}
          onSave={handleSaveLimit}
          onCancel={() => setEditingLimit(false)}
        />
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Budget Detail
        </Text>
        <Pressable onPress={() => setEditingLimit(true)} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>Edit Limit</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingVertical: spacing[6], paddingHorizontal: spacing[5] }]}>
          {/* Category icon */}
          <View style={[styles.catCircle, { backgroundColor: catBg, borderRadius: borderRadius.full, width: 72, height: 72 }]}>
            <Text style={{ fontSize: 32, lineHeight: 40 }}>{budget.icon}</Text>
          </View>

          <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[3] }}>
            {budget.label}
          </Text>

          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18`, borderRadius: borderRadius.full, paddingHorizontal: spacing[3], paddingVertical: spacing[1], marginTop: spacing[1] }]}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: statusColor }}>
              {status}
            </Text>
          </View>

          {/* Amount display */}
          <View style={[styles.amountRow, { marginTop: spacing[5] }]}>
            <Text style={{ fontSize: 32, fontFamily: fontFamily.bold, color: isOver ? colors.expense : colors.text.primary, letterSpacing: -0.5 }}>
              {fmt(budget.spent)}
            </Text>
            <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.regular, color: colors.text.muted, marginHorizontal: spacing[2] }}>
              /
            </Text>
            <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.semiBold, color: colors.text.secondary }}>
              {fmt(budget.limit)}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={{ width: '100%', marginTop: spacing[3] }}>
            <ProgressBar ratio={ratio} height={10} />
          </View>

          <View style={[styles.progressLabels, { marginTop: spacing[2] }]}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: fillColor }}>
              {Math.round(ratio * 100)}% used
            </Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: isOver ? colors.expense : colors.text.muted }}>
              {isOver ? `Over by ${fmt(budget.spent - budget.limit)}` : `${fmt(remaining)} remaining`}
            </Text>
          </View>
        </View>

        {/* ── Stats strip ─────────────────────────────────────────────────────── */}
        <View style={[styles.statsRow, { paddingHorizontal: spacing[5], gap: spacing[3], marginBottom: spacing[5] }]}>
          <StatTile label="Daily avg"     value={fmtShort(dailyAvg)} color={dailyAvg > budget.limit / 30 ? colors.expense : undefined} />
          <StatTile label="Transactions"  value={String(monthTxns.length)} />
          <StatTile label="Days elapsed"  value={String(daysPassed)} />
        </View>

        {/* ── Transactions section ─────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
            This Month
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
            {monthTxns.length} {monthTxns.length === 1 ? 'transaction' : 'transactions'}
          </Text>
        </View>

        {monthTxns.length === 0 ? (
          <View style={[styles.emptyState, { paddingVertical: spacing[8] }]}>
            <Text style={{ fontSize: 32 }}>{budget.icon}</Text>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[3] }}>
              No {budget.label} transactions this month
            </Text>
          </View>
        ) : (
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], overflow: 'hidden' }]}>
            {monthTxns.map((tx, i) => (
              <ExpenseItem
                key={tx.id}
                id={tx.id}
                merchant={tx.merchant}
                categoryKey={tx.category}
                categoryLabel={tx.categoryLabel}
                categoryIcon={<Text style={{ fontSize: 16, lineHeight: 20 }}>{tx.categoryIcon}</Text>}
                amount={fmt(tx.amount)}
                type={tx.type}
                date={tx.note ?? tx.categoryLabel}
                time={formatTime(tx.time)}
                showDivider={i < monthTxns.length - 1}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:         { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero:           { alignItems: 'center' },
  catCircle:      { alignItems: 'center', justifyContent: 'center' },
  statusBadge:    {},
  amountRow:      { flexDirection: 'row', alignItems: 'baseline' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  statsRow:       { flexDirection: 'row' },
  emptyState:     { alignItems: 'center' },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default CategoryBudgetDetailScreen;
