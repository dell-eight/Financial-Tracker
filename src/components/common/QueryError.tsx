import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/ui/useTheme';

interface Props {
  /** Called when the user taps "Try again". Should trigger a refetch. */
  onRetry: () => void;
  /** Optional override message. Defaults to a generic network-failure string. */
  message?: string;
}

/**
 * Inline error state shown in place of a screen's content when its primary
 * data query fails (network error, Supabase unreachable, etc.).
 *
 * Uses the app theme so it respects dark/light mode automatically.
 */
export function QueryError({ onRetry, message }: Props) {
  const { colors, spacing, fontSize, fontFamily, borderRadius } = useTheme();

  return (
    <View
      style={[
        s.container,
        { backgroundColor: colors.bg.base, padding: spacing[8] },
      ]}
      accessibilityLiveRegion="polite"
    >
      <Text style={s.emoji}>📡</Text>
      <Text
        style={[
          s.title,
          { color: colors.text.primary, fontFamily: fontFamily.semiBold, fontSize: fontSize.bodyLg },
        ]}
      >
        Couldn't load data
      </Text>
      <Text
        style={[
          s.body,
          { color: colors.text.muted, fontFamily: fontFamily.regular, fontSize: fontSize.bodySm },
        ]}
      >
        {message ?? 'Check your connection and try again.'}
      </Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          s.btn,
          {
            backgroundColor: pressed ? colors.accent.pressed : colors.accent.primary,
            borderRadius:    borderRadius.button,
            marginTop:       spacing[5],
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[6],
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        accessibilityHint="Retries loading the data"
      >
        <Text
          style={[
            s.btnText,
            { fontFamily: fontFamily.semiBold, fontSize: fontSize.bodyMd },
          ]}
        >
          Try again
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize:     40,
    marginBottom: 12,
  },
  title: {
    marginBottom: 6,
    textAlign:    'center',
  },
  body: {
    textAlign:  'center',
    lineHeight: 20,
  },
  btn: {
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
  },
});
