import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import type { AnalyticsStackParamList } from '../../navigation/types';

type Props = StackScreenProps<AnalyticsStackParamList, 'NetWorthGrowth'>;

export function NetWorthGrowthScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily } = theme;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />
      <View style={{ paddingTop: insets.top + spacing[3], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[3] }}>
          Net Worth Growth
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted }}>
          Coming in Phase 8
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default NetWorthGrowthScreen;
