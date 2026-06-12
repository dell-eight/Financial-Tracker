import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../../hooks/ui/useTheme';

export type StatCardType = 'income' | 'expense';

export interface StatCardProps {
  type: StatCardType;
  amount: string;
  label?: string;
  style?: ViewStyle;
}

export function StatCard({ type, amount, label, style }: StatCardProps) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, layout, shadows } = theme;

  const isIncome   = type === 'income';
  const color      = isIncome ? colors.income : colors.expense;
  const bgColor    = isIncome ? colors.incomeBg : colors.expenseBg;
  const arrowGlyph = isIncome ? '↑' : '↓';
  const displayLabel = label ?? (isIncome ? 'Income' : 'Expenses');

  return (
    <View
      style={[
        styles.card,
        shadows.sm,
        {
          backgroundColor: colors.bg.surface,
          borderRadius:    borderRadius.lg,
          padding:         spacing[4],
          minHeight:       layout.statChipH,
        },
        style,
      ]}
    >
      {/* Arrow indicator */}
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: bgColor,
            borderRadius:    borderRadius.full,
            width:           32,
            height:          32,
            marginBottom:    spacing[2],
          },
        ]}
      >
        <Text
          style={{ fontSize: fontSize.bodyMd, color, fontFamily: fontFamily.bold }}
          accessibilityLabel={isIncome ? 'Income indicator' : 'Expense indicator'}
        >
          {arrowGlyph}
        </Text>
      </View>

      {/* Label */}
      <Text
        style={[
          styles.label,
          {
            fontSize:   fontSize.bodySm,
            fontFamily: fontFamily.medium,
            color:      colors.text.secondary,
            marginBottom: spacing[1],
          },
        ]}
        numberOfLines={1}
      >
        {displayLabel}
      </Text>

      {/* Amount */}
      <Text
        style={[
          styles.amount,
          {
            fontSize:      fontSize.headingMd,
            fontFamily:    fontFamily.bold,
            color:         colors.text.primary,
            letterSpacing: -0.3,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  iconWrap: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    lineHeight: 18,
  },
  amount: {
    lineHeight: 24,
  },
});

export default StatCard;
