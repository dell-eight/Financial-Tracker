import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../../hooks/ui/useTheme';
import type { WealthStackParamList } from '../../../navigation/types';

type Props = StackScreenProps<WealthStackParamList, 'AddContribution'>;

export function AddContributionScreen({ navigation, route }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily } = theme;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />
      <View style={{ paddingTop: insets.top + spacing[3], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Cancel</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[3] }}>
          Add Contribution
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
          Goal {route.params.goalId}
        </Text>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2] }}>
          Coming in Phase 5
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default AddContributionScreen;
