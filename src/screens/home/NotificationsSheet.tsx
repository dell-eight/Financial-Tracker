import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useScreenAnimation } from '../../hooks/ui/useScreenAnimation';
import type { HomeStackParamList } from '../../navigation/types';

type Props = StackScreenProps<HomeStackParamList, 'Notifications'>;

export function NotificationsSheet({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily } = theme;

  const [headerStyle, contentStyle] = useScreenAnimation(2);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />
      <Animated.View style={[{ paddingTop: insets.top + spacing[3], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }, headerStyle]}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[3] }}>
          Notifications
        </Text>
      </Animated.View>
      <Animated.View style={[styles.body, contentStyle]}>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted }}>
          No new notifications
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default NotificationsSheet;
