import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/ui/useTheme';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  /** Set true to show a back/close button on the left. */
  showBack?: boolean;
  onBack?: () => void;
  /** Custom element replacing the back button. */
  leftElement?: React.ReactNode;
  /** Up to two icon-buttons on the right. */
  rightElements?: React.ReactNode[];
  /** If true, header blends into the screen background (no surface). */
  transparent?: boolean;
  style?: ViewStyle;
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  leftElement,
  rightElements = [],
  transparent = false,
  style,
}: AppHeaderProps) {
  const theme   = useTheme();
  const insets  = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, layout, borderRadius } = theme;

  const paddingTop = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : spacing[2]);

  const backGlyph = '‹';

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop,
          paddingHorizontal: spacing[4],
          paddingBottom:     spacing[3],
          backgroundColor:   transparent ? colors.transparent : colors.bg.base,
          minHeight:         layout.headerHeight + paddingTop,
        },
        style,
      ]}
    >
      <View style={styles.inner}>
        {/* Left slot */}
        <View style={[styles.sideSlot, { minWidth: layout.minTouchTarget }]}>
          {leftElement ?? (
            showBack && (
              <Pressable
                onPress={onBack}
                hitSlop={8}
                style={[
                  styles.backButton,
                  {
                    backgroundColor: colors.bg.surfaceMuted,
                    borderRadius:    borderRadius.full,
                    width:           36,
                    height:          36,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text
                  style={{
                    fontSize:   22,
                    color:      colors.text.primary,
                    fontFamily: fontFamily.regular,
                    lineHeight: 28,
                    marginLeft: 4,
                  }}
                >
                  {backGlyph}
                </Text>
              </Pressable>
            )
          )}
        </View>

        {/* Center: title + subtitle */}
        <View style={styles.titleBlock}>
          {title && (
            <Text
              style={{
                fontSize:      fontSize.headingMd,
                fontFamily:    fontFamily.semiBold,
                color:         colors.text.primary,
                textAlign:     'center',
                letterSpacing: -0.2,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={{
                fontSize:   fontSize.bodySm,
                fontFamily: fontFamily.regular,
                color:      colors.text.muted,
                textAlign:  'center',
                marginTop:  2,
              }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right slot */}
        <View style={[styles.sideSlot, styles.rightSlot, { minWidth: layout.minTouchTarget }]}>
          {rightElements.map((el, i) => (
            <View key={i} style={i > 0 ? { marginLeft: spacing[2] } : undefined}>
              {el}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inner: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    height:         44,
  },
  sideSlot: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  rightSlot: {
    justifyContent: 'flex-end',
  },
  titleBlock: {
    flex:           1,
    alignItems:     'center',
    paddingHorizontal: 8,
  },
  backButton: {
    alignItems:     'center',
    justifyContent: 'center',
  },
});

export default AppHeader;
