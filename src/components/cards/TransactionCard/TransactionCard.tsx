import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../../hooks/ui/useTheme';
import { getAccountCardGradient } from '../../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface TransactionCardProps {
  /** Institution or account name */
  institutionName: string;
  /** Masked card number, e.g. "•••• 4242" */
  maskedNumber: string;
  /** Formatted balance string, e.g. "$12,922.84" */
  balance: string;
  /** "Debit" | "Credit" | "Savings" | "Cash" */
  accountType: string;
  /** Index into the gradient array — cycles automatically */
  gradientIndex?: number;
  /** Optional bank logo / icon element */
  logo?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function TransactionCard({
  institutionName,
  maskedNumber,
  balance,
  accountType,
  gradientIndex = 0,
  logo,
  onPress,
  style,
}: TransactionCardProps) {
  const theme = useTheme();
  const { spacing, borderRadius, fontSize, fontFamily, shadows, layout } = theme;

  const [start, end] = getAccountCardGradient(gradientIndex, theme.dark);

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { if (onPress) scale.value = withSpring(0.97, theme.animation.spring.snappy); }}
      onPressOut={() => { if (onPress) scale.value = withSpring(1,    theme.animation.spring.snappy); }}
      style={[animStyle, style]}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${institutionName} ${accountType} account ending ${maskedNumber}, balance ${balance}`}
    >
      <LinearGradient
        colors={[start, end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          shadows.accountCard,
          {
            borderRadius: borderRadius.card,
            minHeight:    layout.accountCardH,
            padding:      spacing[5],
          },
        ]}
      >
        {/* Top row: logo + account type badge */}
        <View style={styles.topRow}>
          <Text
            style={{
              fontSize:   fontSize.bodyLg,
              fontFamily: fontFamily.bold,
              color:      '#FFFFFF',
              opacity:    0.95,
            }}
          >
            {institutionName}
          </Text>

          <View style={styles.badge}>
            <Text
              style={{
                fontSize:      10,
                fontFamily:    fontFamily.medium,
                color:         '#FFFFFF',
                opacity:       0.80,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
              }}
            >
              {accountType}
            </Text>
          </View>
        </View>

        {/* Masked card number */}
        <Text
          style={[
            styles.maskedNumber,
            {
              fontSize:      fontSize.bodyMd,
              fontFamily:    fontFamily.medium,
              color:         '#FFFFFF',
              opacity:       0.65,
              letterSpacing: 2,
              marginTop:     spacing[3],
            },
          ]}
        >
          {maskedNumber}
        </Text>

        {/* Balance */}
        <Text
          style={[
            styles.balance,
            {
              fontSize:      fontSize.displayLg,
              fontFamily:    fontFamily.bold,
              color:         '#FFFFFF',
              letterSpacing: -0.5,
              marginTop:     spacing[2],
            },
          ]}
        >
          {balance}
        </Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      999,
    backgroundColor:   'rgba(255,255,255,0.15)',
  },
  maskedNumber: {
    lineHeight: 20,
  },
  balance: {
    lineHeight: 36,
  },
});

export default TransactionCard;
