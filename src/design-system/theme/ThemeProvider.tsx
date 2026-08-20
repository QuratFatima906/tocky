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
  categoryForeground,
  categoryGlyph,
  categorySurface,
  colors,
  durations,
  easing,
  elevation,
  gradients,
  radius,
  spacing,
  springs,
  textVariants,
  REDUCED_MOTION_DURATION,
  type ColorRole,
  type ColorScheme,
  type DurationName,
  type ElevationLevel,
  type Gradient,
  type GradientName,
  type ThemePreference,
} from '../tokens';

type ShadowStyle = (typeof elevation)['light'][ElevationLevel];

export type Theme = {
  readonly scheme: ColorScheme;
  readonly color: Record<ColorRole, string>;
  readonly gradient: Record<GradientName, Gradient>;
  readonly elevation: Record<ElevationLevel, ShadowStyle>;
  readonly spacing: typeof spacing;
  readonly radius: typeof radius;
  readonly text: typeof textVariants;
  readonly motion: {
    readonly reduced: boolean;
    readonly duration: (name: DurationName) => number;
    readonly easing: typeof easing;
    readonly spring: typeof springs;
  };
  readonly category: {
    readonly surface: (hue: string) => string;
    readonly foreground: (hue: string) => string;
    readonly glyph: (hue: string) => string;
  };
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
    let hasReceivedLiveValue = false;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted && !hasReceivedLiveValue) setIsEnabled(enabled);
      })
      .catch(() => {
        if (isMounted && !hasReceivedLiveValue) setIsEnabled(false);
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      hasReceivedLiveValue = true;
      setIsEnabled(enabled);
    });

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

  const resolveDuration = useCallback(
    (name: DurationName) => (reducedMotion ? REDUCED_MOTION_DURATION : durations[name]),
    [reducedMotion],
  );

  const theme = useMemo<Theme>(
    () => ({
      scheme,
      color: colors[scheme],
      gradient: gradients[scheme],
      elevation: elevation[scheme],
      spacing,
      radius,
      text: textVariants,
      motion: { reduced: reducedMotion, duration: resolveDuration, easing, spring: springs },
      category: {
        surface: (hue) => categorySurface(hue, scheme),
        foreground: (hue) => categoryForeground(hue, scheme),
        glyph: (hue) => categoryGlyph(hue, scheme),
      },
    }),
    [reducedMotion, resolveDuration, scheme],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, preference, setPreference }),
    [preference, theme],
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
