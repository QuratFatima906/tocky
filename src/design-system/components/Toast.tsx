import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // One timer, always cleared: a second toast must not be cut short by the
  // first one's countdown, and neither may fire onto an unmounted screen.
  const showToast = useCallback((nextMessage: string) => {
    if (hideTimer.current !== null) clearTimeout(hideTimer.current);

    setMessage(nextMessage);
    hideTimer.current = setTimeout(() => setMessage(null), TOAST_VISIBLE_MS);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current !== null) clearTimeout(hideTimer.current);
    },
    [],
  );

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
