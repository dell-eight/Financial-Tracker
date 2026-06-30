import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/ui/useTheme';
import { useCurrency } from '../../utils/currency';
import { SkeletonBox } from '../common/SkeletonBox';

interface Props {
  income:   number;
  expenses: number;
  saved:    number;
  onPress:  () => void;
  loading:  boolean;
}

export function CashFlowStrip({ income, expenses, saved, onPress, loading }: Props) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;
  const { fmt: fmtPh } = useCurrency();

  if (loading) {
    return <SkeletonBox height={70} borderRadius={borderRadius.card} />;
  }

  const cols = [
    { label: 'Income',   value: fmtPh(income),   color: colors.income },
    { label: 'Expenses', value: fmtPh(expenses),  color: colors.expense },
    { label: 'Saved',    value: fmtPh(saved),     color: saved >= 0 ? colors.text.primary : colors.expense },
  ];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.strip, shadows.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card }]}
    >
      {cols.map((col, i) => (
        <View
          key={col.label}
          style={[
            styles.col,
            { paddingVertical: spacing[4] },
            i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border.subtle },
          ]}
        >
          <Text
            style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: col.color, letterSpacing: -0.3 }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {col.value}
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 3 }}>
            {col.label}
          </Text>
        </View>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row' },
  col:   { flex: 1, alignItems: 'center' },
});
