import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useScreenAnimation } from '../../hooks/ui/useScreenAnimation';
import type { RootStackParamList } from '../../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'QuickAddSheet'>;

const OPTIONS = [
  { key: 'expense', label: 'Expense', icon: '💸', color: '#FF6E52', description: 'Log a purchase or bill' },
  { key: 'income',  label: 'Income',  icon: '💰', color: '#00C318', description: 'Record salary or payment' },
] as const;

export function QuickAddSheet({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;

  function handleOption(key: 'expense' | 'income') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.goBack();
    const screenMap = {
      expense: 'AddExpense',
      income:  'AddIncome',
    } as const;
    // Use setTimeout to allow the modal dismiss animation to complete
    setTimeout(() => {
      navigation.navigate('Main', {
        screen: 'Transactions',
        params: { screen: screenMap[key] },
      });
    }, 300);
  }

  function handleClose() {
    Haptics.selectionAsync();
    navigation.goBack();
  }

  const bottomPad = insets.bottom > 0 ? insets.bottom : 24;

  const [headerStyle, optionsStyle] = useScreenAnimation(2);

  return (
    <View style={styles.root}>
      {/* Dimmed backdrop — tap to close */}
      <TouchableWithoutFeedback onPress={handleClose} accessibilityLabel="Close">
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Bottom sheet panel */}
      <View
        style={[
          styles.sheet,
          shadows.modal,
          {
            backgroundColor:     colors.bg.surfaceRaised,
            borderTopLeftRadius: borderRadius.cardLg,
            borderTopRightRadius: borderRadius.cardLg,
            paddingBottom:       bottomPad + spacing[4],
          },
        ]}
      >
        {/* Drag handle */}
        <View style={[styles.handle, { backgroundColor: colors.border.default }]} />

        {/* Title */}
        <Animated.View style={headerStyle}>
        <Text
          style={{
            fontSize:   fontSize.headingMd,
            fontFamily: fontFamily.bold,
            color:      colors.text.primary,
            textAlign:  'center',
            marginTop:  spacing[2],
            marginBottom: spacing[5],
          }}
        >
          Add Transaction
        </Text>
        </Animated.View>

        {/* Options */}
        <Animated.View style={[styles.options, { paddingHorizontal: spacing[5], gap: spacing[3] }, optionsStyle]}>
          {OPTIONS.map(opt => (
            <Pressable
              key={opt.key}
              onPress={() => handleOption(opt.key)}
              style={({ pressed }) => [
                styles.optionBtn,
                {
                  backgroundColor: pressed ? `${opt.color}20` : colors.bg.surface,
                  borderRadius:    borderRadius.card,
                  padding:         spacing[4],
                  borderWidth:     1,
                  borderColor:     pressed ? opt.color : colors.border.subtle,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: `${opt.color}18`,
                    borderRadius:    borderRadius.lg,
                    width:           44,
                    height:          44,
                  },
                ]}
              >
                <Text style={{ fontSize: 22, lineHeight: 28 }}>{opt.icon}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: spacing[3] }}>
                <Text
                  style={{
                    fontSize:   fontSize.bodyLg,
                    fontFamily: fontFamily.semiBold,
                    color:      colors.text.primary,
                  }}
                >
                  {opt.label}
                </Text>
                <Text
                  style={{
                    fontSize:   fontSize.bodySm,
                    fontFamily: fontFamily.regular,
                    color:      colors.text.muted,
                    marginTop:  2,
                  }}
                >
                  {opt.description}
                </Text>
              </View>

              <Text style={{ fontSize: 18, color: colors.text.muted }}>›</Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Cancel */}
        <Pressable
          onPress={handleClose}
          style={{ marginTop: spacing[4], alignItems: 'center', paddingVertical: spacing[3] }}
          accessibilityRole="button"
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.medium, color: colors.text.muted }}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    justifyContent:  'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    width: '100%',
  },
  handle: {
    width:        40,
    height:       4,
    borderRadius: 2,
    alignSelf:    'center',
    marginTop:    12,
  },
  options: {},
  optionBtn: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  optionIcon: {
    alignItems:     'center',
    justifyContent: 'center',
  },
});

export default QuickAddSheet;
