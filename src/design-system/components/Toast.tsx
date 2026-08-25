import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Surface } from './Surface';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';

export const TOAST_VISIBLE_MS = 2600;

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
    setTimeout(() => setMessage(null), TOAST_VISIBLE_MS);
  }, []);

  const value = useMemo(() => showToast, [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {message !== null && (
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOutDown}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: theme.spacing.xl,
            right: theme.spacing.xl,
            bottom: insets.bottom + theme.spacing.xl,
            alignItems: 'center',
          }}
        >
          <Surface radius="pill" padding="lg" elevation="raised" background="text">
            <View accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Text variant="labelSmall" color="background" align="center">
                {message}
              </Text>
            </View>
          </Surface>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}
