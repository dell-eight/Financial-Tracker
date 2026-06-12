import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../../hooks/ui/useTheme';

// ── Tab icon glyphs (swap with Phosphor/Heroicons when available) ─────────────
// Each string maps to a route name. Replace these with <Icon> components.
const TAB_GLYPHS: Record<string, string> = {
  Home:      '⌂',
  Budget:    '◎',
  Expenses:  '≡',
  Analytics: '↗',
  Profile:   '◉',
};

const TAB_A11Y: Record<string, string> = {
  Home:      'Home tab',
  Budget:    'Budget tab',
  Expenses:  'Expenses tab',
  Analytics: 'Analytics tab',
  Profile:   'Profile tab',
};

// ── Animated tab item ──────────────────────────────────────────────────────────

interface TabItemProps {
  label:      string;
  glyph:      string;
  isActive:   boolean;
  onPress:    () => void;
  activeColor: string;
  inactiveColor: string;
  badgeCount?: number;
}

function TabItem({
  label,
  glyph,
  isActive,
  onPress,
  activeColor,
  inactiveColor,
  badgeCount,
}: TabItemProps) {
  const theme  = useTheme();
  const { spacing, fontSize, fontFamily, borderRadius } = theme;

  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const color = isActive ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.88, theme.animation.spring.bouncy); }}
      onPressOut={() => { scale.value = withSpring(1,    theme.animation.spring.bouncy); }}
      style={styles.tabItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={TAB_A11Y[label] ?? label}
    >
      <Animated.View style={[styles.iconWrap, animStyle]}>
        {/* Active pill background */}
        {isActive && (
          <View
            style={[
              styles.activePill,
              {
                backgroundColor: `${activeColor}18`,
                borderRadius:    borderRadius.full,
              },
            ]}
          />
        )}

        {/* Icon */}
        <View style={{ position: 'relative' }}>
          <Text
            style={{
              fontSize:  22,
              color,
              lineHeight: 26,
            }}
            accessibilityElementsHidden
          >
            {glyph}
          </Text>

          {/* Notification badge */}
          {(badgeCount ?? 0) > 0 && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: activeColor,
                  borderRadius:    borderRadius.full,
                },
              ]}
            />
          )}
        </View>

        {/* Label */}
        <Text
          style={{
            fontSize:      10,
            fontFamily:    isActive ? fontFamily.semiBold : fontFamily.medium,
            color,
            marginTop:     3,
            lineHeight:    13,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ── BottomTabBar ───────────────────────────────────────────────────────────────

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, tabBarConfig, spacing, borderRadius, shadows } = theme;

  const bottomPad = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 8);

  return (
    <View
      style={[
        styles.container,
        shadows.modal,
        {
          backgroundColor:  colors.tabBar.bg,
          paddingBottom:    bottomPad,
          paddingTop:       spacing[2],
          borderTopWidth:   tabBarConfig.topBorderWidth,
          borderTopColor:   colors.tabBar.border,
          borderTopLeftRadius:  tabBarConfig.topBorderRadius,
          borderTopRightRadius: tabBarConfig.topBorderRadius,
        },
      ]}
      accessibilityRole="tablist"
    >
      <View style={styles.tabs}>
        {state.routes.map((route, index) => {
          const { options }   = descriptors[route.key];
          const isActive      = state.index === index;
          const label         = (options.tabBarLabel as string | undefined) ?? route.name;
          const glyph         = TAB_GLYPHS[route.name] ?? '•';
          const badgeCount    = (options.tabBarBadge as number | undefined) ?? 0;

          const onPress = () => {
            const event = navigation.emit({
              type:   'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              label={label}
              glyph={glyph}
              isActive={isActive}
              onPress={onPress}
              activeColor={colors.tabBar.active}
              inactiveColor={colors.tabBar.inactive}
              badgeCount={badgeCount}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tabs: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  tabItem: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    minHeight:      44,
  },
  iconWrap: {
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  activePill: {
    position: 'absolute',
    top:      -6,
    bottom:   -2,
    left:     -14,
    right:    -14,
  },
  badge: {
    position: 'absolute',
    top:      -2,
    right:    -4,
    width:    8,
    height:   8,
  },
});

export default BottomTabBar;
