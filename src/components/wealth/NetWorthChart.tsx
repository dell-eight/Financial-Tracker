import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Line as SvgLine,
  Text as SvgText,
  Rect,
  Polygon,
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
import { niceTicks } from '../../utils/chartUtils';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath   = Animated.createAnimatedComponent(Path);

const Y_LABEL_W = 48;
const X_LABEL_H = 22;
const Y_PAD     = 12;
const R_PAD     = 24;
const CHART_H   = 220;
const TOOLTIP_H = 44;
const ARROW_H   = 6;

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
  const { fmtCompact, fmt } = useCurrency();

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const plotW   = width - Y_LABEL_W - R_PAD;
  const plotH   = height - X_LABEL_H;

  // Animate path draw on mount; reset tooltip on data change (period switch)
  const drawProgress = useSharedValue(0);
  // Pulse for the live "Now" dot
  const pulseScale   = useSharedValue(1);

  const pathLengthRef = useRef<number>(0);

  useEffect(() => {
    setSelectedIdx(null);
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

  if (data.length === 0) return null;

  const values    = data.map(d => d.nw);
  const minVal    = Math.min(...values);
  const maxVal    = Math.max(...values);
  const yTicks    = niceTicks(minVal, maxVal);
  const axisMin   = yTicks[0];
  const axisMax   = yTicks[yTicks.length - 1];
  const axisRange = axisMax - axisMin;

  const pts = data.map((d, i) => ({
    x: data.length === 1
      ? Y_LABEL_W + plotW / 2
      : Y_LABEL_W + (i / (data.length - 1)) * plotW,
    y: Y_PAD + ((1 - (d.nw - axisMin) / axisRange) * (plotH - Y_PAD)),
  }));

  const linePath = smoothPath(pts);
  const fillPath = closedFillPath(pts, plotH);

  const ESTIMATED_LEN = width * 3;

  const animPathProps = useAnimatedProps(() => ({
    strokeDashoffset: ESTIMATED_LEN * (1 - drawProgress.value),
  }));

  const liveIdx  = data.findIndex(d => d.isLive);
  const livePt   = liveIdx >= 0 ? pts[liveIdx] : null;

  const liveDotProps = useAnimatedProps(() => ({
    r: 6 * pulseScale.value,
    opacity: 0.3 + 0.7 * (1 - (pulseScale.value - 1) / 0.5),
  }));

  // X-axis labels — show every other when many points
  const labelStep = data.length > 7 ? 2 : 1;

  const accentColor  = colors.accent.primary;
  const textColor    = colors.text.muted;
  const gridColor    = colors.border.subtle;

  // Pre-compute tooltip geometry so JSX stays clean
  let tooltipNode: React.ReactNode = null;
  if (selectedIdx !== null && pts[selectedIdx]) {
    const si        = selectedIdx;
    const pt        = pts[si];
    const valueText = fmt(data[si].nw);
    const labelText = data[si].label;
    const TW        = Math.max(108, Math.max(valueText.length, labelText.length) * 7 + 16);

    const tx        = Math.max(Y_LABEL_W, Math.min(pt.x - TW / 2, width - TW - R_PAD));
    const aboveFits = pt.y - TOOLTIP_H - ARROW_H - 8 > Y_PAD;
    const ty        = aboveFits ? pt.y - TOOLTIP_H - ARROW_H - 8 : pt.y + ARROW_H + 8;

    // Arrow centred over dot but clamped inside box
    const acx = Math.max(tx + 8, Math.min(pt.x, tx + TW - 8));
    const arrowPts = aboveFits
      ? `${acx - 5},${ty + TOOLTIP_H} ${acx + 5},${ty + TOOLTIP_H} ${acx},${ty + TOOLTIP_H + ARROW_H}`
      : `${acx - 5},${ty} ${acx + 5},${ty} ${acx},${ty - ARROW_H}`;

    tooltipNode = (
      <React.Fragment>
        {/* Arrow rendered first so the box bg covers the seam */}
        <Polygon points={arrowPts} fill={colors.bg.surface} />
        <Rect
          x={tx} y={ty} width={TW} height={TOOLTIP_H} rx={8} ry={8}
          fill={colors.bg.surface} stroke={gridColor} strokeWidth={1}
        />
        <SvgText
          x={tx + TW / 2} y={ty + 15}
          fontSize={9} fontFamily={fontFamily.regular}
          fill={textColor} textAnchor="middle"
        >
          {labelText}
        </SvgText>
        <SvgText
          x={tx + TW / 2} y={ty + 31}
          fontSize={11} fontFamily={fontFamily.semiBold}
          fill={colors.text.primary} textAnchor="middle"
        >
          {valueText}
        </SvgText>
      </React.Fragment>
    );
  }

  return (
    <View style={{ width, height: height + X_LABEL_H, overflow: 'hidden' }}>
      <Svg width={width} height={height + X_LABEL_H}>
        <Defs>
          <SvgGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor={accentColor} stopOpacity={0.25} />
            <Stop offset="1"   stopColor={accentColor} stopOpacity={0}    />
          </SvgGradient>
        </Defs>

        {/* Full-area dismiss zone — sits behind all chart elements */}
        <Rect
          x={0} y={0} width={width} height={height + X_LABEL_H}
          fill="transparent"
          onPress={() => setSelectedIdx(null)}
        />

        {/* Y-axis grid lines + labels */}
        {yTicks.map((v, i) => {
          const y = Y_PAD + ((1 - (v - axisMin) / axisRange) * (plotH - Y_PAD));
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

        {/* Regular dots — highlighted when selected */}
        {pts.map((pt, i) => {
          if (data[i].isLive) return null;
          const isSelected = selectedIdx === i;
          return (
            <Circle
              key={i}
              cx={pt.x} cy={pt.y}
              r={isSelected ? 6 : 4}
              fill={accentColor}
              stroke={isSelected ? colors.bg.base : 'none'}
              strokeWidth={2}
            />
          );
        })}

        {/* Live "Now" pulsing dot — larger to visually dominate */}
        {livePt && (
          <>
            <AnimatedCircle
              cx={livePt.x} cy={livePt.y}
              fill={accentColor}
              animatedProps={liveDotProps}
            />
            <Circle
              cx={livePt.x} cy={livePt.y}
              r={selectedIdx === liveIdx ? 8 : 6}
              fill={accentColor}
              stroke={selectedIdx === liveIdx ? colors.bg.base : 'none'}
              strokeWidth={2}
            />
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

        {/* Invisible hit circles — rendered last to win touch events */}
        {pts.map((pt, i) => (
          <Circle
            key={`hit-${i}`}
            cx={pt.x} cy={pt.y}
            r={16}
            fill="transparent"
            onPress={() => setSelectedIdx(prev => prev === i ? null : i)}
          />
        ))}

        {/* Tooltip — rendered last so it appears on top of everything */}
        {tooltipNode}
      </Svg>
    </View>
  );
}
