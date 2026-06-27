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
  Dimensions,
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
import { BUDGETS_KEY } from '../../hooks/queries/useBudgets';
import { NOTIFICATIONS_KEY, NOTIFICATIONS_COUNT_KEY } from '../../hooks/queries/useNotifications';
import { addExpense, getBudgets, RECURRING_FREQUENCY_LABELS, type RecurringFrequency } from '../../services/finance.service';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { ASSETS_KEY } from '../../hooks/queries/useNetWorth';
import { getCategoryBgColor } from '../../theme';
import type { TransactionsStackParamList } from '../../navigation/types';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { checkBudgetThresholds } from '../../services/notifications.service';
import { useAppStore } from '../../store/app.store';
import { useCurrency } from '../../utils/currency';
import type { CategoryKey } from '../../theme';
import type { Account } from '../../types/models';
import { EXPENSE_CATEGORIES } from '../../constants/categories';
import { SuccessToast } from '../../components/tutorial';
import { WIN } from '../../constants/tutorials';

type Props = StackScreenProps<TransactionsStackParamList, 'AddExpense'>;

const { width: SCREEN_W } = Dimensions.get('window');

type ExpenseCatKey = CategoryKey;

const EXPENSE_CATS = EXPENSE_CATEGORIES.map(c => ({
  key:   c.key as ExpenseCatKey,
  label: c.label,
  icon:  c.emoji,
}));

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

export function AddExpenseScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const { symbol, fmt } = useCurrency();
  const notificationsEnabled    = useAppStore(s => s.notificationsEnabled);
  const alert80Enabled          = useAppStore(s => s.alert80Enabled);
  const alert100Enabled         = useAppStore(s => s.alert100Enabled);
  const categoryAlertOverrides  = useAppStore(s => s.categoryAlertOverrides);
  const tutorialsCompleted      = useAppStore(s => s.tutorialsCompleted);
  const setTutorialCompleted    = useAppStore(s => s.setTutorialCompleted);

  const { data: accounts = [] } = useAccounts();

  const [amountStr,         setAmountStr]         = useState('');
  const [selectedCat,       setSelectedCat]       = useState<ExpenseCatKey | null>(null);
  const [merchantName,      setMerchantName]      = useState('');
  const [note,              setNote]              = useState('');
  const [fromAccount,       setFromAccount]       = useState<Account | null>(null);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [saveError,         setSaveError]         = useState<string | null>(null);
  const [selectedDate,      setSelectedDate]      = useState(() => new Date());
  const [pickerMode,        setPickerMode]        = useState<'date' | 'time' | null>(null);
  const [tempDate,          setTempDate]          = useState(() => new Date());
  const [insightBudget,     setInsightBudget]     = useState<{ label: string; icon: string; remaining: number } | null>(null);
  const [isRecurring,       setIsRecurring]       = useState(false);
  const [recurringFreq,     setRecurringFreq]     = useState<RecurringFrequency>('monthly');
  const [showToast,         setShowToast]         = useState(false);

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

  async function handleSave() {
    if (!canSave || !selectedCat || saving) return;
    if (!isOnline) { setSaveError('No internet connection. Please try again when online.'); return; }
    const cat = EXPENSE_CATS.find(c => c.key === selectedCat)!;
    setSaving(true);
    setSaveError(null);
    try {
      await addExpense({
        merchant:            merchantName.trim() || cat.label,
        categoryName:        cat.label,
        categoryIcon:        cat.icon,
        amount:              parsedAmount,
        date:                toLocalDateStr(selectedDate),
        note:                note.trim() || undefined,
        fromAccountId:       fromAccount?.id,
        fromCurrentBalance:  fromAccount?.balance,
        isRecurring:         isRecurring,
        recurringFrequency:  isRecurring ? recurringFreq : undefined,
      });
      const keys: Promise<void>[] = [
        queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
        queryClient.invalidateQueries({ queryKey: BUDGETS_KEY }),
      ];
      if (fromAccount) keys.push(queryClient.invalidateQueries({ queryKey: ASSETS_KEY }));
      await Promise.all(keys);

      // Fetch fresh budgets for threshold checks and insight card
      const now          = new Date();
      const freshBudgets = await getBudgets(now.getFullYear(), now.getMonth() + 1);

      if (notificationsEnabled) {
        await checkBudgetThresholds(freshBudgets, alert80Enabled, alert100Enabled, categoryAlertOverrides);
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_COUNT_KEY });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // First transaction win
      const isFirstTransaction = !tutorialsCompleted[WIN.TRANSACTION_LOGGED];
      if (isFirstTransaction) {
        setTutorialCompleted(WIN.TRANSACTION_LOGGED);
        setShowToast(true);
      }

      // Show insight card if the category has a budget this month
      const catBudget = freshBudgets.find(b => b.category === selectedCat);
      if (catBudget && catBudget.limit > 0) {
        setInsightBudget({ label: catBudget.label, icon: cat.icon, remaining: catBudget.limit - catBudget.spent });
        await new Promise<void>(resolve => setTimeout(resolve, isFirstTransaction ? 1800 : 2000));
      } else if (isFirstTransaction) {
        await new Promise<void>(resolve => setTimeout(resolve, 1800));
      }

      navigation.navigate('TransactionList', undefined);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save. Please try again.');
      setSaving(false);
    }
  }

  const [headerStyle, categoryStyle, formStyle] = useScreenAnimation(3);

  const TILE_GAP  = spacing[2];
  const H_PAD     = spacing[5];
  const TILE_SIZE = (SCREEN_W - H_PAD * 2 - TILE_GAP * 3) / 4;

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
          Add Expense
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
            <Text style={{ fontSize: 44, fontFamily: fontFamily.bold, color: amountStr ? colors.expense : colors.text.muted, lineHeight: 52, marginRight: 4 }}>
              {symbol}
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
        </Animated.View>

        {/* ── Category ────────────────────────────────────────────────────────── */}
        <Animated.View style={[{ paddingHorizontal: H_PAD, marginBottom: spacing[5] }, formStyle]}>
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
        </Animated.View>

        {/* ── Deduct from Account ─────────────────────────────────────────────── */}
        <Animated.View style={formStyle}>
        <View style={{ paddingHorizontal: H_PAD, marginBottom: spacing[5] }}>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3] }}>
            DEDUCT FROM ACCOUNT
          </Text>
          <Pressable
            onPress={() => { setAccountPickerOpen(o => !o); Haptics.selectionAsync(); }}
            style={[
              shadows.sm,
              {
                backgroundColor: colors.bg.surface,
                borderRadius:    borderRadius.card,
                borderWidth:     1,
                borderColor:     accountPickerOpen ? colors.expense : colors.border.subtle,
                padding:         spacing[4],
                flexDirection:   'row',
                alignItems:      'center',
              },
            ]}
          >
            <Text style={{ fontSize: 18, marginRight: spacing[3] }}>🏦</Text>
            <View style={{ flex: 1 }}>
              {fromAccount ? (
                <>
                  <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
                    {fromAccount.institutionName}
                  </Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                    {fromAccount.maskedNumber} · {fmt(fromAccount.balance)}
                  </Text>
                </>
              ) : (
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted }}>
                  Select account (optional)
                </Text>
              )}
            </View>
            <Text style={{ fontSize: 14, color: accountPickerOpen ? colors.expense : colors.text.muted }}>
              {accountPickerOpen ? '▲' : '▼'}
            </Text>
          </Pressable>

          {accountPickerOpen && (
            <View style={[
              shadows.card,
              {
                backgroundColor: colors.bg.surfaceRaised,
                borderRadius:    borderRadius.card,
                marginTop:       spacing[1],
                borderWidth:     1,
                borderColor:     colors.border.subtle,
                overflow:        'hidden',
              },
            ]}>
              <Pressable
                onPress={() => { setFromAccount(null); setAccountPickerOpen(false); Haptics.selectionAsync(); }}
                style={({ pressed }) => ({
                  flexDirection:     'row',
                  alignItems:        'center',
                  padding:           spacing[4],
                  backgroundColor:   pressed ? colors.bg.surfaceMuted : 'transparent',
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border.subtle,
                })}
              >
                <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fromAccount === null ? fontFamily.semiBold : fontFamily.regular, color: fromAccount === null ? colors.expense : colors.text.muted }}>
                  None
                </Text>
                {fromAccount === null && <Text style={{ fontSize: 14, color: colors.expense }}>✓</Text>}
              </Pressable>
              {accounts.map((acc, i) => (
                <Pressable
                  key={acc.id}
                  onPress={() => { setFromAccount(acc); setAccountPickerOpen(false); Haptics.selectionAsync(); }}
                  style={({ pressed }) => ({
                    flexDirection:     'row',
                    alignItems:        'center',
                    padding:           spacing[4],
                    backgroundColor:   pressed ? colors.bg.surfaceMuted : 'transparent',
                    borderBottomWidth: i < accounts.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: colors.border.subtle,
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fromAccount?.id === acc.id ? fontFamily.semiBold : fontFamily.medium, color: fromAccount?.id === acc.id ? colors.expense : colors.text.primary }}>
                      {acc.institutionName}
                    </Text>
                    <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                      {acc.maskedNumber}
                    </Text>
                  </View>
                  <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
                    {fmt(acc.balance)}
                  </Text>
                  {fromAccount?.id === acc.id && (
                    <Text style={{ fontSize: 14, color: colors.expense, marginLeft: spacing[2] }}>✓</Text>
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
                Recurring expense
              </Text>
              <Switch
                value={isRecurring}
                onValueChange={(v) => { setIsRecurring(v); Haptics.selectionAsync(); }}
                trackColor={{ false: colors.border.subtle, true: `${colors.accent.primary}80` }}
                thumbColor={isRecurring ? colors.accent.primary : colors.bg.surfaceMuted}
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
                        backgroundColor:   recurringFreq === freq ? colors.accent.primary : colors.bg.surfaceMuted,
                        borderWidth:       1,
                        borderColor:       recurringFreq === freq ? colors.accent.primary : colors.border.subtle,
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
        {insightBudget && (
          <View style={{
            backgroundColor: insightBudget.remaining >= 0 ? `${colors.income}18` : `${colors.expense}18`,
            borderRadius:    borderRadius.card,
            borderWidth:     1,
            borderColor:     insightBudget.remaining >= 0 ? colors.income : colors.expense,
            padding:         spacing[3],
            marginBottom:    spacing[3],
            flexDirection:   'row',
            alignItems:      'center',
          }}>
            <Text style={{ fontSize: 22, marginRight: spacing[3] }}>{insightBudget.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.secondary }}>
                {insightBudget.label} budget
              </Text>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.bold, color: insightBudget.remaining >= 0 ? colors.income : colors.expense }}>
                {insightBudget.remaining >= 0
                  ? `${fmt(insightBudget.remaining)} remaining`
                  : `${fmt(Math.abs(insightBudget.remaining))} over budget`}
              </Text>
            </View>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
              this month
            </Text>
          </View>
        )}
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
          accessibilityLabel="Save expense"
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: (canSave && !saving) ? '#FFFFFF' : colors.text.muted }}>
            {saving ? 'Saving…' : 'Save Expense'}
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

      <SuccessToast
        confetti
        visible={showToast}
        emoji="💸"
        headline="Transaction logged!"
        followUp="Your budget is now tracking automatically."
        onDismiss={() => setShowToast(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountSection: { alignItems: 'center' },
  amountRow:     { flexDirection: 'row', alignItems: 'center' },
  catGrid:       { flexDirection: 'row', flexWrap: 'wrap' },
  catTile:       { alignItems: 'center', justifyContent: 'center' },
  catIconCircle: { alignItems: 'center', justifyContent: 'center' },
  detailCard:    { overflow: 'hidden' },
  detailRow:     { flexDirection: 'row', alignItems: 'center' },
  saveWrap:      { borderTopWidth: StyleSheet.hairlineWidth },
  saveBtn:       { alignItems: 'center', justifyContent: 'center' },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet:   { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8 },
  pickerHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
});

export default AddExpenseScreen;
