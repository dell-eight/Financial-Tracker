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
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;

  const isIncome     = type === 'income';
  const accentColor  = isIncome ? colors.income : colors.expense;
  const accentBg     = isIncome ? colors.incomeBg : colors.expenseBg;
  const displayLabel = label ?? (isIncome ? 'Income' : 'Expenses');
  const arrowGlyph   = isIncome ? '↑' : '↓';

  return (
    <View
      style={[
        styles.card,
        shadows.sm,
        {
          backgroundColor: colors.bg.surface,
          borderRadius:    borderRadius.lg,
          padding:         spacing[4],
          borderLeftWidth: 3,
          borderLeftColor: accentColor,
        },
        style,
      ]}
    >
      {/* Label row with colored dot indicator */}
      <View style={styles.labelRow}>
        <View
          style={[
            styles.dot,
            { backgroundColor: accentBg, borderRadius: borderRadius.full },
          ]}
        >
          <Text
            style={{ fontSize: 11, color: accentColor, fontFamily: fontFamily.bold }}
            accessibilityElementsHidden
          >
            {arrowGlyph}
          </Text>
        </View>
        <Text
          style={{
            fontSize:   fontSize.bodySm,
            fontFamily: fontFamily.medium,
            color:      colors.text.secondary,
            marginLeft: spacing[1],
          }}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
      </View>

      {/* Amount — prominent */}
      <Text
        style={[
          styles.amount,
          {
            fontSize:      fontSize.headingMd,
            fontFamily:    fontFamily.bold,
            color:         colors.text.primary,
            letterSpacing: -0.4,
            marginTop:     spacing[2],
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex:     1,
    overflow: 'hidden',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  dot: {
    width:          22,
    height:         22,
    alignItems:     'center',
    justifyContent: 'center',
  },
  amount: {
    lineHeight: 26,
  },
});

export default StatCard;
