import React, { useState } from 'react';
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
import Animated from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../../hooks/ui/useTheme';
import { SAVINGS_GOALS_KEY } from '../../../hooks/queries/useSavingsGoals';
import { createSavingsGoal } from '../../../services/finance.service';
import type { WealthStackParamList } from '../../../navigation/types';
import { LoadingOverlay } from '../../../components/common/LoadingOverlay';
import { useCurrency, formatFull } from '../../../utils/currency';
import { useAppStore } from '../../../store/app.store';
import { useScreenAnimation } from '../../../hooks/ui/useScreenAnimation';

type Props = StackScreenProps<WealthStackParamList, 'CreateGoal'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJIS = ['🏠', '✈️', '🆘', '🚗', '🎓', '💍', '🏖️', '📱', '🏋️', '🎸', '💻', '🌍'];

const GOAL_COLORS = [
  { label: 'Purple',  value: '#755DEF' },
  { label: 'Green',   value: '#22C55E' },
  { label: 'Orange',  value: '#F97316' },
  { label: 'Blue',    value: '#3B82F6' },
  { label: 'Pink',    value: '#EC4899' },
  { label: 'Teal',    value: '#14B8A6' },
];

// ─── CreateGoalScreen ─────────────────────────────────────────────────────────

export function CreateGoalScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();
  const { symbol, fmt } = useCurrency();

  const [name,      setName]      = useState('');
  const [emoji,     setEmoji]     = useState('🎯');
  const [amountStr, setAmountStr] = useState('');
  const [color,     setColor]     = useState(GOAL_COLORS[0].value);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [headerStyle, pickersStyle, formStyle] = useScreenAnimation(3);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;
  const H_PAD  = spacing[5];

  const parsed  = parseFloat(amountStr) || 0;
  const canSave = name.trim().length > 0 && parsed > 0;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const newGoal = await createSavingsGoal({
        name:         name.trim(),
        emoji,
        targetAmount: parsed,
        color,
      });
      await queryClient.invalidateQueries({ queryKey: SAVINGS_GOALS_KEY });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('GoalDetail', { goalId: newGoal.id });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create goal. Please try again.');
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.bg.base }]}
    >
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: H_PAD, paddingBottom: spacing[3] }, headerStyle]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>Cancel</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>New Goal</Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave || saving}
          hitSlop={12}
          style={{ minWidth: 60, alignItems: 'flex-end' }}
        >
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: (canSave && !saving) ? colors.accent.primary : colors.text.muted }}>
            {saving ? '…' : 'Save'}
          </Text>
        </Pressable>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: btmPad + spacing[6] }}
      >
        {/* ── Preview circle ── */}
        <Animated.View style={[{ alignItems: 'center', marginVertical: spacing[6] }, pickersStyle]}>
          <View style={[styles.previewCircle, { backgroundColor: color + '20', borderRadius: borderRadius.full, width: 88, height: 88, borderWidth: 3, borderColor: color }]}>
            <Text style={{ fontSize: 40, lineHeight: 48 }}>{emoji}</Text>
          </View>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[3] }} numberOfLines={1}>
            {name.trim() || 'Goal Name'}
          </Text>
          {parsed > 0 && (
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
              Target: {fmt(parsed)}
            </Text>
          )}
        </Animated.View>

        <Animated.View style={formStyle}>
          {/* ── Goal name ── */}
          <Text style={[styles.label, { fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }]}>
            GOAL NAME
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: name ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], height: 50, marginBottom: spacing[5] }]}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. House Down Payment"
              placeholderTextColor={colors.text.muted}
              maxLength={40}
              returnKeyType="next"
              style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary, padding: 0 }}
            />
          </View>

          {/* ── Target amount ── */}
          <Text style={[styles.label, { fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }]}>
            TARGET AMOUNT
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: parsed > 0 ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], height: 50, marginBottom: spacing[5] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, color: colors.text.muted, fontFamily: fontFamily.medium, marginRight: 4 }}>{symbol}</Text>
            <TextInput
              value={amountStr}
              onChangeText={v => {
                const c = v.replace(/[^0-9.]/g, '');
                if (c.split('.').length <= 2) setAmountStr(c);
              }}
              placeholder="0"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary, padding: 0 }}
            />
          </View>

          {/* ── Emoji picker ── */}
          <Text style={[styles.label, { fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3] }]}>
            ICON
          </Text>
          <View style={[styles.emojiGrid, { marginBottom: spacing[5] }]}>
            {EMOJIS.map(e => (
              <Pressable
                key={e}
                onPress={() => { Haptics.selectionAsync(); setEmoji(e); }}
                style={[styles.emojiTile, {
                  backgroundColor: emoji === e ? color + '22' : colors.bg.surface,
                  borderRadius:    borderRadius.lg,
                  borderWidth:     1,
                  borderColor:     emoji === e ? color : colors.border.subtle,
                  width:           52,
                  height:          52,
                }]}
              >
                <Text style={{ fontSize: 24, lineHeight: 30 }}>{e}</Text>
              </Pressable>
            ))}
          </View>

          {/* ── Color picker ── */}
          <Text style={[styles.label, { fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3] }]}>
            COLOR
          </Text>
          <View style={[styles.colorRow, { marginBottom: spacing[6] }]}>
            {GOAL_COLORS.map(gc => (
              <Pressable
                key={gc.value}
                onPress={() => { Haptics.selectionAsync(); setColor(gc.value); }}
                style={[styles.colorDot, {
                  backgroundColor: gc.value,
                  borderRadius:    borderRadius.full,
                  width:           36,
                  height:          36,
                  borderWidth:     color === gc.value ? 3 : 0,
                  borderColor:     '#FFFFFF',
                  transform:       [{ scale: color === gc.value ? 1.15 : 1 }],
                }]}
              />
            ))}
          </View>

          {/* ── Error message ── */}
          {error && (
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.expense, textAlign: 'center', marginBottom: spacing[3] }}>
              {error}
            </Text>
          )}

          {/* ── Save button ── */}
          <Pressable
            onPress={handleSave}
            disabled={!canSave || saving}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: (!canSave || saving)
                  ? colors.bg.surfaceMuted
                  : pressed ? colors.accent.pressed : colors.accent.primary,
                borderRadius: borderRadius.button,
                height: 52,
              },
            ]}
          >
            <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: (canSave && !saving) ? '#FFFFFF' : colors.text.muted }}>
              {saving ? 'Saving…' : 'Create Goal'}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
      <LoadingOverlay visible={saving} message="Creating goal…" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:        {},
  inputWrap:    { flexDirection: 'row', alignItems: 'center' },
  previewCircle:{ alignItems: 'center', justifyContent: 'center' },
  emojiGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emojiTile:    { alignItems: 'center', justifyContent: 'center' },
  colorRow:     { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  colorDot:     {},
  saveBtn:      { alignItems: 'center', justifyContent: 'center' },
});

export default CreateGoalScreen;
