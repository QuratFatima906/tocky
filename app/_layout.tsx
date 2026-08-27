import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  createSqliteSessionStore,
  openTockyDatabase,
  SessionStoreProvider,
  useSessionStoreSnapshot,
} from '@/data';
import { ThemeProvider, ToastProvider, useAppFonts, useTheme } from '@/design-system';

export const unstable_settings = { anchor: '(tabs)' };

SplashScreen.preventAutoHideAsync().catch(() => {});

const sessionStore = createSqliteSessionStore(openTockyDatabase());

function ThemedApp() {
  const theme = useTheme();
  const { status, hasCompletedOnboarding } = useSessionStoreSnapshot();
  const isPastOnboarding = status !== 'ready' || hasCompletedOnboarding;

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.color.background },
        }}
      >
        <Stack.Protected guard={isPastOnboarding}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="new-session" options={{ presentation: 'modal' }} />
          <Stack.Screen name="timer" />
          <Stack.Screen name="session/[id]" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="categories" />
        </Stack.Protected>

        <Stack.Protected guard={!isPastOnboarding}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>

        <Stack.Screen name="sign-in" />
      </Stack>
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
        <ThemeProvider initialPreference={sessionStore.getSnapshot().themePreference}>
          <SessionStoreProvider store={sessionStore}>
            <ToastProvider>
              <ThemedApp />
            </ToastProvider>
          </SessionStoreProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
