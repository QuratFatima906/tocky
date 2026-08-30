import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  createSqliteSessionStore,
  openTockyDatabase,
  SessionStoreProvider,
  useSessionStoreSnapshot,
  useWriteFailureToast,
} from '@/data';
import { ThemeProvider, ToastProvider, useAppFonts, useTheme } from '@/design-system';
import { useRunningSessionWatch } from '@/features/timer/useRunningSessionWatch';

export const unstable_settings = { anchor: '(tabs)' };

SplashScreen.preventAutoHideAsync().catch(() => {});

const sessionStore = createSqliteSessionStore(openTockyDatabase());

function ThemedApp() {
  const theme = useTheme();
  const { status, hasCompletedOnboarding } = useSessionStoreSnapshot();
  const isPastOnboarding = status !== 'ready' || hasCompletedOnboarding;

  const router = useRouter();

  useWriteFailureToast(sessionStore);
  useRunningSessionWatch({
    onEditSession: useCallback(
      (sessionId: string) => router.push(`/session/${sessionId}`),
      [router],
    ),
  });

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.color.background },
          // A screen sliding in is the largest movement in the app, so Reduce
          // Motion trades it for a cross-fade rather than leaving it to snap.
          ...(theme.motion.reduced && { animation: 'fade' as const }),
        }}
      >
        <Stack.Protected guard={isPastOnboarding}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="new-session" options={{ presentation: 'modal' }} />
          <Stack.Screen name="timer" />
          <Stack.Screen name="session/[id]" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="help" />
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
