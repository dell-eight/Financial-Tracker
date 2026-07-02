import React, { useState } from 'react';
import Animated from 'react-native-reanimated';
import { useScreenAnimation } from '../../hooks/ui/useScreenAnimation';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useNetworkStatus } from '../../hooks/ui/useNetworkStatus';
import { TRANSACTIONS_KEY } from '../../hooks/queries/useTransactions';
import { DASHBOARD_KEY } from '../../hooks/queries/useDashboard';
import { useCurrency, formatMoneyInput } from '../../utils/currency';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { ASSETS_KEY } from '../../hooks/queries/useNetWorth';
import { addIncome, RECURRING_FREQUENCY_LABELS, type RecurringFrequency } from '../../services/finance.service';
import type { TransactionsStackParamList } from '../../navigation/types';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import type { CategoryKey } from '../../theme';
import type { Account } from '../../types/models';

type Props = StackScreenProps<TransactionsStackParamList, 'AddIncome'>;

type IncomeCatKey = Extract<CategoryKey, 'income_salary' | 'income_freelance' | 'income_other'>;

const INCOME_CATS: { key: IncomeCatKey; label: string; icon: string; description: string }[] = [
  { key: 'income_salary',    label: 'Salary',       icon: '💼', description: 'Regular paycheck or wage' },
  { key: 'income_freelance', label: 'Freelance',     icon: '💻', description: 'Contract or gig work' },
  { key: 'income_other',     label: 'Other Income',  icon: '💰', description: 'Investments, gifts, dividends' },
];

function toLocalDateStr(d: Date): string {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function AddIncomeScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const { symbol, fmt } = useCurrency();

  const { data: accounts = [] } = useAccounts();

  const [amountStr,         setAmountStr]         = useState('');
  const [selectedCat,       setSelectedCat]       = useState<IncomeCatKey | null>(null);
  const [description,       setDescription]       = useState('');
  const [note,              setNote]              = useState('');
  const [toAccount,         setToAccount]         = useState<Account | null>(null);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [saveError,         setSaveError]         = useState<string | null>(null);
  const [selectedDate,      setSelectedDate]      = useState(() => new Date());
  const [pickerMode,        setPickerMode]        = useState<'date' | 'time' | null>(null);
  const [tempDate,          setTempDate]          = useState(() => new Date());
  const [isRecurring,       setIsRecurring]       = useState(false);
  const [recurringFreq,     setRecurringFreq]     = useState<RecurringFrequency>('monthly');

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const parsedAmount = parseFloat(amountStr);
  const canSave      = amountStr.length > 0 && !isNaN(parsedAmount) && parsedAmount > 0 && selectedCat !== null && toAccount !== null;

  function handleAmountChange(text: string) {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts   = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] !== undefined && parts[1].length > 2) return;
    setAmountStr(cleaned);
  }

  function openDatePicker() {
    setTempDate(selectedDate);
    setPickerMode('date');
    Haptics.selectionAsync();
  }

  function openTimePicker() {
    setTempDate(selectedDate);
    setPickerMode('time');
    Haptics.selectionAsync();
  }

  function confirmPicker() {
    setSelectedDate(tempDate);
    setPickerMode(null);
  }

  const SOURCE_TYPE: Record<IncomeCatKey, string> = {
    income_salary:    'salary',
    income_freelance: 'freelance',
    income_other:     'other',
  };

  async function handleSave() {
    if (!canSave || !selectedCat || saving) return;
    if (!isOnline) { setSaveError('No internet connection. Please try again when online.'); return; }
    const cat = INCOME_CATS.find(c => c.key === selectedCat)!;
    setSaving(true);
    setSaveError(null);
    try {
      await addIncome({
        description:         description.trim() || cat.label,
        sourceName:          cat.label,
        sourceType:          SOURCE_TYPE[selectedCat],
        sourceIcon:          cat.icon,
        amount:              parsedAmount,
        date:                toLocalDateStr(selectedDate),
        note:                note.trim() || undefined,
        toAccountId:         toAccount?.id,
        toCurrentBalance:    toAccount?.balance,
        isRecurring:         isRecurring,
        recurringFrequency:  isRecurring ? recurringFreq : undefined,
      });
      const keys: Promise<void>[] = [
        queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
      ];
      if (toAccount) keys.push(queryClient.invalidateQueries({ queryKey: ASSETS_KEY }));
      await Promise.all(keys);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('TransactionList', undefined);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save. Please try again.');
      setSaving(false);
    }
  }

  const H_PAD = spacing[5];

  const [headerStyle, categoryStyle, formStyle] = useScreenAnimation(3);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.bg.base }]}
    >
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: H_PAD, paddingBottom: spacing[3] }, headerStyle]}>
        <Pressable onPress={() => navigation.navigate('TransactionList', undefined)} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>
            Cancel
          </Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Add Income
        </Text>
        <Pressable onPress={handleSave} disabled={!canSave || saving} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: (canSave && !saving) ? colors.accent.primary : colors.text.muted }}>
            {saving ? '…' : 'Save'}
          </Text>
        </Pressable>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: spacing[4] }}
      >
        {/* ── Amount ──────────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.amountSection, { paddingVertical: spacing[5], paddingHorizontal: H_PAD }, categoryStyle]}>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3] }}>
            AMOUNT
          </Text>
          <View style={styles.amountRow}>
            <Text style={{ fontSize: 44, fontFamily: fontFamily.bold, color: amountStr ? colors.income : colors.text.muted, lineHeight: 52, marginRight: 4 }}>
              {symbol}
            </Text>
            <TextInput
              value={formatMoneyInput(amountStr)}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              style={{ fontSize: 44, fontFamily: fontFamily.bold, color: colors.text.primary, minWidth: 100, padding: 0 }}
            />
          </View>
          <View style={{ width: 160, height: 2, backgroundColor: amountStr ? colors.income : colors.border.subtle, borderRadius: 1, marginTop: spacing[2] }} />
        </Animated.View>

        {/* ── Income source ────────────────────────────────────────────────────── */}
        <Animated.View style={[{ paddingHorizontal: H_PAD, marginBottom: spacing[5] }, formStyle]}>
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
        </Animated.View>

        {/* ── Deposit to Account ──────────────────────────────────────────────── */}
        <Animated.View style={formStyle}>
        <View style={{ paddingHorizontal: H_PAD, marginBottom: spacing[5] }}>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3] }}>
            DEPOSIT TO ACCOUNT
          </Text>
          <Pressable
            onPress={() => { setAccountPickerOpen(o => !o); Haptics.selectionAsync(); }}
            style={[
              {
                backgroundColor: colors.bg.surface,
                borderRadius:    borderRadius.card,
                borderWidth:     1,
                borderColor:     accountPickerOpen ? colors.income : colors.border.subtle,
                padding:         spacing[4],
                flexDirection:   'row',
                alignItems:      'center',
              },
              shadows.sm,
            ]}
          >
            <Text style={{ fontSize: 18, marginRight: spacing[3] }}>🏦</Text>
            <View style={{ flex: 1 }}>
              {toAccount ? (
                <>
                  <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
                    {toAccount.institutionName}
                  </Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                    {toAccount.maskedNumber} · {fmt(toAccount.balance)}
                  </Text>
                </>
              ) : (
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted }}>
                  Select account
                </Text>
              )}
            </View>
            <Text style={{ fontSize: 14, color: accountPickerOpen ? colors.income : colors.text.muted }}>
              {accountPickerOpen ? '▲' : '▼'}
            </Text>
          </Pressable>

          {accountPickerOpen && (
            <View style={[
              {
                backgroundColor: colors.bg.surfaceRaised,
                borderRadius:    borderRadius.card,
                marginTop:       spacing[1],
                borderWidth:     1,
                borderColor:     colors.border.subtle,
                overflow:        'hidden',
              },
              shadows.card,
            ]}>
              {accounts.map((acc, i) => (
                <Pressable
                  key={acc.id}
                  onPress={() => { setToAccount(acc); setAccountPickerOpen(false); Haptics.selectionAsync(); }}
                  style={({ pressed }) => ({
                    flexDirection:    'row',
                    alignItems:       'center',
                    padding:          spacing[4],
                    backgroundColor:  pressed ? colors.bg.surfaceMuted : 'transparent',
                    borderBottomWidth: i < accounts.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: colors.border.subtle,
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.bodyMd, fontFamily: toAccount?.id === acc.id ? fontFamily.semiBold : fontFamily.medium, color: toAccount?.id === acc.id ? colors.income : colors.text.primary }}>
                      {acc.institutionName}
                    </Text>
                    <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                      {acc.maskedNumber}
                    </Text>
                  </View>
                  <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
                    {fmt(acc.balance)}
                  </Text>
                  {toAccount?.id === acc.id && (
                    <Text style={{ fontSize: 14, color: colors.income, marginLeft: spacing[2] }}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}
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
            <Pressable
              onPress={openDatePicker}
              style={[styles.detailRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle, paddingHorizontal: spacing[4] }]}
            >
              <Text style={{ fontSize: 16, marginRight: spacing[3] }}>📅</Text>
              <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.primary, paddingVertical: spacing[3] }}>
                {formatDate(selectedDate)}
              </Text>
              <Text style={{ fontSize: 12, color: colors.text.muted }}>›</Text>
            </Pressable>
            {/* Time */}
            <Pressable
              onPress={openTimePicker}
              style={[styles.detailRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle, paddingHorizontal: spacing[4] }]}
            >
              <Text style={{ fontSize: 16, marginRight: spacing[3] }}>⏰</Text>
              <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.primary, paddingVertical: spacing[3] }}>
                {formatTime(selectedDate)}
              </Text>
              <Text style={{ fontSize: 12, color: colors.text.muted }}>›</Text>
            </Pressable>
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

        {/* ── Repeat ──────────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: spacing[5] }}>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3] }}>
            REPEAT
          </Text>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, overflow: 'hidden' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3] }}>
              <Text style={{ fontSize: 16, marginRight: spacing[3] }}>🔁</Text>
              <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>
                Recurring income
              </Text>
              <Switch
                value={isRecurring}
                onValueChange={(v) => { setIsRecurring(v); Haptics.selectionAsync(); }}
                trackColor={{ false: colors.border.subtle, true: `${colors.income}80` }}
                thumbColor={isRecurring ? colors.income : colors.bg.surfaceMuted}
              />
            </View>
            {isRecurring && (
              <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border.subtle, paddingHorizontal: spacing[4], paddingVertical: spacing[3] }}>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted, marginBottom: spacing[2] }}>
                  Frequency
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
                  {(['daily', 'weekly', 'semimonthly', 'monthly', 'yearly'] as RecurringFrequency[]).map(freq => (
                    <Pressable
                      key={freq}
                      onPress={() => { setRecurringFreq(freq); Haptics.selectionAsync(); }}
                      style={{
                        paddingHorizontal: spacing[3],
                        paddingVertical:   spacing[1],
                        borderRadius:      borderRadius.full,
                        backgroundColor:   recurringFreq === freq ? colors.income : colors.bg.surfaceMuted,
                        borderWidth:       1,
                        borderColor:       recurringFreq === freq ? colors.income : colors.border.subtle,
                      }}
                    >
                      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: recurringFreq === freq ? '#FFFFFF' : colors.text.secondary }}>
                        {RECURRING_FREQUENCY_LABELS[freq]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
        </Animated.View>
      </ScrollView>

      {/* ── Save button ─────────────────────────────────────────────────────── */}
      <View style={[styles.saveWrap, { paddingHorizontal: H_PAD, paddingBottom: btmPad + spacing[3], paddingTop: spacing[3], borderTopColor: colors.border.subtle }]}>
        {saveError && (
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.expense, textAlign: 'center', marginBottom: spacing[2] }}>
            {saveError}
          </Text>
        )}
        <Pressable
          onPress={handleSave}
          disabled={!canSave || saving}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: (!canSave || saving)
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
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: (canSave && !saving) ? '#FFFFFF' : colors.text.muted }}>
            {saving ? 'Saving…' : 'Save Income'}
          </Text>
        </Pressable>
      </View>
      <LoadingOverlay visible={saving} message="Saving…" />

      {/* ── Android: native dialog (handles its own OK/Cancel) ──────────────── */}
      {Platform.OS === 'android' && pickerMode !== null && (
        <DateTimePicker
          value={selectedDate}
          mode={pickerMode}
          display="default"
          maximumDate={pickerMode === 'date' ? new Date() : undefined}
          onChange={(event, picked) => {
            if (event.type === 'set' && picked) {
              if (pickerMode === 'date') {
                const d = new Date(picked);
                d.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
                setSelectedDate(d);
              } else {
                const d = new Date(selectedDate);
                d.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
                setSelectedDate(d);
              }
            }
            setPickerMode(null);
          }}
        />
      )}

      {/* ── iOS: bottom sheet with spinner ──────────────────────────────────── */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={pickerMode !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setPickerMode(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setPickerMode(null)} />
          <View style={[styles.pickerSheet, { backgroundColor: colors.bg.surface, paddingBottom: btmPad }]}>
            <View style={[styles.pickerHeader, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle }]}>
              <Pressable onPress={() => setPickerMode(null)} hitSlop={12}>
                <Text style={{ fontSize: fontSize.bodyLg, color: colors.text.muted, fontFamily: fontFamily.medium }}>
                  Cancel
                </Text>
              </Pressable>
              <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
                {pickerMode === 'date' ? 'Select Date' : 'Select Time'}
              </Text>
              <Pressable onPress={confirmPicker} hitSlop={12}>
                <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.semiBold }}>
                  Done
                </Text>
              </Pressable>
            </View>
            {pickerMode !== null && (
              <DateTimePicker
                value={tempDate}
                mode={pickerMode}
                display="spinner"
                maximumDate={pickerMode === 'date' ? new Date() : undefined}
                onChange={(_, picked) => {
                  if (!picked) return;
                  if (pickerMode === 'date') {
                    setTempDate(prev => {
                      const d = new Date(picked);
                      d.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
                      return d;
                    });
                  } else {
                    setTempDate(prev => {
                      const d = new Date(prev);
                      d.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
                      return d;
                    });
                  }
                }}
                style={{ width: '100%' }}
                textColor={colors.text.primary}
              />
            )}
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountSection: { alignItems: 'center' },
  amountRow:     { flexDirection: 'row', alignItems: 'center' },
  sourceTile:    { flexDirection: 'row', alignItems: 'center' },
  sourceIcon:    { alignItems: 'center', justifyContent: 'center' },
  checkCircle:   { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  detailCard:    { overflow: 'hidden' },
  detailRow:     { flexDirection: 'row', alignItems: 'center' },
  saveWrap:      { borderTopWidth: StyleSheet.hairlineWidth },
  saveBtn:       { alignItems: 'center', justifyContent: 'center' },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet:   { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8 },
  pickerHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
});

export default AddIncomeScreen;
