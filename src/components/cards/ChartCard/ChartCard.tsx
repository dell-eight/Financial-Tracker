import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../../hooks/ui/useTheme';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  minHeight?: number;
  style?: ViewStyle;
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  minHeight,
  style,
}: ChartCardProps) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows, layout } = theme;

  return (
    <View
      style={[
        styles.card,
        shadows.card,
        {
          backgroundColor: colors.bg.surface,
          borderRadius:    borderRadius.card,
          padding:         spacing[5],
          minHeight:       minHeight ?? layout.analyticsCardMinH,
        },
        style,
      ]}
    >
      {/* Card header */}
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text
            style={{
              fontSize:   fontSize.headingMd,
              fontFamily: fontFamily.semiBold,
              color:      colors.text.primary,
              lineHeight: 24,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize:   fontSize.bodySm,
                fontFamily: fontFamily.regular,
                color:      colors.text.muted,
                marginTop:  2,
                lineHeight: 18,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {action && (
          <View style={styles.action}>
            {action}
          </View>
        )}
      </View>

      {/* Divider */}
      <View
        style={{
          height:          1,
          backgroundColor: colors.border.subtle,
          marginVertical:  spacing[4],
          opacity:         0.6,
        }}
      />

      {/* Chart content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
  },
  action: {
    marginLeft:     12,
    alignItems:     'flex-end',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
});

export default ChartCard;
