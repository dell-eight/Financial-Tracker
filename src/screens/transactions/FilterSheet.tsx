import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useCurrency } from '../../utils/currency';
import type { TransactionsStackParamList, FilterState } from '../../navigation/types';

type Props = StackScreenProps<TransactionsStackParamList, 'Filter'>;

type TxType  = 'all' | 'income' | 'expense' | 'transfer';
type Period  = 'week' | 'month' | 'year';

// ─── SegmentedControl ─────────────────────────────────────────────────────────

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  activeColor,
}: {
  options:     { key: T; label: string }[];
  value:       T;
  onChange:    (v: T) => void;
  activeColor?: string;
}) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontFamily, fontSize } = theme;
  const color = activeColor ?? colors.accent.primary;

  return (
    <View style={[segStyles.wrap, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full, padding: 3, height: 40 }]}>
      {options.map(({ key, label }) => {
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => {
              onChange(key);
              Haptics.selectionAsync();
            }}
            style={[
              segStyles.seg,
              {
                flex:            1,
                borderRadius:    borderRadius.full,
                backgroundColor: active ? colors.bg.surfaceRaised : 'transparent',
                borderWidth:     active ? 1 : 0,
                borderColor:     active ? color : 'transparent',
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
          >
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: active ? fontFamily.semiBold : fontFamily.medium, color: active ? color : colors.text.muted, textAlign: 'center' }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center' },
  seg:  { alignItems: 'center', justifyContent: 'center', height: '100%' },
});

// ─── SectionLabel ─────────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily } = theme;
  return (
    <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3], marginTop: spacing[5] }}>
      {title}
    </Text>
  );
}

// ─── AmountInput ──────────────────────────────────────────────────────────────

function AmountInput({
  label,
  value,
  onChange,
}: {
  label:    string;
  value:    string;
  onChange: (v: string) => void;
}) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontFamily, fontSize } = theme;
  const { symbol } = useCurrency();

  function handleChange(text: string) {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts   = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] !== undefined && parts[1].length > 2) return;
    onChange(cleaned);
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted, marginBottom: spacing[2] }}>
        {label}
      </Text>
      <View style={[amtStyles.wrap, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: colors.border.subtle, paddingHorizontal: spacing[3], height: 44 }]}>
        <Text style={{ fontSize: fontSize.bodyMd, color: colors.text.muted, marginRight: 4 }}>{symbol}</Text>
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder="0"
          placeholderTextColor={colors.text.muted}
          keyboardType="decimal-pad"
          style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.primary, padding: 0 }}
        />
      </View>
    </View>
  );
}

const amtStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center' },
});

// ─── FilterSheet ──────────────────────────────────────────────────────────────

export function FilterSheet({ navigation, route }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const { symbol } = useCurrency();

  const initial = route.params?.current;

  const [txType,     setTxType]     = useState<TxType>(initial?.type   ?? 'all');
  const [period,     setPeriod]     = useState<Period>(initial?.period  ?? 'month');
  const [minAmtStr,  setMinAmtStr]  = useState(initial?.minAmount != null ? String(initial.minAmount) : '');
  const [maxAmtStr,  setMaxAmtStr]  = useState(initial?.maxAmount != null ? String(initial.maxAmount) : '');

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const hasFilters =
    txType !== 'all' ||
    period !== 'month' ||
    minAmtStr.length > 0 ||
    maxAmtStr.length > 0;

  function handleApply() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const filters: FilterState = {
      type:       txType,
      period,
      minAmount:  minAmtStr ? parseFloat(minAmtStr) : undefined,
      maxAmount:  maxAmtStr ? parseFloat(maxAmtStr) : undefined,
    };
    navigation.navigate('TransactionList', filters);
  }

  function handleClear() {
    Haptics.selectionAsync();
    setTxType('all');
    setPeriod('month');
    setMinAmtStr('');
    setMaxAmtStr('');
    navigation.navigate('TransactionList', {});
  }

  const H_PAD = spacing[5];

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: H_PAD, paddingBottom: spacing[3], borderBottomColor: colors.border.subtle }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>
            ← Back
          </Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Filters
        </Text>
        {hasFilters ? (
          <Pressable onPress={handleClear} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.expense }}>
              Clear All
            </Text>
          </Pressable>
        ) : (
          <View style={{ minWidth: 60 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: btmPad + 80 }}
      >
        {/* ── Type ────────────────────────────────────────────────────────────── */}
        <SectionLabel title="TRANSACTION TYPE" />
        <SegmentedControl
          options={[
            { key: 'all',      label: 'All'       },
            { key: 'expense',  label: 'Expenses'  },
            { key: 'income',   label: 'Income'    },
            { key: 'transfer', label: 'Transfers' },
          ]}
          value={txType}
          onChange={setTxType}
          activeColor={txType === 'expense' ? colors.expense : txType === 'income' ? colors.income : colors.accent.primary}
        />

        {/* ── Period ──────────────────────────────────────────────────────────── */}
        <SectionLabel title="PERIOD" />
        <SegmentedControl
          options={[
            { key: 'week',  label: 'This Week'  },
            { key: 'month', label: 'This Month' },
            { key: 'year',  label: 'This Year'  },
          ]}
          value={period}
          onChange={setPeriod}
        />

        {/* ── Amount range ────────────────────────────────────────────────────── */}
        <SectionLabel title="AMOUNT RANGE" />
        <View style={[styles.amtRow, { gap: spacing[3] }]}>
          <AmountInput label="Minimum" value={minAmtStr} onChange={setMinAmtStr} />
          <View style={{ width: 20, alignItems: 'center', paddingTop: 28 }}>
            <Text style={{ color: colors.text.muted, fontSize: 14 }}>–</Text>
          </View>
          <AmountInput label="Maximum" value={maxAmtStr} onChange={setMaxAmtStr} />
        </View>

        {/* Active filter summary */}
        {hasFilters && (
          <View style={[styles.summaryCard, { backgroundColor: colors.accent.muted, borderRadius: borderRadius.card, padding: spacing[4], marginTop: spacing[5] }]}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.accent.primary, marginBottom: spacing[1] }}>
              Active Filters
            </Text>
            {txType !== 'all' && (
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary }}>
                • Type: {txType === 'expense' ? 'Expenses only' : txType === 'income' ? 'Income only' : 'Transfers only'}
              </Text>
            )}
            {period !== 'month' && (
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary }}>
                • Period: {period === 'week' ? 'This week' : 'This year'}
              </Text>
            )}
            {minAmtStr.length > 0 && (
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary }}>
                • Min amount: {symbol}{minAmtStr}
              </Text>
            )}
            {maxAmtStr.length > 0 && (
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary }}>
                • Max amount: {symbol}{maxAmtStr}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Apply button ────────────────────────────────────────────────────── */}
      <View style={[styles.applyWrap, { paddingHorizontal: H_PAD, paddingBottom: btmPad + spacing[3], paddingTop: spacing[3], borderTopColor: colors.border.subtle }]}>
        <Pressable
          onPress={handleApply}
          style={({ pressed }) => [
            styles.applyBtn,
            {
              backgroundColor: pressed ? colors.accent.pressed : colors.accent.primary,
              borderRadius:    borderRadius.button,
              height:          52,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Apply filters"
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>
            Apply Filters
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  amtRow:    { flexDirection: 'row', alignItems: 'flex-start' },
  summaryCard: {},
  applyWrap: { borderTopWidth: StyleSheet.hairlineWidth },
  applyBtn:  { alignItems: 'center', justifyContent: 'center' },
});

export default FilterSheet;
