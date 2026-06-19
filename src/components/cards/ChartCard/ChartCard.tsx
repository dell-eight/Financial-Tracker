import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../../hooks/ui/useTheme';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Expand icon — four corner brackets, no icon library needed ───────────────
function ExpandIcon({ color }: { color: string }) {
  const arm = 5, t = 1.5, s = 14;
  return (
    <View style={{ width: s, height: s }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: arm, height: arm, borderTopWidth: t, borderLeftWidth: t, borderColor: color }} />
      <View style={{ position: 'absolute', top: 0, right: 0, width: arm, height: arm, borderTopWidth: t, borderRightWidth: t, borderColor: color }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: arm, height: arm, borderBottomWidth: t, borderLeftWidth: t, borderColor: color }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: arm, height: arm, borderBottomWidth: t, borderRightWidth: t, borderColor: color }} />
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
  expandable?:  boolean;
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
  expandable = true,
}: ChartCardProps) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows, layout } = theme;

  const [measuredW, setMeasuredW] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  const cardScale = useSharedValue(0.88);
  const cardOp    = useSharedValue(0);

  useEffect(() => {
    if (modalVisible) {
      cardScale.value = 0.88;
      cardOp.value    = 0;
      cardScale.value = withSpring(1, { damping: 16, stiffness: 160 });
      cardOp.value    = withTiming(1, { duration: 180 });
    }
  }, [modalVisible]);

  const modalCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity:   cardOp.value,
  }));

  const isRenderProp  = typeof children === 'function';
  const chartH        = chartHeight ?? 200;
  const modalChartW   = SW - 32 - spacing[5] * 2;
  const modalChartH   = Math.round(SH * 0.55);

  function resolveChildren(w: number, h: number): React.ReactNode {
    return isRenderProp
      ? (children as (w: number, h: number) => React.ReactNode)(w, h)
      : children;
  }

  return (
    <>
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
            {expandable && (
              <Pressable
                onPress={() => setModalVisible(true)}
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

      {/* Maximize modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Animated.View
            style={[
              modalCardStyle,
              {
                backgroundColor: colors.bg.surface,
                borderRadius:    borderRadius.cardLg,
                width:           SW - 32,
                padding:         spacing[5],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, lineHeight: 24 }}>
                  {title}
                </Text>
                {subtitle && (
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                    {subtitle}
                  </Text>
                )}
              </View>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={12} style={{ marginLeft: spacing[3] }}>
                <Text style={{ fontSize: 20, color: colors.text.secondary, lineHeight: 24 }}>✕</Text>
              </Pressable>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: colors.border.subtle, marginVertical: spacing[4], opacity: 0.6 }} />

            {/* Chart at full modal width */}
            {scrollable ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {resolveChildren(modalChartW, modalChartH)}
              </ScrollView>
            ) : (
              <View>
                {resolveChildren(modalChartW, modalChartH)}
              </View>
            )}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
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
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  modalHeader: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
  },
});

export default ChartCard;
