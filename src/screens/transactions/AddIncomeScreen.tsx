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
import { useTheme } from '../../hooks/ui/useTheme';
import { TRANSACTIONS_KEY } from '../../hooks/queries/useTransactions';
import type { TransactionsStackParamList } from '../../navigation/types';
import type { Transaction } from '../../types/models';
import type { CategoryKey } from '../../theme';

type Props = StackScreenProps<TransactionsStackParamList, 'AddIncome'>;

type IncomeCatKey = Extract<CategoryKey, 'income_salary' | 'income_freelance' | 'income_other'>;

const INCOME_CATS: { key: IncomeCatKey; label: string; icon: string; description: string }[] = [
  { key: 'income_salary',    label: 'Salary',       icon: '💼', description: 'Regular paycheck or wage' },
  { key: 'income_freelance', label: 'Freelance',     icon: '💻', description: 'Contract or gig work' },
  { key: 'income_other',     label: 'Other Income',  icon: '💰', description: 'Investments, gifts, dividends' },
];

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function AddIncomeScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();

  const [amountStr,   setAmountStr]   = useState('');
  const [selectedCat, setSelectedCat] = useState<IncomeCatKey | null>(null);
  const [description, setDescription] = useState('');
  const [note,        setNote]        = useState('');

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
    const cat     = INCOME_CATS.find(c => c.key === selectedCat)!;
    const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    const newTx: Transaction = {
      id:            `t${Date.now()}`,
      merchant:      description.trim() || cat.label,
      category:      selectedCat,
      categoryLabel: cat.label,
      categoryIcon:  cat.icon,
      amount:        parsedAmount,
      type:          'income',
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

  const H_PAD = spacing[5];

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
          Add Income
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
            <Text style={{ fontSize: 44, fontFamily: fontFamily.bold, color: amountStr ? colors.income : colors.text.muted, lineHeight: 52, marginRight: 4 }}>
              ₱
            </Text>
            <TextInput
              value={amountStr}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              style={{ fontSize: 44, fontFamily: fontFamily.bold, color: colors.text.primary, minWidth: 100, padding: 0 }}
            />
          </View>
          <View style={{ width: 160, height: 2, backgroundColor: amountStr ? colors.income : colors.border.subtle, borderRadius: 1, marginTop: spacing[2] }} />
        </View>

        {/* ── Income source ────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: spacing[5] }}>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3] }}>
            SOURCE
          </Text>
          <View style={{ gap: spacing[2] }}>
            {INCOME_CATS.map(cat => {
              const active   = selectedCat === cat.key;
              const catColor = theme.categoryColors[cat.key];
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => {
                    setSelectedCat(active ? null : cat.key);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.sourceTile,
                    shadows.sm,
                    {
                      backgroundColor: active ? `${catColor}18` : colors.bg.surface,
                      borderRadius:    borderRadius.card,
                      borderWidth:     active ? 2 : 1,
                      borderColor:     active ? catColor : colors.border.subtle,
                      padding:         spacing[4],
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={cat.label}
                >
                  <View style={[styles.sourceIcon, { width: 44, height: 44, backgroundColor: `${catColor}18`, borderRadius: borderRadius.full }]}>
                    <Text style={{ fontSize: 22, lineHeight: 28 }}>{cat.icon}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing[3] }}>
                    <Text style={{ fontSize: fontSize.bodyLg, fontFamily: active ? fontFamily.semiBold : fontFamily.medium, color: active ? catColor : colors.text.primary }}>
                      {cat.label}
                    </Text>
                    <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                      {cat.description}
                    </Text>
                  </View>
                  {active && (
                    <View style={[styles.checkCircle, { backgroundColor: catColor, borderRadius: borderRadius.full }]}>
                      <Text style={{ fontSize: 12, color: '#FFFFFF', fontFamily: fontFamily.bold, lineHeight: 16 }}>✓</Text>
                    </View>
                  )}
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
            {/* Description */}
            <View style={[styles.detailRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle, paddingHorizontal: spacing[4] }]}>
              <Text style={{ fontSize: 16, marginRight: spacing[3] }}>🏦</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Source name (optional)"
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
          accessibilityLabel="Save income"
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: canSave ? '#FFFFFF' : colors.text.muted }}>
            Save Income
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountSection: { alignItems: 'center' },
  amountRow:   { flexDirection: 'row', alignItems: 'center' },
  sourceTile:  { flexDirection: 'row', alignItems: 'center' },
  sourceIcon:  { alignItems: 'center', justifyContent: 'center' },
  checkCircle: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  detailCard:  { overflow: 'hidden' },
  detailRow:   { flexDirection: 'row', alignItems: 'center' },
  saveWrap:    { borderTopWidth: StyleSheet.hairlineWidth },
  saveBtn:     { alignItems: 'center', justifyContent: 'center' },
});

export default AddIncomeScreen;
