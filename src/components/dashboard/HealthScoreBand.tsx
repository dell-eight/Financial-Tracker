import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/ui/useTheme';
import { SkeletonBox } from '../common/SkeletonBox';
import type { ThemeColors } from '../../theme';

export function getHealthBand(score: number, colors: ThemeColors): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent',       color: colors.income };
  if (score >= 60) return { label: 'Good',            color: colors.accent.primary };
  if (score >= 40) return { label: 'Fair',            color: colors.warning };
  return               { label: 'Needs Attention', color: colors.expense };
}

interface Props {
  score:   number | null;
  onPress: () => void;
  loading: boolean;
}

export function HealthScoreBand({ score, onPress, loading }: Props) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;

  if (loading || score === null) {
    return <SkeletonBox height={72} borderRadius={borderRadius.card} />;
  }

  const band = getHealthBand(score, colors);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.band,
        shadows.card,
        {
          backgroundColor: colors.bg.surface,
          borderRadius:    borderRadius.card,
          padding:         spacing[4],
          borderLeftWidth: 3,
          borderLeftColor: band.color,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Financial Health Score: ${score} — ${band.label}`}
    >
      <View style={[styles.scoreCircle, { backgroundColor: `${band.color}20`, borderRadius: borderRadius.full, borderWidth: 2, borderColor: band.color }]}>
        <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: band.color, lineHeight: 20 }}>{score}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
            Financial Health Score
          </Text>
          <View style={{ backgroundColor: `${band.color}20`, borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: band.color }}>{band.label}</Text>
          </View>
        </View>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
          Tap for per-factor breakdown and tips
        </Text>
      </View>
      <Text style={{ fontSize: 16, color: colors.text.muted }}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  band:        { flexDirection: 'row', alignItems: 'center' },
  scoreCircle: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
