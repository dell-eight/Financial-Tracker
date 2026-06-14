import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../../hooks/ui/useNetworkStatus';
import { useTheme } from '../../hooks/ui/useTheme';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const { colors, fontSize, fontFamily } = useTheme();
  const translateY = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue:         isOnline ? -40 : 0,
      duration:        300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: colors.warning, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: '#000000' }}>
        No internet connection · Showing cached data
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position:       'absolute',
    top:            0,
    left:           0,
    right:          0,
    height:         40,
    zIndex:         9999,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
