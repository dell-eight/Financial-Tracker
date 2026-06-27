import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/ui/useTheme';

interface Props {
  onPress: () => void;
}

export function ContextualHelpButton({ onPress }: Props) {
  const theme  = useTheme();
  const styles = makeStyles(theme);

  return (
    <Pressable style={styles.btn} onPress={onPress} hitSlop={12}>
      <Text style={styles.label}>?</Text>
    </Pressable>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    btn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.colors.text.muted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: {
      fontSize: theme.fontSize.bodySm,
      fontFamily: theme.fontFamily.semiBold,
      color: theme.colors.text.muted,
      lineHeight: 18,
    },
  });
}
