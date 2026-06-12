import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../../hooks/ui/useTheme';

export type AnalyticsPeriod = 'weekly' | 'monthly' | 'yearly';

export interface AnalyticsCardProps {
  title: string;
  totalAmount: string;
  delta?: string;
  deltaPositive?: boolean;
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: 'weekly',  label: 'Weekly'  },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly',  label: 'Yearly'  },
];

export function AnalyticsCard({
  title,
  totalAmount,
  delta,
  deltaPositive = true,
  period,
  onPeriodChange,
  children,
  style,
}: AnalyticsCardProps) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows, pillToggleConfig } = theme;

  return (
    <View
      style={[
        styles.card,
        shadows.card,
        {
          backgroundColor: colors.bg.surface,
          borderRadius:    borderRadius.card,
          padding:         spacing[5],
        },
        style,
      ]}
    >
      {/* Header: title + period toggle */}
      <View style={styles.header}>
        <Text
          style={{
            fontSize:   fontSize.headingMd,
            fontFamily: fontFamily.semiBold,
            color:      colors.text.primary,
          }}
        >
          {title}
        </Text>

        {/* Pill toggle */}
        <View
          style={[
            styles.toggle,
            {
              backgroundColor: colors.bg.surfaceMuted,
              borderRadius:    pillToggleConfig.borderRadius,
              padding:         pillToggleConfig.padding,
              height:          pillToggleConfig.height,
            },
          ]}
        >
          {PERIODS.map(({ key, label }) => {
            const isActive = key === period;
            return (
              <Pressable
                key={key}
                onPress={() => onPeriodChange(key)}
                style={[
                  styles.toggleSegment,
                  {
                    borderRadius: pillToggleConfig.segmentBorderRadius,
                    paddingHorizontal: spacing[3],
                    backgroundColor: isActive
                      ? colors.bg.surfaceRaised
                      : colors.transparent,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: isActive }}
                accessibilityLabel={label}
              >
                <Text
                  style={{
                    fontSize:   pillToggleConfig.labelFontSize,
                    fontFamily: pillToggleConfig.labelFontFamily,
                    fontWeight: pillToggleConfig.labelFontWeight,
                    color:      isActive ? colors.text.primary : colors.text.muted,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Total amount + delta */}
      <View style={[styles.amountRow, { marginTop: spacing[4] }]}>
        <Text
          style={{
            fontSize:      fontSize.displayLg,
            fontFamily:    fontFamily.bold,
            color:         colors.text.primary,
            letterSpacing: -0.5,
          }}
        >
          {totalAmount}
        </Text>

        {delta && (
          <View
            style={[
              styles.deltaBadge,
              {
                backgroundColor: deltaPositive ? colors.incomeBg : colors.expenseBg,
                borderRadius:    borderRadius.full,
                paddingHorizontal: spacing[2],
                paddingVertical:   spacing[0.5],
                marginLeft:        spacing[3],
              },
            ]}
          >
            <Text
              style={{
                fontSize:   fontSize.bodySm,
                fontFamily: fontFamily.medium,
                color:      deltaPositive ? colors.income : colors.expense,
              }}
            >
              {deltaPositive ? '▲' : '▼'} {delta}
            </Text>
          </View>
        )}
      </View>

      {/* Chart content */}
      <View style={{ marginTop: spacing[5] }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    flexWrap:       'wrap',
    gap:            8,
  },
  toggle: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  toggleSegment: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  deltaBadge: {
    alignSelf: 'center',
  },
});

export default AnalyticsCard;
