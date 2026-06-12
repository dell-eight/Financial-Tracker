import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../../hooks/ui/useTheme';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  actionLabel = 'See All',
  onAction,
  style,
}: SectionHeaderProps) {
  const theme = useTheme();
  const { colors, fontSize, fontFamily } = theme;

  return (
    <View style={[styles.row, style]}>
      <Text
        style={{
          fontSize:   fontSize.headingSm,
          fontFamily: fontFamily.semiBold,
          color:      colors.text.primary,
          flex:       1,
        }}
      >
        {title}
      </Text>

      {onAction && (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text
            style={{
              fontSize:   fontSize.bodySm,
              fontFamily: fontFamily.medium,
              color:      colors.accent.primary,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
});

export default SectionHeader;
