import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../hooks/ui/useTheme';
import { useCurrency } from '../../utils/currency';
import { SkeletonBox } from '../common/SkeletonBox';

export interface NetWorthCardProps {
  netWorth:        number;
  delta:           number;
  deltaPct:        number;
  totalAssets:     number;
  totalDebts:      number;
  investmentValue: number;
  onPress:         () => void;
  loading:         boolean;
}

export function NetWorthCard({
  netWorth, delta, deltaPct,
  totalAssets, totalDebts, investmentValue,
  onPress, loading,
}: NetWorthCardProps) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily } = theme;
  const { fmt: fmtPh, fmtCompact: fmtK } = useCurrency();

  if (loading) {
    return (
      <View style={{ borderRadius: borderRadius.cardLg, overflow: 'hidden' }}>
        <SkeletonBox height={188} borderRadius={borderRadius.cardLg} />
      </View>
    );
  }

  const isPositive = delta >= 0;
  const chipBg     = isPositive ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)';

  return (
    <Pressable
      onPress={onPress}
      style={[
        { borderRadius: borderRadius.cardLg, overflow: 'hidden' },
        Platform.OS === 'ios'
          ? { shadowColor: '#0A0720', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.45, shadowRadius: 28 }
          : { elevation: 16 },
      ]}
    >
      <LinearGradient
        colors={['#2A1168', '#17094A', '#0C0828']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.card, { borderRadius: borderRadius.cardLg, padding: spacing[5] }]}
      >
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Circle cx="92%" cy="10%" r={80}  fill="rgba(140,100,255,0.12)" />
          <Circle cx="-5%" cy="90%" r={90}  fill="rgba(100,70,230,0.10)"  />
        </Svg>
        <View style={styles.topShimmer} />

        <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.4, textTransform: 'uppercase' }}>
          Total Net Worth
        </Text>
        <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: '#FFFFFF', letterSpacing: -1, marginTop: spacing[1], lineHeight: 50 }}>
          {fmtPh(netWorth)}
        </Text>

        <View style={styles.deltaRow}>
          <View style={[styles.deltaChip, { backgroundColor: chipBg }]}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: isPositive ? colors.income : colors.expense }}>
              {isPositive ? '↑' : '↓'} {fmtPh(Math.abs(delta))} ({isPositive ? '+' : ''}{deltaPct.toFixed(2)}%)
            </Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.5)', marginLeft: 6 }}>
              this month
            </Text>
          </View>
        </View>

        <View style={[styles.strip, { marginTop: spacing[4], borderTopColor: 'rgba(255,255,255,0.12)', borderTopWidth: 1, paddingTop: spacing[3] }]}>
          {[
            { label: 'Assets',      value: fmtK(totalAssets),      color: colors.income },
            { label: 'Debts',       value: fmtK(totalDebts),       color: colors.expense },
            { label: 'Investments', value: fmtK(investmentValue),  color: colors.accent.secondary },
          ].map((item, i) => (
            <View key={item.label} style={[styles.stripCol, i > 0 && { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.12)' }]}>
              <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: item.color, letterSpacing: -0.2 }}>{item.value}</Text>
              <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card:       { overflow: 'hidden', justifyContent: 'space-between' },
  topShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(200,170,255,0.35)' },
  deltaRow:   { flexDirection: 'row', marginTop: 8 },
  deltaChip:  { flexDirection: 'row', alignItems: 'center', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  strip:      { flexDirection: 'row' },
  stripCol:   { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
});
