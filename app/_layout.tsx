import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createDevSeedSnapshot, createInMemorySessionStore, SessionStoreProvider } from '@/data';
import { ThemeProvider, useAppFonts, useTheme } from '@/design-system';

SplashScreen.preventAutoHideAsync().catch(() => {});

const sessionStore = createInMemorySessionStore(createDevSeedSnapshot(Date.now()));

function ThemedApp() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.color.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const areFontsLoaded = useAppFonts();

  useEffect(() => {
    if (areFontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [areFontsLoaded]);

  if (!areFontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SessionStoreProvider store={sessionStore}>
            <ThemedApp />
          </SessionStoreProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
