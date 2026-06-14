import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../../hooks/ui/useTheme';
import { useCurrency } from '../../../utils/currency';
import { getCategoryBgColor, getProgressColor } from '../../../theme';
import { ProgressBar } from '../../charts/ProgressBar/ProgressBar';
import type { CategoryKey } from '../../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface BudgetCardProps {
  category: CategoryKey;
  categoryLabel: string;
  categoryIcon: React.ReactNode;
  spent: number;
  limit: number;
  currencySymbol?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

function formatAmount(value: number, symbol: string): string {
  return `${symbol}${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BudgetCard({
  category,
  categoryLabel,
  categoryIcon,
  spent,
  limit,
  currencySymbol,
  onPress,
  style,
}: BudgetCardProps) {
  const theme = useTheme();
  const { symbol: defaultSymbol } = useCurrency();
  const sym = currencySymbol ?? defaultSymbol;
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows, categoryColors } = theme;

  const ratio       = limit > 0 ? spent / limit : 0;
  const remaining   = Math.max(limit - spent, 0);
  const isExceeded  = spent > limit;
  const categoryColor = categoryColors[category];
  const iconBg      = getCategoryBgColor(category);
  const fillColor   = getProgressColor(ratio, colors);

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { if (onPress) scale.value = withSpring(0.98, theme.animation.spring.snappy); }}
      onPressOut={() => { if (onPress) scale.value = withSpring(1,    theme.animation.spring.snappy); }}
      style={animatedStyle}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${categoryLabel} budget: ${formatAmount(spent, sym)} of ${formatAmount(limit, sym)} spent`}
    >
      <View
        style={[
          styles.card,
          shadows.sm,
          {
            backgroundColor: colors.bg.surface,
            borderRadius:    borderRadius.lg,
            padding:         spacing[4],
          },
          style,
        ]}
      >
        {/* Top row: icon + name + limit */}
        <View style={styles.topRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: iconBg, borderRadius: borderRadius.full },
            ]}
          >
            {categoryIcon}
          </View>

          <View style={styles.nameBlock}>
            <Text
              style={{
                fontSize:   fontSize.bodyLg,
                fontFamily: fontFamily.semiBold,
                color:      colors.text.primary,
              }}
              numberOfLines={1}
            >
              {categoryLabel}
            </Text>
            <Text
              style={{
                fontSize:   fontSize.bodySm,
                fontFamily: fontFamily.regular,
                color:      colors.text.muted,
                marginTop:  2,
              }}
            >
              Limit: {formatAmount(limit, sym)}
            </Text>
          </View>

          {/* Spent amount */}
          <Text
            style={{
              fontSize:      fontSize.bodyLg,
              fontFamily:    fontFamily.bold,
              color:         isExceeded ? colors.expense : colors.text.primary,
              letterSpacing: -0.2,
            }}
          >
            {formatAmount(spent, sym)}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={{ marginTop: spacing[3] }}>
          <ProgressBar ratio={ratio} />
        </View>

        {/* Bottom row: percentage + remaining */}
        <View style={[styles.bottomRow, { marginTop: spacing[2] }]}>
          <Text
            style={{
              fontSize:   fontSize.bodySm,
              fontFamily: fontFamily.medium,
              color:      fillColor,
            }}
          >
            {Math.min(Math.round(ratio * 100), 100)}%
          </Text>

          <Text
            style={{
              fontSize:   fontSize.bodySm,
              fontFamily: fontFamily.regular,
              color:      isExceeded ? colors.expense : colors.text.secondary,
            }}
          >
            {isExceeded
              ? `Over by ${formatAmount(spent - limit, sym)}`
              : `${formatAmount(remaining, sym)} left`}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  iconCircle: {
    width:          40,
    height:         40,
    alignItems:     'center',
    justifyContent: 'center',
  },
  nameBlock: {
    flex: 1,
  },
  bottomRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
});

export default BudgetCard;
