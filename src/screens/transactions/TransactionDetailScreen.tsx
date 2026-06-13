import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useTransactions, TRANSACTIONS_KEY } from '../../hooks/queries/useTransactions';
import { getCategoryBgColor } from '../../theme';
import type { TransactionsStackParamList } from '../../navigation/types';
import type { Transaction } from '../../types/models';

type Props = StackScreenProps<TransactionsStackParamList, 'TransactionDetail'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':');
  const h    = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

// ─── DetailRow ────────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  valueColor,
  isLast,
}: {
  label:       string;
  value:       string;
  valueColor?: string;
  isLast?:     boolean;
}) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily } = theme;

  return (
    <View
      style={[
        drStyles.row,
        {
          paddingHorizontal: spacing[4],
          paddingVertical:   spacing[3],
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: colors.border.subtle,
        },
      ]}
    >
      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted, flex: 1 }}>
        {label}
      </Text>
      <Text
        style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: valueColor ?? colors.text.primary, flex: 2, textAlign: 'right' }}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const drStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});

// ─── TransactionDetailScreen ──────────────────────────────────────────────────

export function TransactionDetailScreen({ navigation, route }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();
  const { id, type } = route.params;

  const { data: allTxns } = useTransactions();
  const tx = useMemo<Transaction | undefined>(
    () => allTxns?.find(t => t.id === id),
    [allTxns, id],
  );

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const isExpense = (tx?.type ?? type) === 'expense';
  const amtColor  = isExpense ? colors.expense : colors.income;
  const catColor  = tx ? (theme.categoryColors[tx.category] ?? colors.accent.primary) : colors.accent.primary;
  const catBg     = tx ? getCategoryBgColor(tx.category) : colors.bg.surfaceMuted;

  function handleDelete() {
    Alert.alert(
      'Delete Transaction',
      'This transaction will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:    'Delete',
          style:   'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            queryClient.setQueryData(
              TRANSACTIONS_KEY,
              (old: Transaction[] | undefined) => (old ?? []).filter(t => t.id !== id),
            );
            navigation.goBack();
          },
        },
      ],
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!tx) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
        <StatusBar style="light" />
        <View style={{ paddingTop: topPad + spacing[2], paddingHorizontal: spacing[5] }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>
              ← Back
            </Text>
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: spacing[3] }}>
            Transaction not found
          </Text>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2] }}>
            It may have been deleted
          </Text>
        </View>
      </View>
    );
  }

  const prefix      = isExpense ? '-' : '+';
  const displayDate = formatDisplayDate(tx.date);
  const displayTime = formatTime(tx.time);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>
            ← Back
          </Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Transaction
        </Text>
        <Pressable onPress={handleDelete} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.bodyMd, color: colors.expense, fontFamily: fontFamily.medium }}>
            Delete
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: spacing[6], paddingBottom: spacing[8] }]}>
          <View style={[styles.catCircle, { backgroundColor: catBg, borderRadius: borderRadius.full, width: 72, height: 72 }]}>
            <Text style={{ fontSize: 32, lineHeight: 40 }}>{tx.categoryIcon}</Text>
          </View>

          <View style={[styles.catBadge, { backgroundColor: `${catColor}18`, borderRadius: borderRadius.full, paddingHorizontal: spacing[3], paddingVertical: spacing[1], marginTop: spacing[2] }]}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: catColor }}>
              {tx.categoryLabel}
            </Text>
          </View>

          <Text style={{ fontSize: 40, fontFamily: fontFamily.bold, color: amtColor, letterSpacing: -1, marginTop: spacing[4], lineHeight: 48 }}>
            {prefix}{fmt(tx.amount)}
          </Text>

          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: spacing[2], textAlign: 'center', paddingHorizontal: spacing[8] }}>
            {tx.merchant}
          </Text>
        </View>

        {/* ── Detail card ─────────────────────────────────────────────────────── */}
        <View style={[styles.detailCard, shadows.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5] }]}>
          <DetailRow label="Date"     value={displayDate} />
          <DetailRow label="Time"     value={displayTime} />
          <DetailRow label="Type"     value={isExpense ? 'Expense' : 'Income'} valueColor={amtColor} />
          <DetailRow label="Category" value={tx.categoryLabel} />
          <DetailRow
            label="Note"
            value={tx.note ?? '—'}
            valueColor={tx.note ? colors.text.primary : colors.text.muted}
            isLast
          />
        </View>

        {/* ── Delete button ────────────────────────────────────────────────────── */}
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.deleteBtn,
            {
              backgroundColor:  pressed ? `${colors.expense}20` : `${colors.expense}0F`,
              borderRadius:     borderRadius.button,
              marginHorizontal: spacing[5],
              marginTop:        spacing[5],
              height:           52,
              borderWidth:      1,
              borderColor:      `${colors.expense}30`,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Delete transaction"
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.expense }}>
            Delete Transaction
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero:      { alignItems: 'center' },
  catCircle: { alignItems: 'center', justifyContent: 'center' },
  catBadge:  {},
  detailCard:{},
  deleteBtn: { alignItems: 'center', justifyContent: 'center' },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default TransactionDetailScreen;
