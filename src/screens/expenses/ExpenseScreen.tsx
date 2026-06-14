import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';

import { useTheme }        from '../../hooks/ui/useTheme';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { ExpenseItem, SectionHeader } from '../../components';
import { getCategoryBgColor } from '../../theme';
import type { TransactionsStackParamList } from '../../navigation/types';
import { formatFull, formatCompact } from '../../utils/currency';
import { useAppStore } from '../../store/app.store';
import type { CategoryKey } from '../../theme';

type Props = StackScreenProps<TransactionsStackParamList, 'TransactionList'>;

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id:       string;
  merchant: string;
  category: CategoryKey;
  label:    string;
  icon:     string;
  amount:   number;
  type:     'income' | 'expense';
  date:     string;   // YYYY-MM-DD
  time:     string;
  note?:    string;
}

type Period     = 'week' | 'month' | 'year';
type TypeFilter = 'all' | 'income' | 'expense';

// ─── Dynamic date constants ───────────────────────────────────────────────────

const _now      = new Date();
const TODAY     = _now.toISOString().split('T')[0];
const _yd       = new Date(_now); _yd.setDate(_yd.getDate() - 1);
const YESTERDAY = _yd.toISOString().split('T')[0];
const _ws       = new Date(_now); _ws.setDate(_ws.getDate() - 6);
const WEEK_START = _ws.toISOString().split('T')[0];

// ─── Category chip definitions ────────────────────────────────────────────────

interface ChipDef {
  key:   'all' | CategoryKey;
  label: string;
  icon:  string;
}

const CATEGORY_CHIPS: ChipDef[] = [
  { key: 'all',          label: 'All',           icon: '≡'  },
  { key: 'food',         label: 'Food',          icon: '🍔' },
  { key: 'transport',    label: 'Transport',      icon: '🚗' },
  { key: 'shopping',     label: 'Shopping',       icon: '🛍' },
  { key: 'bills',        label: 'Bills',          icon: '⚡' },
  { key: 'entertainment',label: 'Entertainment',  icon: '🎬' },
  { key: 'health',       label: 'Health',         icon: '💊' },
  { key: 'education',    label: 'Education',      icon: '📚' },
  { key: 'other',        label: 'Other',          icon: '💰' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string      { return formatFull(n,    useAppStore.getState().currency); }
function fmtCompact(n: number): string { return formatCompact(n, useAppStore.getState().currency); }

function isInPeriod(date: string, period: Period): boolean {
  if (period === 'week')  return date >= WEEK_START && date <= TODAY;
  if (period === 'month') return date.startsWith(TODAY.substring(0, 7));
  return date.startsWith(TODAY.substring(0, 4));
}

function formatDateLabel(date: string): string {
  if (date === TODAY)     return 'Today';
  if (date === YESTERDAY) return 'Yesterday';
  const d = new Date(date + 'T12:00:00');
  return d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── TxIcon ───────────────────────────────────────────────────────────────────

function TxIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 18, lineHeight: 22 }}>{icon}</Text>;
}

// ─── SearchBar ────────────────────────────────────────────────────────────────

interface SearchBarProps {
  value:         string;
  onChangeText:  (t: string) => void;
  onClear:       () => void;
  placeholder?:  string;
}

function SearchBar({ value, onChangeText, onClear, placeholder = 'Search transactions…' }: SearchBarProps) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily } = theme;
  const [focused, setFocused] = useState(false);

  const borderAnim = useSharedValue(0);
  const animStyle  = useAnimatedStyle(() => ({
    borderColor: borderAnim.value === 1 ? colors.accent.primary : colors.border.subtle,
  }));

  return (
    <Animated.View
      style={[
        srchStyles.wrap,
        animStyle,
        {
          backgroundColor: colors.bg.surfaceMuted,
          borderRadius:    borderRadius.full,
          paddingHorizontal: spacing[4],
          borderWidth:     1,
          height:          44,
        },
      ]}
    >
      <Text style={{ fontSize: 16, color: colors.text.muted, marginRight: spacing[2] }}>🔍</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => {
          setFocused(true);
          borderAnim.value = withTiming(1, { duration: 150 });
        }}
        onBlur={() => {
          setFocused(false);
          borderAnim.value = withTiming(0, { duration: 150 });
        }}
        style={{
          flex:       1,
          fontSize:   fontSize.bodyMd,
          fontFamily: fontFamily.regular,
          color:      colors.text.primary,
          paddingVertical: 0,
        }}
      />

      {value.length > 0 && (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          style={[srchStyles.clearBtn, { backgroundColor: colors.bg.surfaceRaised, borderRadius: borderRadius.full }]}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Text style={{ fontSize: 11, color: colors.text.muted, fontFamily: fontFamily.bold }}>✕</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const srchStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  clearBtn: {
    width:          20,
    height:         20,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     6,
  },
});

// ─── PeriodToggle ─────────────────────────────────────────────────────────────

function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontFamily } = theme;

  const opts: { key: Period; label: string }[] = [
    { key: 'week',  label: 'Week'  },
    { key: 'month', label: 'Month' },
    { key: 'year',  label: 'Year'  },
  ];

  return (
    <View
      style={[
        ptStyles.wrap,
        {
          backgroundColor: colors.bg.surfaceMuted,
          borderRadius:    borderRadius.full,
          padding:         2,
          height:          34,
        },
      ]}
    >
      {opts.map(({ key, label }) => {
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[
              ptStyles.seg,
              {
                borderRadius:    borderRadius.full,
                paddingHorizontal: spacing[3],
                backgroundColor: active ? colors.bg.surfaceRaised : colors.transparent,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={`${label} view`}
          >
            <Text
              style={{
                fontSize:   11,
                fontFamily: active ? fontFamily.semiBold : fontFamily.medium,
                color:      active ? colors.text.primary : colors.text.muted,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const ptStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems:    'center',
    alignSelf:     'flex-start',
  },
  seg: {
    alignItems:     'center',
    justifyContent: 'center',
    height:         '100%',
  },
});

// ─── SummaryCards ─────────────────────────────────────────────────────────────

interface Summary { income: number; expense: number; net: number; count: number }

function SummaryCards({ s, period }: { s: Summary; period: Period }) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;

  const netPositive = s.net >= 0;
  const cards = [
    {
      label:   'Total Spent',
      value:   fmtCompact(s.expense),
      sub:     `${s.count} transactions`,
      color:   colors.expense,
      bg:      colors.expenseBg,
      icon:    '↓',
    },
    {
      label:   'Total Income',
      value:   fmtCompact(s.income),
      sub:     `this ${period}`,
      color:   colors.income,
      bg:      colors.incomeBg,
      icon:    '↑',
    },
    {
      label:   'Net Balance',
      value:   fmtCompact(Math.abs(s.net)),
      sub:     netPositive ? 'surplus' : 'deficit',
      color:   netPositive ? colors.income : colors.expense,
      bg:      netPositive ? colors.incomeBg : colors.expenseBg,
      icon:    netPositive ? '=' : '!',
    },
  ];

  return (
    <View style={[sumStyles.row, { gap: spacing[3] }]}>
      {cards.map((c, i) => (
        <View
          key={i}
          style={[
            sumStyles.card,
            shadows.sm,
            {
              backgroundColor: colors.bg.surface,
              borderRadius:    borderRadius.lg,
              padding:         spacing[4],
              flex:            1,
            },
          ]}
        >
          <View style={[sumStyles.iconBadge, { backgroundColor: c.bg, borderRadius: borderRadius.full }]}>
            <Text style={{ fontSize: 12, color: c.color, fontFamily: fontFamily.bold, lineHeight: 16 }}>
              {c.icon}
            </Text>
          </View>

          <Text
            style={{
              fontSize:      fontSize.headingMd,
              fontFamily:    fontFamily.bold,
              color:         colors.text.primary,
              letterSpacing: -0.4,
              marginTop:     spacing[2],
              lineHeight:    24,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {c.value}
          </Text>

          <Text
            style={{
              fontSize:   fontSize.bodySm,
              fontFamily: fontFamily.medium,
              color:      colors.text.secondary,
              marginTop:  2,
              lineHeight: 16,
            }}
            numberOfLines={1}
          >
            {c.label}
          </Text>

          <Text
            style={{
              fontSize:   10,
              fontFamily: fontFamily.regular,
              color:      colors.text.muted,
              marginTop:  2,
              lineHeight: 14,
            }}
            numberOfLines={1}
          >
            {c.sub}
          </Text>
        </View>
      ))}
    </View>
  );
}

const sumStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  card: {},
  iconBadge: {
    width:          28,
    height:         28,
    alignItems:     'center',
    justifyContent: 'center',
  },
});

// ─── CategoryBreakdown ────────────────────────────────────────────────────────

interface CatStat {
  key:    CategoryKey;
  label:  string;
  icon:   string;
  amount: number;
  count:  number;
}

function CategoryBreakdown({
  stats,
  selected,
  onSelect,
}: {
  stats:    CatStat[];
  selected: 'all' | CategoryKey;
  onSelect: (k: 'all' | CategoryKey) => void;
}) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows, categoryColors } = theme;

  if (stats.length === 0) return null;

  const total = stats.reduce((s, c) => s + c.amount, 0);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing[5], gap: spacing[3] }}
    >
      {stats.map((stat) => {
        const isActive   = selected === stat.key;
        const catColor   = categoryColors[stat.key];
        const iconBg     = getCategoryBgColor(stat.key);
        const pct        = total > 0 ? Math.round((stat.amount / total) * 100) : 0;

        return (
          <Pressable
            key={stat.key}
            onPress={() => onSelect(isActive ? 'all' : stat.key)}
            style={[
              catStyles.card,
              shadows.sm,
              {
                backgroundColor: isActive ? `${catColor}18` : colors.bg.surface,
                borderRadius:    borderRadius.lg,
                padding:         spacing[3],
                borderWidth:     1.5,
                borderColor:     isActive ? catColor : 'transparent',
                width:           96,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${stat.label}: ${fmt(stat.amount)}`}
          >
            <View style={[catStyles.iconCircle, { backgroundColor: iconBg, borderRadius: borderRadius.full }]}>
              <Text style={{ fontSize: 16, lineHeight: 20 }}>{stat.icon}</Text>
            </View>

            <Text
              style={{
                fontSize:   10,
                fontFamily: fontFamily.medium,
                color:      colors.text.secondary,
                marginTop:  spacing[2],
                lineHeight: 14,
              }}
              numberOfLines={1}
            >
              {stat.label.split(' ')[0]}
            </Text>

            <Text
              style={{
                fontSize:      fontSize.bodySm,
                fontFamily:    fontFamily.bold,
                color:         isActive ? catColor : colors.text.primary,
                marginTop:     2,
                letterSpacing: -0.2,
                lineHeight:    18,
              }}
              numberOfLines={1}
            >
              {fmtCompact(stat.amount)}
            </Text>

            <View
              style={[
                catStyles.pctBadge,
                {
                  backgroundColor: isActive ? catColor : colors.bg.surfaceMuted,
                  borderRadius:    borderRadius.full,
                  marginTop:       spacing[1],
                },
              ]}
            >
              <Text
                style={{
                  fontSize:   9,
                  fontFamily: fontFamily.semiBold,
                  color:      isActive ? '#FFFFFF' : colors.text.muted,
                }}
              >
                {pct}%
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const catStyles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
  },
  iconCircle: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  pctBadge: {
    paddingHorizontal: 6,
    paddingVertical:   2,
    alignSelf:         'flex-start',
  },
});

// ─── TypeToggle ───────────────────────────────────────────────────────────────

function TypeToggle({ value, onChange }: { value: TypeFilter; onChange: (v: TypeFilter) => void }) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily } = theme;

  const opts: { key: TypeFilter; label: string; color?: string }[] = [
    { key: 'all',     label: 'All'      },
    { key: 'expense', label: '↓ Expenses', color: colors.expense },
    { key: 'income',  label: '↑ Income',   color: colors.income  },
  ];

  return (
    <View style={[ttStyles.wrap, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full, padding: 2, height: 36 }]}>
      {opts.map(({ key, label, color }) => {
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[
              ttStyles.seg,
              {
                flex:            1,
                borderRadius:    borderRadius.full,
                backgroundColor: active ? (color ? `${color}20` : colors.bg.surfaceRaised) : colors.transparent,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
          >
            <Text
              style={{
                fontSize:   fontSize.bodySm,
                fontFamily: active ? fontFamily.semiBold : fontFamily.regular,
                color:      active ? (color ?? colors.text.primary) : colors.text.muted,
                textAlign:  'center',
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const ttStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  seg: {
    alignItems:     'center',
    justifyContent: 'center',
    height:         '100%',
  },
});

// ─── CategoryFilterChips ──────────────────────────────────────────────────────

function CategoryFilterChips({
  selected,
  onSelect,
  activeCounts,
}: {
  selected:     'all' | CategoryKey;
  onSelect:     (k: 'all' | CategoryKey) => void;
  activeCounts: Map<CategoryKey | 'all', number>;
}) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, categoryColors } = theme;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing[5], gap: spacing[2] }}
    >
      {CATEGORY_CHIPS.map(({ key, label, icon }) => {
        const active    = selected === key;
        const catColor  = key !== 'all' ? categoryColors[key as CategoryKey] : colors.accent.primary;
        const count     = activeCounts.get(key) ?? 0;
        const hasItems  = key === 'all' || count > 0;

        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key as 'all' | CategoryKey)}
            style={[
              chipStyles.chip,
              {
                backgroundColor: active
                  ? (key === 'all' ? colors.accent.primary : catColor)
                  : colors.bg.surface,
                borderRadius:    borderRadius.full,
                paddingHorizontal: spacing[3],
                paddingVertical:   spacing[1.5],
                borderWidth:     1,
                borderColor:     active
                  ? 'transparent'
                  : colors.border.subtle,
                opacity: hasItems ? 1 : 0.45,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Filter by ${label}`}
          >
            <Text style={{ fontSize: 12, marginRight: key === 'all' ? 0 : 4, lineHeight: 16 }}>
              {icon}
            </Text>
            {key !== 'all' && (
              <Text
                style={{
                  fontSize:   fontSize.bodySm,
                  fontFamily: active ? fontFamily.semiBold : fontFamily.medium,
                  color:      active ? '#FFFFFF' : colors.text.secondary,
                }}
              >
                {label}
              </Text>
            )}
            {key === 'all' && (
              <Text
                style={{
                  fontSize:   fontSize.bodySm,
                  fontFamily: active ? fontFamily.semiBold : fontFamily.medium,
                  color:      active ? '#FFFFFF' : colors.text.secondary,
                }}
              >
                All
              </Text>
            )}
            {count > 0 && key !== 'all' && (
              <View style={[chipStyles.badge, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.bg.surfaceMuted, borderRadius: borderRadius.full, marginLeft: 4 }]}>
                <Text style={{ fontSize: 9, fontFamily: fontFamily.bold, color: active ? '#FFFFFF' : colors.text.muted, lineHeight: 14 }}>
                  {count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  badge: {
    minWidth:          16,
    height:            16,
    paddingHorizontal: 3,
    alignItems:        'center',
    justifyContent:    'center',
  },
});

// ─── TransactionGroup ─────────────────────────────────────────────────────────

function TransactionGroup({
  dateLabel,
  items,
  dayTotal,
  onPressTx,
}: {
  dateLabel:  string;
  items:      Transaction[];
  dayTotal:   number;
  onPressTx?: (id: string, type: 'income' | 'expense') => void;
}) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;

  const netNeg = dayTotal < 0;

  return (
    <View style={{ marginBottom: spacing[4] }}>
      {/* Date header */}
      <View style={[grpStyles.header, { paddingHorizontal: spacing[5], marginBottom: spacing[2] }]}>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.muted, flex: 1 }}>
          {dateLabel}
        </Text>
        <View style={[
          grpStyles.dayBadge,
          {
            backgroundColor: netNeg ? colors.expenseBg : colors.incomeBg,
            borderRadius:    borderRadius.full,
          },
        ]}>
          <Text style={{ fontSize: 10, fontFamily: fontFamily.semiBold, color: netNeg ? colors.expense : colors.income }}>
            {netNeg ? '-' : '+'}{fmtCompact(Math.abs(dayTotal))}
          </Text>
        </View>
      </View>

      {/* Transaction rows */}
      <View
        style={[
          shadows.sm,
          {
            backgroundColor: colors.bg.surface,
            borderRadius:    borderRadius.card,
            marginHorizontal: spacing[5],
            overflow:         'hidden',
          },
        ]}
      >
        {items.map((tx, i) => (
          <ExpenseItem
            key={tx.id}
            id={tx.id}
            merchant={tx.merchant}
            categoryKey={tx.category}
            categoryLabel={tx.label}
            categoryIcon={<TxIcon icon={tx.icon} />}
            amount={fmt(tx.amount)}
            type={tx.type}
            date={tx.note ?? tx.label}
            time={tx.time}
            showDivider={i < items.length - 1}
            onPress={onPressTx ? () => onPressTx(tx.id, tx.type) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const grpStyles = StyleSheet.create({
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  dayBadge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
});

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ hasActiveFilters, onClear }: { hasActiveFilters: boolean; onClear: () => void }) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily } = theme;

  return (
    <View style={emptyStyles.wrap}>
      <View style={[emptyStyles.iconCircle, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full }]}>
        <Text style={{ fontSize: 36, lineHeight: 44 }}>{hasActiveFilters ? '🔍' : '💸'}</Text>
      </View>
      <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, textAlign: 'center', marginTop: spacing[4] }}>
        {hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
      </Text>
      <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', marginTop: spacing[2], lineHeight: 22 }}>
        {hasActiveFilters
          ? 'Try adjusting your filters or\nclearing the search'
          : 'Add your first expense to\nstart tracking your spending'}
      </Text>
      {hasActiveFilters && (
        <Pressable
          onPress={onClear}
          style={[
            emptyStyles.clearBtn,
            { backgroundColor: colors.accent.muted, borderRadius: borderRadius.button, marginTop: spacing[5] },
          ]}
          accessibilityRole="button"
        >
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>
            Clear Filters
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width:          80,
    height:         80,
    alignItems:     'center',
    justifyContent: 'center',
  },
  clearBtn: {
    paddingHorizontal: 24,
    paddingVertical:   12,
  },
});

// ─── ActiveFilterBar ──────────────────────────────────────────────────────────

function ActiveFilterBar({
  count,
  category,
  typeFilter,
  searchQuery,
  onClear,
}: {
  count:       number;
  category:    'all' | CategoryKey;
  typeFilter:  TypeFilter;
  searchQuery: string;
  onClear:     () => void;
}) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily } = theme;

  const hasFilters = category !== 'all' || typeFilter !== 'all' || searchQuery.length > 0;
  const totalLabel = `${count} result${count !== 1 ? 's' : ''}`;

  return (
    <View style={[afbStyles.wrap, { paddingHorizontal: spacing[5] }]}>
      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted }}>
        {totalLabel}
      </Text>

      {hasFilters && (
        <Pressable
          onPress={onClear}
          style={[
            afbStyles.clearBtn,
            { backgroundColor: colors.accent.muted, borderRadius: borderRadius.full },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
        >
          <Text style={{ fontSize: 10, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>
            ✕ Clear filters
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const afbStyles = StyleSheet.create({
  wrap: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical:   4,
  },
});

// ─── ExpenseScreen ────────────────────────────────────────────────────────────

export function ExpenseScreen({ navigation, route }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const { data: rawTxns } = useTransactions();

  // Map seed Transaction shape → local Transaction shape
  const allTransactions = useMemo<Transaction[]>(() => {
    return (rawTxns ?? []).map(t => ({
      id:       t.id,
      merchant: t.merchant,
      category: t.category,
      label:    t.categoryLabel,
      icon:     t.categoryIcon,
      amount:   t.amount,
      type:     t.type,
      date:     t.date,
      time:     t.time,
      note:     t.note,
    }));
  }, [rawTxns]);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [period,       setPeriod]       = useState<Period>('month');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [catFilter,    setCatFilter]    = useState<'all' | CategoryKey>('all');
  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>('all');
  const [minAmount,    setMinAmount]    = useState<number | null>(null);
  const [maxAmount,    setMaxAmount]    = useState<number | null>(null);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 34 : 24);

  // ── Filtered transactions ───────────────────────────────────────────────────
  const filtered = useMemo<Transaction[]>(() => {
    let result = allTransactions.filter(tx => isInPeriod(tx.date, period));

    if (typeFilter !== 'all') {
      result = result.filter(tx => tx.type === typeFilter);
    }
    if (catFilter !== 'all') {
      result = result.filter(tx => tx.category === catFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(tx =>
        tx.merchant.toLowerCase().includes(q) ||
        tx.label.toLowerCase().includes(q)    ||
        (tx.note ?? '').toLowerCase().includes(q),
      );
    }
    if (minAmount !== null) result = result.filter(tx => tx.amount >= minAmount);
    if (maxAmount !== null) result = result.filter(tx => tx.amount <= maxAmount);
    return result;
  }, [allTransactions, period, typeFilter, catFilter, searchQuery, minAmount, maxAmount]);

  // ── Grouped by date ─────────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      const dc = b.date.localeCompare(a.date);
      return dc !== 0 ? dc : b.time.localeCompare(a.time);
    });
    const map = new Map<string, Transaction[]>();
    for (const tx of sorted) {
      const lbl = formatDateLabel(tx.date);
      if (!map.has(lbl)) map.set(lbl, []);
      map.get(lbl)!.push(tx);
    }
    return Array.from(map.entries()).map(([label, items]) => {
      const dayNet = items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
      return { label, items, dayNet };
    });
  }, [filtered]);

  // ── Summary ─────────────────────────────────────────────────────────────────
  const summary = useMemo<Summary>(() => {
    const income  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense, count: filtered.length };
  }, [filtered]);

  // ── Category breakdown stats (expense only, period filter only) ─────────────
  const categoryStats = useMemo<CatStat[]>(() => {
    const periodTxs = allTransactions.filter(t => t.type === 'expense' && isInPeriod(t.date, period));
    const map = new Map<CategoryKey, CatStat>();
    for (const tx of periodTxs) {
      const curr = map.get(tx.category) ?? { key: tx.category, label: tx.label, icon: tx.icon, amount: 0, count: 0 };
      map.set(tx.category, { ...curr, amount: curr.amount + tx.amount, count: curr.count + 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [allTransactions, period]);

  // ── Chip counts (for current period + type filter, before cat filter) ────────
  const chipCounts = useMemo(() => {
    const base = allTransactions.filter(t => {
      if (!isInPeriod(t.date, period)) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return t.merchant.toLowerCase().includes(q) || t.label.toLowerCase().includes(q);
      }
      return true;
    });
    const map = new Map<CategoryKey | 'all', number>();
    map.set('all', base.length);
    for (const tx of base) {
      map.set(tx.category, (map.get(tx.category) ?? 0) + 1);
    }
    return map;
  }, [allTransactions, period, typeFilter, searchQuery]);

  // ── Sync incoming filter params (from FilterSheet) ─────────────────────────
  useEffect(() => {
    const p = route.params;
    if (!p) return;
    if (p.type    !== undefined) setTypeFilter(p.type as TypeFilter);
    if (p.period  !== undefined) setPeriod(p.period as Period);
    setMinAmount(p.minAmount ?? null);
    setMaxAmount(p.maxAmount ?? null);
  }, [route.params]);

  // ── Clear all filters ───────────────────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setCatFilter('all');
    setTypeFilter('all');
    setMinAmount(null);
    setMaxAmount(null);
  }, []);

  const hasActiveFilters = catFilter !== 'all' || typeFilter !== 'all' || searchQuery.length > 0 || minAmount !== null || maxAmount !== null;

  // ── Entrance animations ─────────────────────────────────────────────────────
  const headerAnim  = useSharedValue(0);
  const sumAnim     = useSharedValue(0);
  const catAnim     = useSharedValue(0);
  const filterAnim  = useSharedValue(0);
  const listAnim    = useSharedValue(0);

  useEffect(() => {
    const e = Easing.out(Easing.cubic);
    headerAnim.value = withDelay(0,   withTiming(1, { duration: 400, easing: e }));
    sumAnim.value    = withDelay(80,  withTiming(1, { duration: 440, easing: e }));
    catAnim.value    = withDelay(160, withTiming(1, { duration: 440, easing: e }));
    filterAnim.value = withDelay(240, withTiming(1, { duration: 440, easing: e }));
    listAnim.value   = withDelay(320, withTiming(1, { duration: 480, easing: e }));
  }, []);

  const headerStyle  = useAnimatedStyle(() => ({
    opacity:   headerAnim.value,
    transform: [{ translateY: interpolate(headerAnim.value,  [0, 1], [12, 0]) }],
  }));
  const sumStyle     = useAnimatedStyle(() => ({
    opacity:   sumAnim.value,
    transform: [{ translateY: interpolate(sumAnim.value,     [0, 1], [20, 0]) }],
  }));
  const catStyle_    = useAnimatedStyle(() => ({
    opacity:   catAnim.value,
    transform: [{ translateY: interpolate(catAnim.value,     [0, 1], [18, 0]) }],
  }));
  const filterStyle  = useAnimatedStyle(() => ({
    opacity:   filterAnim.value,
    transform: [{ translateY: interpolate(filterAnim.value,  [0, 1], [16, 0]) }],
  }));
  const listStyle    = useAnimatedStyle(() => ({
    opacity:   listAnim.value,
    transform: [{ translateY: interpolate(listAnim.value,    [0, 1], [16, 0]) }],
  }));

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={[scr.root, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[scr.scroll, { paddingTop: topPad + spacing[2], paddingBottom: btmPad + spacing[8] }]}
      >
        {/* ── 1. Header ──────────────────────────────────────────────────────── */}
        <Animated.View style={[scr.headerRow, headerStyle, { paddingHorizontal: spacing[5] }]}>
          <View>
            <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, letterSpacing: -0.4, lineHeight: 28 }}>
              Transactions
            </Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
              {allTransactions.length} total transactions
            </Text>
          </View>

          <View style={scr.headerRight}>
            <PeriodToggle value={period} onChange={setPeriod} />

            {/* Filter button */}
            <Pressable
              onPress={() => navigation.push('Filter', {
                current: { type: typeFilter, period, minAmount: minAmount ?? undefined, maxAmount: maxAmount ?? undefined },
              })}
              style={[
                scr.iconBtn,
                {
                  backgroundColor: hasActiveFilters ? colors.accent.muted : colors.bg.surface,
                  borderRadius:    borderRadius.full,
                  borderWidth:     1,
                  borderColor:     hasActiveFilters ? colors.accent.primary : colors.border.subtle,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Filter transactions"
            >
              <Text style={{ fontSize: 16, color: hasActiveFilters ? colors.accent.primary : colors.text.secondary }}>≡</Text>
            </Pressable>

            {/* Add button */}
            <Pressable
              onPress={() => navigation.getParent()?.getParent()?.navigate('QuickAddSheet')}
              style={[
                scr.addBtn,
                { backgroundColor: colors.accent.primary, borderRadius: borderRadius.full },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Add new transaction"
            >
              <Text style={{ fontSize: 20, color: '#FFFFFF', fontFamily: fontFamily.bold, lineHeight: 24 }}>+</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── 2. Summary Cards ───────────────────────────────────────────────── */}
        <Animated.View style={[{ paddingHorizontal: spacing[5], marginTop: spacing[5] }, sumStyle]}>
          <SummaryCards s={summary} period={period} />
        </Animated.View>

        {/* ── 3. Expense Categories breakdown ────────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[5] }, catStyle_]}>
          <SectionHeader
            title="Expense Categories"
            actionLabel="View All"
            onAction={() => {}}
            style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}
          />
          <CategoryBreakdown
            stats={categoryStats}
            selected={catFilter}
            onSelect={setCatFilter}
          />
        </Animated.View>

        {/* ── 4. Search + filters ─────────────────────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[5] }, filterStyle]}>
          {/* Search bar */}
          <View style={{ paddingHorizontal: spacing[5] }}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={() => setSearchQuery('')}
            />
          </View>

          {/* Category filter chips */}
          <View style={{ marginTop: spacing[3] }}>
            <CategoryFilterChips
              selected={catFilter}
              onSelect={setCatFilter}
              activeCounts={chipCounts}
            />
          </View>

          {/* Type toggle */}
          <View style={{ paddingHorizontal: spacing[5], marginTop: spacing[3] }}>
            <TypeToggle value={typeFilter} onChange={setTypeFilter} />
          </View>
        </Animated.View>

        {/* ── 5. Results count + clear ────────────────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[4] }, filterStyle]}>
          <ActiveFilterBar
            count={filtered.length}
            category={catFilter}
            typeFilter={typeFilter}
            searchQuery={searchQuery}
            onClear={clearFilters}
          />
        </Animated.View>

        {/* ── 6. Transaction list / empty state ───────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[3] }, listStyle]}>
          {grouped.length === 0 ? (
            <EmptyState hasActiveFilters={hasActiveFilters} onClear={clearFilters} />
          ) : (
            grouped.map(({ label, items, dayNet }) => (
              <TransactionGroup
                key={label}
                dateLabel={label}
                items={items}
                dayTotal={dayNet}
                onPressTx={(id, type) => navigation.push('TransactionDetail', { id, type })}
              />
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const scr = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  addBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
  },
});

export default ExpenseScreen;
