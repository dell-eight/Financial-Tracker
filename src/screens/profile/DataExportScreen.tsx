import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { File, Paths } from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { useAssets, useDebts } from '../../hooks/queries/useNetWorth';
import { useBudgets } from '../../hooks/queries/useBudgets';
import type { HomeStackParamList } from '../../navigation/types';
import type { Transaction, Budget, AssetItem, DebtItem } from '../../types/models';

type Props   = StackScreenProps<HomeStackParamList, 'DataExport'>;
type Format  = 'csv' | 'pdf' | 'json';
type Range   = 'month' | '3months' | 'year' | 'all';

const FORMAT_OPTIONS: { value: Format; label: string; icon: string; desc: string }[] = [
  { value: 'csv',  label: 'CSV',  icon: '📊', desc: 'Spreadsheet-compatible' },
  { value: 'pdf',  label: 'PDF',  icon: '📄', desc: 'Print-ready report'     },
  { value: 'json', label: 'JSON', icon: '🔧', desc: 'Raw data for developers' },
];

const RANGE_OPTIONS: { value: Range; label: string; months: number }[] = [
  { value: 'month',   label: 'This Month',    months: 1  },
  { value: '3months', label: 'Last 3 Months', months: 3  },
  { value: 'year',    label: 'This Year',     months: 12 },
  { value: 'all',     label: 'All Time',      months: 24 },
];

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCsv(v: string | number | undefined | null): string {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCsv(
  txns:    Transaction[],
  budgets: Budget[]    | undefined,
  assets:  AssetItem[] | undefined,
  debts:   DebtItem[]  | undefined,
  opts:    { inclTxns: boolean; inclBudgets: boolean; inclNetWorth: boolean },
): string {
  const sections: string[] = [];

  if (opts.inclTxns && txns.length > 0) {
    const header = ['Date', 'Time', 'Type', 'Merchant', 'Category', 'Amount', 'Account', 'Note'];
    const rows   = txns.map(t =>
      [t.date, t.time, t.type, t.merchant, t.categoryLabel, t.amount, t.accountName ?? '', t.note ?? '']
        .map(escapeCsv).join(','),
    );
    sections.push('TRANSACTIONS\n' + [header.join(','), ...rows].join('\n'));
  }

  if (opts.inclBudgets && budgets && budgets.length > 0) {
    const header = ['Category', 'Limit', 'Spent', 'Remaining'];
    const rows   = budgets.map(b =>
      [b.label, b.limit, b.spent, b.limit - b.spent].map(escapeCsv).join(','),
    );
    sections.push('BUDGET CATEGORIES\n' + [header.join(','), ...rows].join('\n'));
  }

  if (opts.inclNetWorth) {
    if (assets && assets.length > 0) {
      const rows = assets.map(a => [a.name, a.category, a.balance].map(escapeCsv).join(','));
      sections.push('ASSETS\nName,Category,Balance\n' + rows.join('\n'));
    }
    if (debts && debts.length > 0) {
      const rows = debts.map(d => [d.name, d.category, d.balance, d.interestRate].map(escapeCsv).join(','));
      sections.push('DEBTS\nName,Category,Balance,Interest Rate\n' + rows.join('\n'));
    }
  }

  return sections.join('\n\n');
}

function buildJson(
  txns:    Transaction[],
  budgets: Budget[]    | undefined,
  assets:  AssetItem[] | undefined,
  debts:   DebtItem[]  | undefined,
  opts:    { inclTxns: boolean; inclBudgets: boolean; inclNetWorth: boolean },
): string {
  const payload: Record<string, any> = { exportedAt: new Date().toISOString() };
  if (opts.inclTxns)     payload.transactions = txns;
  if (opts.inclBudgets)  payload.budgets      = budgets  ?? [];
  if (opts.inclNetWorth) { payload.assets = assets ?? []; payload.debts = debts ?? []; }
  return JSON.stringify(payload, null, 2);
}

// ─── DataExportScreen ─────────────────────────────────────────────────────────

export function DataExportScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;

  const { data: txns    } = useTransactions();
  const { data: assets  } = useAssets();
  const { data: debts   } = useDebts();
  const { data: budgets } = useBudgets();

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const [format, setFormat]             = useState<Format>('csv');
  const [range, setRange]               = useState<Range>('month');
  const [inclTxns, setInclTxns]         = useState(true);
  const [inclBudgets, setInclBudgets]   = useState(true);
  const [inclNetWorth, setInclNetWorth] = useState(false);
  const [exporting, setExporting]       = useState(false);
  const [exported, setExported]         = useState(false);

  const exportUriRef = useRef<string | null>(null);

  const selectedRange = RANGE_OPTIONS.find(r => r.value === range)!;
  const cutoff        = new Date();
  cutoff.setMonth(cutoff.getMonth() - selectedRange.months);
  const filteredTxns  = (txns ?? []).filter(t => range === 'all' || new Date(t.date) >= cutoff);
  const recordCount   = filteredTxns.length + (inclNetWorth ? (assets?.length ?? 0) + (debts?.length ?? 0) : 0);
  const fileSizeKB    = format === 'pdf' ? Math.max(48, recordCount * 2.1) : format === 'json' ? recordCount * 0.8 : recordCount * 0.3;

  const a = [0, 1, 2, 3].map(() => useSharedValue(0));
  useEffect(() => {
    a.forEach((sv, i) => {
      sv.value = 0;
      sv.value = withDelay(i * 70, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    });
  }, []);
  const as = a.map(sv => useAnimatedStyle(() => ({ opacity: sv.value, transform: [{ translateY: (1 - sv.value) * 12 }] })));

  const progress = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` as any }));

  async function handleExport() {
    if (format === 'pdf') {
      Alert.alert('PDF Export', 'PDF export is not yet available. Please use CSV or JSON.');
      return;
    }

    setExporting(true);
    setExported(false);
    exportUriRef.current = null;
    progress.value = 0;
    progress.value = withTiming(0.8, { duration: 1200, easing: Easing.out(Easing.quad) });

    try {
      const content = format === 'csv'
        ? buildCsv(filteredTxns, budgets, assets, debts, { inclTxns, inclBudgets, inclNetWorth })
        : buildJson(filteredTxns, budgets, assets, debts, { inclTxns, inclBudgets, inclNetWorth });

      const filename = `financial-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      const file     = new File(Paths.cache, filename);
      file.write(content);

      exportUriRef.current = file.uri;
      progress.value = withTiming(1, { duration: 200 });
      setExported(true);
    } catch {
      Alert.alert('Export Failed', 'Could not generate the export file. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function handleDownload() {
    const uri = exportUriRef.current;
    if (!uri) return;

    const mimeType = format === 'json' ? 'application/json' : 'text/csv';
    const filename  = uri.split('/').pop() ?? `export.${format}`;

    if (Platform.OS === 'android') {
      try {
        const file    = new File(uri);
        const content = await file.text();

        // Reuse a previously granted Downloads permission if available
        let directoryUri = await AsyncStorage.getItem('downloads_saf_uri');

        if (!directoryUri) {
          // First time: open folder picker pre-navigated to Downloads
          const downloadsUri = StorageAccessFramework.getUriForDirectoryInRoot('Download');
          const result = await StorageAccessFramework.requestDirectoryPermissionsAsync(downloadsUri);
          if (!result.granted) return;
          directoryUri = result.directoryUri;
          await AsyncStorage.setItem('downloads_saf_uri', directoryUri);
        }

        try {
          const destUri = await StorageAccessFramework.createFileAsync(directoryUri, filename, mimeType);
          await StorageAccessFramework.writeAsStringAsync(destUri, content);
          Alert.alert('Saved to Downloads', `${filename} is now in your Downloads folder.`);
        } catch {
          // Saved URI may have been revoked — clear it and ask again next time
          await AsyncStorage.removeItem('downloads_saf_uri');
          Alert.alert('Permission Expired', 'Please tap Save again to re-grant Downloads access.');
        }
      } catch {
        Alert.alert('Save Failed', 'Could not save to Downloads. Please try again.');
      }
    } else {
      // iOS — share sheet with "Save to Files" is the standard save mechanism
      try {
        await Sharing.shareAsync(uri, {
          mimeType,
          dialogTitle: 'Save export to Files',
          UTI: format === 'json' ? 'public.json' : 'public.comma-separated-values-text',
        });
      } catch {
        Alert.alert('Save Failed', 'Unable to open the save dialog. Please try again.');
      }
    }
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />
      <View style={[s.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Export Data</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* Format selector */}
        <Animated.View style={[as[0], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
              Export Format
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              {FORMAT_OPTIONS.map(opt => {
                const active  = format === opt.value;
                const isPdf   = opt.value === 'pdf';
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => { setFormat(opt.value); setExported(false); }}
                    style={{
                      flex: 1,
                      paddingVertical: spacing[3],
                      borderRadius: borderRadius.lg,
                      alignItems: 'center',
                      backgroundColor: active ? colors.accent.primary + '20' : colors.bg.surfaceMuted,
                      borderWidth: 1.5,
                      borderColor: active ? colors.accent.primary : 'transparent',
                      opacity: isPdf ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</Text>
                    <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.bold, color: active ? colors.accent.primary : colors.text.primary }}>{opt.label}</Text>
                    <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', marginTop: 2 }}>
                      {isPdf ? 'Coming soon' : opt.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Date range */}
        <Animated.View style={[as[1], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
              Date Range
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
              {RANGE_OPTIONS.map(opt => {
                const active = range === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => { setRange(opt.value); setExported(false); }}
                    style={{
                      paddingVertical: spacing[2],
                      paddingHorizontal: spacing[3],
                      borderRadius: borderRadius.full,
                      backgroundColor: active ? colors.accent.primary : colors.bg.surfaceMuted,
                    }}
                  >
                    <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: active ? colors.white : colors.text.secondary }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Include sections */}
        <Animated.View style={[as[2], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, paddingHorizontal: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, paddingVertical: spacing[3], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle }}>
              Include
            </Text>
            {[
              { label: 'Transactions',       icon: '💳', count: filteredTxns.length,                                   value: inclTxns,     set: setInclTxns     },
              { label: 'Budget Categories',  icon: '📊', count: budgets?.length ?? 0,                                  value: inclBudgets,  set: setInclBudgets  },
              { label: 'Assets & Net Worth', icon: '🏦', count: (assets?.length ?? 0) + (debts?.length ?? 0),         value: inclNetWorth, set: setInclNetWorth },
            ].map((item, i, arr) => (
              <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[3], borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.border.subtle }}>
                <Text style={{ fontSize: 18, marginRight: spacing[3] }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>{item.label}</Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>{item.count} records</Text>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={v => { item.set(v); setExported(false); }}
                  trackColor={{ false: colors.bg.surfaceMuted, true: colors.accent.muted }}
                  thumbColor={item.value ? colors.accent.primary : colors.text.muted}
                />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Summary & export */}
        <Animated.View style={[as[3], { marginHorizontal: spacing[5] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
              Export Summary
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing[4], marginBottom: spacing[4] }}>
              {[
                { label: 'Records',   value: `${recordCount}` },
                { label: 'Format',    value: format.toUpperCase() },
                { label: 'Est. Size', value: `~${Math.round(fileSizeKB)}KB` },
              ].map(stat => (
                <View key={stat.label} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary }}>{stat.value}</Text>
                  <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Progress bar (during export) */}
            {exporting && (
              <View style={{ height: 6, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99, overflow: 'hidden', marginBottom: spacing[3] }}>
                <Animated.View style={[progressStyle, { height: '100%', backgroundColor: colors.accent.primary, borderRadius: 99 }]} />
              </View>
            )}

            {exported ? (
              <View style={{ gap: spacing[2] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.income + '15', borderRadius: borderRadius.lg, padding: spacing[3] }}>
                  <Text style={{ fontSize: 18 }}>✅</Text>
                  <Text style={{ flex: 1, fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.income }}>Export ready — {Math.round(fileSizeKB)}KB</Text>
                </View>
                <Pressable
                  onPress={handleDownload}
                  style={{ backgroundColor: colors.income, borderRadius: borderRadius.button, height: 48, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.white }}>⬇ Share / Save {format.toUpperCase()}</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handleExport}
                disabled={exporting || recordCount === 0}
                style={({ pressed }) => ({
                  backgroundColor: exporting || recordCount === 0 ? colors.bg.surfaceMuted : pressed ? colors.accent.pressed : colors.accent.primary,
                  borderRadius: borderRadius.button,
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: exporting || recordCount === 0 ? colors.text.muted : colors.white }}>
                  {exporting ? 'Generating…' : `Generate ${format.toUpperCase()} Export`}
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

export default DataExportScreen;
