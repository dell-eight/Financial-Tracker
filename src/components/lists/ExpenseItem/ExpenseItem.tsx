import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../../hooks/ui/useTheme';
import { getCategoryBgColor } from '../../../theme';
import type { CategoryKey } from '../../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ExpenseItemProps {
  id: string;
  merchant: string;
  categoryKey: CategoryKey;
  categoryLabel: string;
  categoryIcon: React.ReactNode;
  amount: string;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  time?: string;
  onPress?: (id: string) => void;
  showDivider?: boolean;
  style?: ViewStyle;
}

export function ExpenseItem({
  id,
  merchant,
  categoryKey,
  categoryLabel,
  categoryIcon,
  amount,
  type,
  date,
  time,
  onPress,
  showDivider = true,
  style,
}: ExpenseItemProps) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, layout, categoryColors } = theme;

  const isIncome     = type === 'income';
  const isTransfer   = type === 'transfer';
  const amountColor  = isTransfer ? colors.accent.primary : isIncome ? colors.income : colors.expense;
  const amountPrefix = isTransfer ? '↔ ' : isIncome ? '+' : '-';
  const iconBg       = getCategoryBgColor(categoryKey);
  const iconColor    = categoryColors[categoryKey];

  const opacity = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <AnimatedPressable
      onPress={() => onPress?.(id)}
      onPressIn={() => { opacity.value = withTiming(0.7, { duration: theme.animation.duration.instant }); }}
      onPressOut={() => { opacity.value = withTiming(1,   { duration: theme.animation.duration.fast  }); }}
      style={animStyle}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${merchant}, ${categoryLabel}, ${amountPrefix}${amount}, ${date}`}
    >
      <View
        style={[
          styles.row,
          {
            minHeight:       layout.listItemH,
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[4],
            backgroundColor: colors.bg.surface,
          },
          style,
        ]}
      >
        {/* Category icon circle */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: iconBg,
              borderRadius:    borderRadius.full,
              width:           layout.iconCircleMd,
              height:          layout.iconCircleMd,
              marginRight:     spacing[3],
            },
          ]}
          accessibilityElementsHidden
        >
          {categoryIcon}
        </View>

        {/* Merchant + category */}
        <View style={styles.details}>
          <Text
            style={{
              fontSize:   fontSize.bodyLg,
              fontFamily: fontFamily.semiBold,
              color:      colors.text.primary,
              lineHeight: 22,
            }}
            numberOfLines={1}
          >
            {merchant}
          </Text>
          <Text
            style={{
              fontSize:   fontSize.bodySm,
              fontFamily: fontFamily.regular,
              color:      colors.text.muted,
              lineHeight: 18,
              marginTop:  1,
            }}
            numberOfLines={1}
          >
            {categoryLabel} · {date}
          </Text>
        </View>

        {/* Amount + time */}
        <View style={[styles.amountBlock, { marginLeft: spacing[3] }]}>
          <Text
            style={{
              fontSize:      fontSize.bodyLg,
              fontFamily:    fontFamily.bold,
              color:         amountColor,
              letterSpacing: -0.2,
              textAlign:     'right',
            }}
          >
            {amountPrefix}{amount}
          </Text>
          {time && (
            <Text
              style={{
                fontSize:   fontSize.bodySm,
                fontFamily: fontFamily.regular,
                color:      colors.text.muted,
                textAlign:  'right',
                marginTop:  2,
              }}
            >
              {time}
            </Text>
          )}
        </View>
      </View>

      {/* Divider */}
      {showDivider && (
        <View
          style={{
            height:          1,
            backgroundColor: colors.border.subtle,
            marginLeft:      spacing[4] + layout.iconCircleMd + spacing[3],
            opacity:         0.6,
          }}
        />
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  iconCircle: {
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  details: {
    flex:          1,
    justifyContent: 'center',
  },
  amountBlock: {
    alignItems:     'flex-end',
    justifyContent: 'center',
    flexShrink:     0,
  },
});

export default ExpenseItem;
