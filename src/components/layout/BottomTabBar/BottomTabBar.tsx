import React, { useRef } from 'react';
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
import { useNavigation, StackActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { NavigationProp } from '@react-navigation/native';
import { useTheme } from '../../../hooks/ui/useTheme';
import { useAppStore } from '../../../store/app.store';
import type { RootStackParamList } from '../../../navigation/types';

// ── Tab configuration ──────────────────────────────────────────────────────────

const TAB_GLYPHS: Record<string, string> = {
  Home: '⌂',
  Transactions: '⇄',
  Budget: '◔',
  Wealth: '◈',
  Analytics: '↗'
};

const TAB_A11Y: Record<string, string> = {
  Home:         'Home tab',
  Transactions: 'Transactions tab',
  Budget:       'Budget tab',
  Wealth:       'Wealth tab',
  Analytics:    'Analytics tab',
};

const FAB_SIZE = 52;

// ── Animated tab item ──────────────────────────────────────────────────────────

interface TabItemProps {
  label:         string;
  glyph:         string;
  isActive:      boolean;
  onPress:       () => void;
  activeColor:   string;
  inactiveColor: string;
  badgeCount?:   number;
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
  const theme = useTheme();
  const { spacing, fontSize, fontFamily, borderRadius } = theme;

  const scale    = useSharedValue(1);
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
        <View style={{ position: 'relative' }}>
          <Text
            style={{ fontSize: 22, color, lineHeight: 26 }}
            accessibilityElementsHidden
          >
            {glyph}
          </Text>

          {(badgeCount ?? 0) > 0 && (
            <View style={[styles.badge, { backgroundColor: activeColor, borderRadius: borderRadius.full }]} />
          )}
        </View>

        <Text
          style={{
            fontSize:   10,
            fontFamily: isActive ? fontFamily.semiBold : fontFamily.medium,
            color,
            marginTop:  3,
            lineHeight: 13,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ── FAB ────────────────────────────────────────────────────────────────────────

function FABButton() {
  const theme        = useTheme();
  const rootNav      = useNavigation<NavigationProp<RootStackParamList>>();
  const { colors, borderRadius, shadows } = theme;
  const setFabBounds = useAppStore(s => s.setFabBounds);
  const wrapRef      = useRef<View>(null);

  const scale    = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rootNav.navigate('QuickAddSheet');
  }

  return (
    <View
      ref={wrapRef}
      style={styles.fabWrap}
      pointerEvents="box-none"
      onLayout={() => {
        requestAnimationFrame(() => {
          wrapRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0) setFabBounds({
              x:      x + (w - FAB_SIZE) / 2,
              y,
              width:  FAB_SIZE,
              height: FAB_SIZE,
            });
          });
        });
      }}
    >
      <Animated.View style={animStyle}>
        <Pressable
          onPress={handlePress}
          onPressIn={() => { scale.value = withSpring(0.92, theme.animation.spring.bouncy); }}
          onPressOut={() => { scale.value = withSpring(1,    theme.animation.spring.bouncy); }}
          style={[
            styles.fab,
            shadows.fab,
            {
              backgroundColor: colors.accent.primary,
              borderRadius:    borderRadius.full,
              width:           FAB_SIZE,
              height:          FAB_SIZE,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add transaction"
        >
          <Text style={{ fontSize: 26, color: '#FFFFFF', lineHeight: 30, marginTop: -2 }}>+</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── BottomTabBar ───────────────────────────────────────────────────────────────

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, tabBarConfig, shadows } = theme;

  const bottomPad = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 8);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* FAB floats above the tab bar */}
      <FABButton />

      {/* Tab bar surface */}
      <View
        style={[
          styles.container,
          shadows.modal,
          {
            backgroundColor: colors.tabBar.bg,
            paddingBottom:   bottomPad,
            borderTopWidth:  tabBarConfig.topBorderWidth,
            borderTopColor:  colors.tabBar.border,
          },
        ]}
        accessibilityRole="tablist"
      >
        <View style={styles.tabs}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isActive    = state.index === index;
            const label       = (options.tabBarLabel as string | undefined) ?? route.name;
            const glyph       = TAB_GLYPHS[route.name] ?? '•';
            const badgeCount  = (options.tabBarBadge as number | undefined) ?? 0;

            const onPress = () => {
              Haptics.selectionAsync();
              const event = navigation.emit({
                type:              'tabPress',
                target:            route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                if (isActive) {
                  // Pop the nested stack back to its root when re-pressing the active tab
                  const nestedState = state.routes[index]?.state;
                  if (nestedState && (nestedState.index ?? 0) > 0) {
                    navigation.dispatch({ ...StackActions.popToTop(), target: nestedState.key });
                  }
                } else {
                  navigation.navigate(route.name);
                }
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width:    '100%',
    overflow: 'visible',
  },
  fabWrap: {
    position:   'absolute',
    bottom:     '100%',
    left:       0,
    right:      0,
    alignItems: 'center',
    paddingBottom: 8,
  },
  fab: {
    alignItems:     'center',
    justifyContent: 'center',
    elevation:      8,
  },
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
