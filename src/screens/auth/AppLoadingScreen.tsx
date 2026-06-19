import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../hooks/ui/useTheme';

export function AppLoadingScreen() {
  const theme = useTheme();
  const { colors } = theme;

  return (
    <View style={[sc.root, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />
      <ActivityIndicator size="large" color={colors.accent.primary} />
    </View>
  );
}

const sc = StyleSheet.create({
  root: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
