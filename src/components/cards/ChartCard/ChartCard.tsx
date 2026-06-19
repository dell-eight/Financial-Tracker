import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../../hooks/ui/useTheme';

// ── Expand icon — four corner brackets, no icon library needed ───────────────
function ExpandIcon({ color }: { color: string }) {
  const arm = 5, t = 1.5, s = 14;
  return (
    <View style={{ width: s, height: s }}>
      <View style={{ position: 'absolute', top: 0,    left:  0,   width: arm, height: arm, borderTopWidth:    t, borderLeftWidth:  t, borderColor: color }} />
      <View style={{ position: 'absolute', top: 0,    right: 0,   width: arm, height: arm, borderTopWidth:    t, borderRightWidth: t, borderColor: color }} />
      <View style={{ position: 'absolute', bottom: 0, left:  0,   width: arm, height: arm, borderBottomWidth: t, borderLeftWidth:  t, borderColor: color }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0,   width: arm, height: arm, borderBottomWidth: t, borderRightWidth: t, borderColor: color }} />
    </View>
  );
}

export interface ChartCardProps {
  title:        string;
  subtitle?:    string;
  action?:      React.ReactNode;
  children:     React.ReactNode | ((width: number, height: number) => React.ReactNode);
  minHeight?:   number;
  style?:       ViewStyle;
  scrollable?:  boolean;
  chartHeight?: number;
  onExpand?:    () => void;
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  minHeight,
  style,
  scrollable,
  chartHeight,
  onExpand,
}: ChartCardProps) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows, layout } = theme;

  const [measuredW, setMeasuredW] = useState(0);

  const isRenderProp = typeof children === 'function';
  const chartH       = chartHeight ?? 200;

  function resolveChildren(w: number, h: number): React.ReactNode {
    return isRenderProp
      ? (children as (w: number, h: number) => React.ReactNode)(w, h)
      : children;
  }

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

        <View style={styles.headerRight}>
          {action && <View style={styles.action}>{action}</View>}
          {false && onExpand && (
            <Pressable
              onPress={onExpand}
              hitSlop={12}
              style={{ marginLeft: action ? spacing[3] : 0 }}
            >
              <ExpandIcon color={colors.text.muted} />
            </Pressable>
          )}
        </View>
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
      <View
        style={styles.content}
        onLayout={e => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && w !== measuredW) setMeasuredW(w);
        }}
      >
        {scrollable ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(isRenderProp ? measuredW > 0 : true) && resolveChildren(measuredW, chartH)}
          </ScrollView>
        ) : (
          <View style={{ overflow: 'hidden' }}>
            {(isRenderProp ? measuredW > 0 : true) && resolveChildren(measuredW, chartH)}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    // overflow: 'hidden' intentionally removed — was clipping horizontal ScrollView
  },
  header: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    marginLeft:    12,
  },
  action: {
    alignItems:     'flex-end',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
});

export default ChartCard;
