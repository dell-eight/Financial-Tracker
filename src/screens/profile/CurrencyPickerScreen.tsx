import React from 'react';
import {
  View, Text, Pressable, FlatList, StyleSheet, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useAppStore } from '../../store/app.store';
import { CURRENCIES, getCurrencySymbol } from '../../utils/currency';
import type { HomeStackParamList } from '../../navigation/types';

type Props = StackScreenProps<HomeStackParamList, 'CurrencyPicker'>;

export function CurrencyPickerScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;

  const currency    = useAppStore(s => s.currency);
  const setCurrency = useAppStore(s => s.setCurrency);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  function handleSelect(code: string) {
    Haptics.selectionAsync();
    setCurrency(code);
    navigation.goBack();
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Currency
        </Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <FlatList
        data={CURRENCIES}
        keyExtractor={item => item.code}
        contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: btmPad + spacing[4] }}
        ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border.subtle }} />}
        style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], overflow: 'hidden' }]}
        renderItem={({ item }) => {
          const isSelected = item.code === currency;
          const symbol = getCurrencySymbol(item.code);
          return (
            <Pressable
              onPress={() => handleSelect(item.code)}
              style={({ pressed }) => [
                styles.row,
                {
                  paddingHorizontal: spacing[4],
                  paddingVertical:   spacing[4],
                  backgroundColor:   pressed ? colors.bg.surfaceMuted : colors.bg.surface,
                },
              ]}
            >
              <Text style={{ fontSize: 24, width: 36 }}>{item.flag}</Text>

              <View style={{ flex: 1, marginLeft: spacing[3] }}>
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 1 }}>
                  {item.code} · {symbol}
                </Text>
              </View>

              {isSelected && (
                <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.bold }}>✓</Text>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row:    { flexDirection: 'row', alignItems: 'center' },
});
