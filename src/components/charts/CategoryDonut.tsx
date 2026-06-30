import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../hooks/ui/useTheme';
import { useCurrency } from '../../utils/currency';
import type { CategoryKey } from '../../theme';

export interface CatStat {
  key:    CategoryKey;
  label:  string;
  icon:   string;
  amount: number;
  color:  string;
}

const DNUT_SIZE = 164;
const DNUT_CX   = DNUT_SIZE / 2;
const DNUT_CY   = DNUT_SIZE / 2;
const OUTER_R   = 68;
const INNER_R   = 44;
const SEG_GAP   = 2.5;

function polarToCart(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildArc(cx: number, cy: number, outerR: number, innerR: number, a1: number, a2: number): string {
  if (a2 - a1 >= 360) { a2 = a1 + 359.98; }
  const large = (a2 - a1) > 180 ? 1 : 0;
  const p1 = polarToCart(cx, cy, outerR, a1);
  const p2 = polarToCart(cx, cy, outerR, a2);
  const p3 = polarToCart(cx, cy, innerR, a2);
  const p4 = polarToCart(cx, cy, innerR, a1);
  return [
    `M${p1.x.toFixed(2)},${p1.y.toFixed(2)}`,
    `A${outerR},${outerR},0,${large},1,${p2.x.toFixed(2)},${p2.y.toFixed(2)}`,
    `L${p3.x.toFixed(2)},${p3.y.toFixed(2)}`,
    `A${innerR},${innerR},0,${large},0,${p4.x.toFixed(2)},${p4.y.toFixed(2)}Z`,
  ].join(' ');
}

export const CategoryDonut = React.memo(function CategoryDonut({
  data, animDelay = 0,
}: {
  data:       CatStat[];
  animDelay?: number;
}) {
  const theme = useTheme();
  const { colors, spacing, fontFamily } = theme;
  const { fmtCompact: fmtK, fmt: fmtFull } = useCurrency();

  const [selIdx, setSelIdx] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.amount, 0);

  let angle = 0;
  const segments = data.map((d, i) => {
    const sweep = (d.amount / total) * 360;
    const a1    = angle + SEG_GAP / 2;
    const a2    = angle + sweep - SEG_GAP / 2;
    angle += sweep;
    return { ...d, a1, a2, pct: Math.round((d.amount / total) * 100), outerR: selIdx === i ? OUTER_R + 7 : OUTER_R };
  });

  const sel = selIdx !== null ? segments[selIdx] : null;

  const sc = useSharedValue(0.82);
  const op = useSharedValue(0);
  useEffect(() => {
    sc.value = withDelay(animDelay, withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.15)) }));
    op.value = withDelay(animDelay, withTiming(1, { duration: 380 }));
  }, []);

  const donutStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sc.value }],
    opacity:   op.value,
  }));

  return (
    <View style={{ gap: spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[5] }}>
        <Animated.View style={donutStyle}>
          <Svg width={DNUT_SIZE} height={DNUT_SIZE}>
            {segments.map((seg, i) => (
              <Path
                key={i}
                d={buildArc(DNUT_CX, DNUT_CY, seg.outerR, INNER_R, seg.a1, seg.a2)}
                fill={seg.color}
                opacity={selIdx === null || selIdx === i ? 1 : 0.38}
                onPress={() => setSelIdx(selIdx === i ? null : i)}
              />
            ))}
            <SvgText
              x={DNUT_CX} y={DNUT_CY - 9}
              textAnchor="middle"
              fontSize={sel ? 11 : 10}
              fontFamily={fontFamily.medium}
              fill={sel ? sel.color : colors.text.muted}
            >
              {sel ? sel.label.split(/[\s&]/)[0] : 'Total'}
            </SvgText>
            <SvgText
              x={DNUT_CX} y={DNUT_CY + 11}
              textAnchor="middle"
              fontSize={sel ? 15 : 14}
              fontFamily={fontFamily.bold}
              fill={colors.text.primary}
            >
              {sel ? fmtK(sel.amount) : fmtK(total)}
            </SvgText>
            {sel && (
              <SvgText
                x={DNUT_CX} y={DNUT_CY + 27}
                textAnchor="middle"
                fontSize={10}
                fontFamily={fontFamily.regular}
                fill={colors.text.muted}
              >
                {/* eslint-disable-next-line react-native/no-raw-text */}
                {sel.pct}%
              </SvgText>
            )}
          </Svg>
        </Animated.View>

        <View style={{ flex: 1, gap: 7 }}>
          {data.slice(0, 7).map((d, i) => {
            const pct = Math.round((d.amount / total) * 100);
            return (
              <Pressable
                key={d.key}
                onPress={() => setSelIdx(selIdx === i ? null : i)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}
                accessibilityRole="button"
                accessibilityLabel={`${d.label}: ${pct}%`}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.color, flexShrink: 0 }} />
                <Text
                  style={{ flex: 1, fontSize: 11, fontFamily: fontFamily.regular, color: selIdx === i ? d.color : colors.text.secondary, lineHeight: 15 }}
                  numberOfLines={1}
                >
                  {d.label}
                </Text>
                <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
                  {pct}%
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center' }}>
        {sel ? `${sel.label} · ${fmtFull(sel.amount)}` : 'Tap a segment to explore'}
      </Text>
    </View>
  );
});
