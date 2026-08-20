import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

import {
  categorySurface,
  colors,
  duration,
  easing,
  elevation,
  radius,
  spacing,
  spring,
  textVariants,
  type ColorRole,
  type ColorScheme,
  type ThemePreference,
} from '../tokens';

export type Theme = {
  readonly scheme: ColorScheme;
  readonly color: Record<ColorRole, string>;
  readonly elevation: (typeof elevation)['light'];
  readonly spacing: typeof spacing;
  readonly radius: typeof radius;
  readonly text: typeof textVariants;
  readonly motion: {
    readonly duration: typeof duration;
    readonly easing: typeof easing;
    readonly spring: typeof spring;
    readonly reduced: boolean;
  };
  readonly categorySurface: (hue: string) => string;
};

type ThemeContextValue = {
  readonly theme: Theme;
  readonly preference: ThemePreference;
  readonly setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function useReduceMotionEnabled(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setIsEnabled(enabled);
      })
      .catch(() => setIsEnabled(false));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setIsEnabled);
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return isEnabled;
}

export function ThemeProvider({
  children,
  initialPreference = 'system',
}: {
  children: ReactNode;
  initialPreference?: ThemePreference;
}) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);
  const reducedMotion = useReduceMotionEnabled();

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const resolveCategorySurface = useCallback(
    (hue: string) => categorySurface(hue, scheme),
    [scheme],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference,
      theme: {
        scheme,
        color: colors[scheme],
        elevation: elevation[scheme],
        spacing,
        radius,
        text: textVariants,
        motion: { duration, easing, spring, reduced: reducedMotion },
        categorySurface: resolveCategorySurface,
      },
    }),
    [preference, reducedMotion, resolveCategorySurface, scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme must be used inside a ThemeProvider.');
  }
  return context.theme;
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useThemePreference must be used inside a ThemeProvider.');
  }
  return { preference: context.preference, setPreference: context.setPreference };
}
