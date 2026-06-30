import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../hooks/ui/useTheme';
import { useCurrency } from '../../utils/currency';

interface Props {
  month:          string;
  year:           number;
  totalAllocated: number;
  totalSpent:     number;
}

export function BudgetOverviewCard({ month, year, totalAllocated, totalSpent }: Props) {
  const theme = useTheme();
  const { spacing, borderRadius, fontSize, fontFamily, shadows } = theme;
  const { fmt } = useCurrency();

  const ratio     = totalAllocated > 0 ? totalSpent / totalAllocated : 0;
  const remaining = totalAllocated - totalSpent;

  return (
    <View style={[{ borderRadius: borderRadius.cardLg, overflow: 'hidden' }, shadows.hero]}>
      <LinearGradient
        colors={['#9B85FF', '#5B41D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderRadius: borderRadius.cardLg, padding: spacing[5] }]}
      >
        <Svg
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        >
          <Circle cx="95%" cy="-5%" r={110} fill="rgba(255,255,255,0.08)" />
          <Circle cx="-5%" cy="110%" r={130} fill="rgba(255,255,255,0.05)" />
          <Circle cx="75%" cy="115%" r={70}  fill="rgba(255,255,255,0.04)" />
        </Svg>

        <View style={styles.topRow}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.70)', letterSpacing: 0.7, textTransform: 'uppercase' }}>
            Monthly Budget
          </Text>
          <View style={styles.monthPill}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.88)' }}>
              {month} {year}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: '#FFFFFF', letterSpacing: -1, marginTop: spacing[1], lineHeight: 48 }}>
          {fmt(totalAllocated)}
        </Text>

        <View style={[styles.track, { marginTop: spacing[4] }]}>
          <View style={[styles.fill, { width: `${Math.min(ratio * 100, 100)}%` }]} />
        </View>

        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.62)', marginTop: spacing[1] }}>
          {Math.round(ratio * 100)}% of budget used
        </Text>

        <View style={[styles.statRow, { marginTop: spacing[4] }]}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={styles.statValue}>{fmt(totalSpent)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.statItem, { alignItems: 'center' }]}>
            <Text style={styles.statLabel}>Allocated</Text>
            <Text style={styles.statValue}>{fmt(totalAllocated)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.statItem, { alignItems: 'flex-end' }]}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={[styles.statValue, { color: remaining >= 0 ? '#4ADE80' : '#F87171' }]}>
              {fmt(Math.abs(remaining))}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow:  'hidden',
    minHeight: 0,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  monthPill: {
    backgroundColor:   'rgba(255,255,255,0.14)',
    borderRadius:      99,
    paddingHorizontal: 12,
    paddingVertical:   4,
  },
  track: {
    height:          8,
    borderRadius:    99,
    backgroundColor: 'rgba(255,255,255,0.20)',
    overflow:        'hidden',
  },
  fill: {
    height:          '100%',
    borderRadius:    99,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  statRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex:       1,
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize:   11,
    fontFamily: 'Urbanist-Regular',
    color:      'rgba(255,255,255,0.58)',
    lineHeight: 16,
  },
  statValue: {
    fontSize:      14,
    fontFamily:    'Urbanist-Bold',
    color:         '#FFFFFF',
    letterSpacing: -0.2,
    marginTop:     2,
    lineHeight:    20,
  },
  divider: {
    width:            1,
    height:           36,
    backgroundColor:  'rgba(255,255,255,0.18)',
    marginHorizontal: 8,
  },
});
