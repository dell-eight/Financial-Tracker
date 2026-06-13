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
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { TRANSACTIONS_KEY } from '../../hooks/queries/useTransactions';
import { getCategoryBgColor } from '../../theme';
import type { TransactionsStackParamList } from '../../navigation/types';
import type { Transaction } from '../../types/models';
import type { CategoryKey } from '../../theme';

type Props = StackScreenProps<TransactionsStackParamList, 'AddExpense'>;

const { width: SCREEN_W } = Dimensions.get('window');

type ExpenseCatKey = Extract<
  CategoryKey,
  'food' | 'transport' | 'shopping' | 'bills' | 'entertainment' | 'health' | 'education' | 'other'
>;

const EXPENSE_CATS: { key: ExpenseCatKey; label: string; icon: string }[] = [
  { key: 'food',           label: 'Food',          icon: '🍔' },
  { key: 'transport',      label: 'Transport',      icon: '🚗' },
  { key: 'shopping',       label: 'Shopping',       icon: '🛍️' },
  { key: 'bills',          label: 'Bills',          icon: '⚡' },
  { key: 'entertainment',  label: 'Entertainment',  icon: '🎬' },
  { key: 'health',         label: 'Health',         icon: '💊' },
  { key: 'education',      label: 'Education',      icon: '📚' },
  { key: 'other',          label: 'Other',          icon: '💰' },
];

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function AddExpenseScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();

  const [amountStr,    setAmountStr]    = useState('');
  const [selectedCat,  setSelectedCat]  = useState<ExpenseCatKey | null>(null);
  const [merchantName, setMerchantName] = useState('');
  const [note,         setNote]         = useState('');

  const today       = useMemo(() => new Date(), []);
  const todayStr    = useMemo(() => today.toISOString().split('T')[0], [today]);
  const displayDate = useMemo(() => formatDateDisplay(today), [today]);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const parsedAmount = parseFloat(amountStr);
  const canSave      = amountStr.length > 0 && !isNaN(parsedAmount) && parsedAmount > 0 && selectedCat !== null;

  function handleAmountChange(text: string) {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts   = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] !== undefined && parts[1].length > 2) return;
    setAmountStr(cleaned);
  }

  function handleSave() {
    if (!canSave || !selectedCat) return;
    const cat     = EXPENSE_CATS.find(c => c.key === selectedCat)!;
    const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    const newTx: Transaction = {
      id:            `t${Date.now()}`,
      merchant:      merchantName.trim() || cat.label,
      category:      selectedCat,
      categoryLabel: cat.label,
      categoryIcon:  cat.icon,
      amount:        parsedAmount,
      type:          'expense',
      date:          todayStr,
      time:          timeStr,
      note:          note.trim() || undefined,
    };

    queryClient.setQueryData(
      TRANSACTIONS_KEY,
      (old: Transaction[] | undefined) => [newTx, ...(old ?? [])],
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  }

  const TILE_GAP  = spacing[2];
  const H_PAD     = spacing[5];
  const TILE_SIZE = (SCREEN_W - H_PAD * 2 - TILE_GAP * 3) / 4;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.bg.base }]}
    >
      <StatusBar style="light" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: H_PAD, paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>
            Cancel
          </Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Add Expense
        </Text>
        <Pressable onPress={handleSave} disabled={!canSave} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: canSave ? colors.accent.primary : colors.text.muted }}>
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: spacing[4] }}
      >
        {/* ── Amount ──────────────────────────────────────────────────────────── */}
        <View style={[styles.amountSection, { paddingVertical: spacing[5], paddingHorizontal: H_PAD }]}>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3] }}>
            AMOUNT
          </Text>
          <View style={styles.amountRow}>
            <Text style={{ fontSize: 44, fontFamily: fontFamily.bold, color: amountStr ? colors.expense : colors.text.muted, lineHeight: 52, marginRight: 4 }}>
              ₱
            </Text>
            <TextInput
              value={amountStr}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              style={{
                fontSize:   44,
                fontFamily: fontFamily.bold,
                color:      colors.text.primary,
                minWidth:   100,
                padding:    0,
              }}
            />
          </View>
          {/* Underline */}
          <View style={{ width: 160, height: 2, backgroundColor: amountStr ? colors.expense : colors.border.subtle, borderRadius: 1, marginTop: spacing[2] }} />
        </View>

        {/* ── Category ────────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: spacing[5] }}>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3] }}>
            CATEGORY
          </Text>
          <View style={[styles.catGrid, { gap: TILE_GAP }]}>
            {EXPENSE_CATS.map(cat => {
              const active   = selectedCat === cat.key;
              const catColor = theme.categoryColors[cat.key];
              const catBg    = getCategoryBgColor(cat.key);
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => {
                    setSelectedCat(active ? null : cat.key);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.catTile,
                    {
                      width:           TILE_SIZE,
                      height:          TILE_SIZE,
                      backgroundColor: active ? `${catColor}20` : colors.bg.surface,
                      borderRadius:    borderRadius.card,
                      borderWidth:     active ? 2 : 1,
                      borderColor:     active ? catColor : colors.border.subtle,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={cat.label}
                >
                  <View style={[styles.catIconCircle, { backgroundColor: catBg, borderRadius: borderRadius.full, width: 36, height: 36 }]}>
                    <Text style={{ fontSize: 18, lineHeight: 22 }}>{cat.icon}</Text>
                  </View>
                  <Text
                    style={{ fontSize: 10, fontFamily: active ? fontFamily.semiBold : fontFamily.medium, color: active ? catColor : colors.text.secondary, marginTop: spacing[1], textAlign: 'center' }}
                    numberOfLines={1}
                  >
                    {cat.label.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Details ─────────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: spacing[5] }}>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3] }}>
            DETAILS
          </Text>
          <View style={[styles.detailCard, shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card }]}>
            {/* Merchant */}
            <View style={[styles.detailRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle, paddingHorizontal: spacing[4] }]}>
              <Text style={{ fontSize: 16, marginRight: spacing[3] }}>🏪</Text>
              <TextInput
                value={merchantName}
                onChangeText={setMerchantName}
                placeholder="Merchant name (optional)"
                placeholderTextColor={colors.text.muted}
                style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.primary, paddingVertical: spacing[3] }}
                returnKeyType="next"
                autoCapitalize="words"
              />
            </View>
            {/* Date */}
            <View style={[styles.detailRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle, paddingHorizontal: spacing[4] }]}>
              <Text style={{ fontSize: 16, marginRight: spacing[3] }}>📅</Text>
              <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.secondary, paddingVertical: spacing[3] }}>
                {displayDate}
              </Text>
            </View>
            {/* Note */}
            <View style={[styles.detailRow, { paddingHorizontal: spacing[4] }]}>
              <Text style={{ fontSize: 16, marginRight: spacing[3] }}>📝</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a note (optional)"
                placeholderTextColor={colors.text.muted}
                style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.primary, paddingVertical: spacing[3] }}
                returnKeyType="done"
                multiline
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Save button ─────────────────────────────────────────────────────── */}
      <View style={[styles.saveWrap, { paddingHorizontal: H_PAD, paddingBottom: btmPad + spacing[3], paddingTop: spacing[3], borderTopColor: colors.border.subtle }]}>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: !canSave
                ? colors.bg.surfaceMuted
                : pressed
                  ? colors.accent.pressed
                  : colors.accent.primary,
              borderRadius: borderRadius.button,
              height:       52,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save expense"
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: canSave ? '#FFFFFF' : colors.text.muted }}>
            Save Expense
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountSection:{ alignItems: 'center' },
  amountRow:    { flexDirection: 'row', alignItems: 'center' },
  catGrid:      { flexDirection: 'row', flexWrap: 'wrap' },
  catTile:      { alignItems: 'center', justifyContent: 'center' },
  catIconCircle:{ alignItems: 'center', justifyContent: 'center' },
  detailCard:   { overflow: 'hidden' },
  detailRow:    { flexDirection: 'row', alignItems: 'center' },
  saveWrap:     { borderTopWidth: StyleSheet.hairlineWidth },
  saveBtn:      { alignItems: 'center', justifyContent: 'center' },
});

export default AddExpenseScreen;
