import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/ui/useTheme';

interface Props {
  onTrackCount:    number;
  nearLimitCount:  number;
  overBudgetCount: number;
}

export function BudgetHealthRow({ onTrackCount, nearLimitCount, overBudgetCount }: Props) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;

  const chips = [
    { count: onTrackCount,    label: 'On Track',    icon: '✓', bg: `${colors.income}18`,  border: `${colors.income}30`,  text: colors.income  },
    { count: nearLimitCount,  label: 'Near Limit',  icon: '!', bg: `${colors.warning}18`, border: `${colors.warning}30`, text: colors.warning },
    { count: overBudgetCount, label: 'Over Budget', icon: '↑', bg: `${colors.expense}18`, border: `${colors.expense}30`, text: colors.expense },
  ];

  return (
    <View style={[styles.row, { gap: spacing[3] }]}>
      {chips.map((chip, i) => (
        <View
          key={i}
          style={[
            styles.chip,
            shadows.sm,
            { flex: 1, backgroundColor: colors.bg.surface, borderRadius: borderRadius.lg, padding: spacing[4], borderWidth: 1, borderColor: chip.border },
          ]}
        >
          <View style={[styles.iconBadge, { backgroundColor: chip.bg, borderRadius: borderRadius.full }]}>
            <Text style={{ fontSize: 12, fontFamily: fontFamily.bold, color: chip.text, lineHeight: 16 }}>
              {chip.icon}
            </Text>
          </View>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: chip.text, marginTop: spacing[2], lineHeight: 26 }}>
            {chip.count}
          </Text>
          <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2, lineHeight: 14 }}>
            {chip.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  chip: {
    alignItems: 'flex-start',
  },
  iconBadge: {
    width:          28,
    height:         28,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
