import 'react-native-gesture-handler';
import React, { useCallback, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
  Urbanist_800ExtraBold,
} from '@expo-google-fonts/urbanist';
import { PostHogProvider } from 'posthog-react-native';
import { queryClient } from './src/lib/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initAnalytics, getAnalytics } from './src/services/analytics.service';
import { initCrashReporting } from './src/services/crash.service';

// Initialise at module load so the first app_opened event isn't missed
initCrashReporting();
initAnalytics();

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Urbanist-Regular':   Urbanist_400Regular,
    'Urbanist-Medium':    Urbanist_500Medium,
    'Urbanist-SemiBold':  Urbanist_600SemiBold,
    'Urbanist-Bold':      Urbanist_700Bold,
    'Urbanist-ExtraBold': Urbanist_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const posthog = getAnalytics();

  const inner = (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </View>
  );

  // Wrap with PostHogProvider only when a real client exists (key is configured).
  // During development with a placeholder key the app renders without the provider.
  return posthog ? (
    <PostHogProvider client={posthog}>{inner}</PostHogProvider>
  ) : inner;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
