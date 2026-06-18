import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Line as SvgLine,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import type { NWPoint } from '../../services/finance.service';
import { useTheme } from '../../hooks/ui/useTheme';
import { useCurrency } from '../../utils/currency';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath   = Animated.createAnimatedComponent(Path);

const Y_LABEL_W = 48;
const X_LABEL_H = 22;
const Y_PAD     = 12;
const R_PAD     = 10;
const CHART_H   = 160;

// Smooth cubic bezier path through points
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const t = 0.35;
    const cp1x = p.x + (c.x - p.x) * t;
    const cp2x = c.x - (c.x - p.x) * t;
    d += ` C ${cp1x.toFixed(2)},${p.y.toFixed(2)} ${cp2x.toFixed(2)},${c.y.toFixed(2)} ${c.x.toFixed(2)},${c.y.toFixed(2)}`;
  }
  return d;
}

function closedFillPath(pts: { x: number; y: number }[], plotH: number): string {
  if (pts.length < 2) return '';
  const linePath = smoothPath(pts);
  const last  = pts[pts.length - 1];
  const first = pts[0];
  return `${linePath} L ${last.x.toFixed(2)},${plotH.toFixed(2)} L ${first.x.toFixed(2)},${plotH.toFixed(2)} Z`;
}

interface Props {
  data:    NWPoint[];
  width:   number;
  height?: number;
}

export function NetWorthChart({ data, width, height = CHART_H }: Props) {
  const theme = useTheme();
  const { colors, fontFamily } = theme;
  const { fmtCompact } = useCurrency();

  const plotW   = width - Y_LABEL_W - R_PAD;
  const plotH   = height - X_LABEL_H;

  // Animate path draw on mount
  const drawProgress = useSharedValue(0);
  // Pulse for the live "Now" dot
  const pulseScale   = useSharedValue(1);

  const pathLengthRef = useRef<number>(0);

  useEffect(() => {
    drawProgress.value = 0;
    drawProgress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: 700, easing: Easing.in(Easing.ease)  }),
      ),
      -1, // infinite
    );
  }, [data]);

  if (data.length < 2) return null;

  const values  = data.map(d => d.nw);
  const minVal  = Math.min(...values);
  const maxVal  = Math.max(...values);
  const range   = maxVal - minVal || 1;

  const pts = data.map((d, i) => ({
    x: Y_LABEL_W + (i / (data.length - 1)) * plotW,
    y: Y_PAD + ((1 - (d.nw - minVal) / range) * (plotH - Y_PAD)),
  }));

  const linePath = smoothPath(pts);
  const fillPath = closedFillPath(pts, plotH);

  // Measure path length for stroke-dash animation
  // We estimate: use a fixed large value; stroke-dashoffset animates from total to 0
  const ESTIMATED_LEN = width * 3;

  const animPathProps = useAnimatedProps(() => ({
    strokeDashoffset: ESTIMATED_LEN * (1 - drawProgress.value),
  }));

  const liveIdx  = data.findIndex(d => d.isLive);
  const livePt   = liveIdx >= 0 ? pts[liveIdx] : null;

  const liveDotProps = useAnimatedProps(() => ({
    r: 4 * pulseScale.value,
    opacity: 0.3 + 0.7 * (1 - (pulseScale.value - 1) / 0.5),
  }));

  // X-axis labels — show every other when many points
  const labelStep = data.length > 7 ? 2 : 1;
  // Y-axis ticks
  const yTicks = [minVal, minVal + range / 2, maxVal];

  const accentColor  = colors.accent.primary;
  const textColor    = colors.text.muted;
  const gridColor    = colors.border.subtle;

  return (
    <View style={{ width, height: height + X_LABEL_H, overflow: 'hidden' }}>
      <Svg width={width} height={height + X_LABEL_H}>
        <Defs>
          <SvgGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor={accentColor} stopOpacity={0.25} />
            <Stop offset="1"   stopColor={accentColor} stopOpacity={0}    />
          </SvgGradient>
        </Defs>

        {/* Y-axis grid lines + labels */}
        {yTicks.map((v, i) => {
          const y = Y_PAD + ((1 - (v - minVal) / range) * (plotH - Y_PAD));
          return (
            <React.Fragment key={i}>
              <SvgLine
                x1={Y_LABEL_W} y1={y} x2={width} y2={y}
                stroke={gridColor} strokeWidth={0.5} strokeDasharray="3 4"
              />
              <SvgText
                x={Y_LABEL_W - 4} y={y + 4}
                fontSize={9} fontFamily={fontFamily.regular}
                fill={textColor} textAnchor="end"
              >
                {fmtCompact(v)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Fill area */}
        <Path d={fillPath} fill="url(#nwGrad)" />

        {/* Animated line */}
        <AnimatedPath
          d={linePath}
          stroke={accentColor}
          strokeWidth={2.2}
          fill="none"
          strokeDasharray={ESTIMATED_LEN}
          animatedProps={animPathProps}
        />

        {/* Regular dots */}
        {pts.map((pt, i) => {
          if (data[i].isLive) return null;
          return (
            <Circle key={i} cx={pt.x} cy={pt.y} r={3} fill={accentColor} />
          );
        })}

        {/* Live "Now" pulsing dot */}
        {livePt && (
          <>
            <AnimatedCircle
              cx={livePt.x} cy={livePt.y}
              fill={accentColor}
              animatedProps={liveDotProps}
            />
            <Circle cx={livePt.x} cy={livePt.y} r={3} fill={accentColor} />
          </>
        )}

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % labelStep !== 0 && i !== data.length - 1) return null;
          return (
            <SvgText
              key={i}
              x={pts[i].x} y={height + 14}
              fontSize={9} fontFamily={fontFamily.regular}
              fill={d.isLive ? accentColor : textColor}
              textAnchor="middle"
              fontWeight={d.isLive ? 'bold' : 'normal'}
            >
              {d.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
