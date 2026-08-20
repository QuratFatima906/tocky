import { act, render, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { AccessibilityInfo, Text, useColorScheme } from 'react-native';

import { CATEGORY_PRESETS, colors } from '../../tokens';
import { ThemeProvider, useTheme, useThemePreference } from '../ThemeProvider';

jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockedUseColorScheme = jest.mocked(useColorScheme);
const mockedIsReduceMotionEnabled = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled');
const mockedAddEventListener = jest.spyOn(AccessibilityInfo, 'addEventListener');

const WORK = CATEGORY_PRESETS[0]!;

function ThemeProbe() {
  const theme = useTheme();
  const { preference } = useThemePreference();
  return <Text testID="probe">{`${theme.scheme}|${theme.color.background}|${preference}`}</Text>;
}

function MotionProbe() {
  const theme = useTheme();
  return <Text testID="motion">{String(theme.motion.reduced)}</Text>;
}

function CategorySurfaceProbe({ hue }: { hue: string }) {
  const theme = useTheme();
  return <Text testID="surface">{theme.categorySurface(hue)}</Text>;
}

function readTestId(testID: string): string {
  return screen.getByTestId(testID).props.children as string;
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    mockedUseColorScheme.mockReturnValue('light');
    mockedIsReduceMotionEnabled.mockResolvedValue(false);
    mockedAddEventListener.mockReturnValue({ remove: jest.fn() } as never);
  });

  afterEach(() => jest.clearAllMocks());

  describe('scheme resolution', () => {
    it('follows the system scheme by default', async () => {
      mockedUseColorScheme.mockReturnValue('dark');
      await render(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );
      expect(readTestId('probe')).toBe(`dark|${colors.dark.background}|system`);
    });

    it('falls back to light when the system reports no preference', async () => {
      mockedUseColorScheme.mockReturnValue('unspecified');
      await render(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );
      expect(readTestId('probe')).toBe(`light|${colors.light.background}|system`);
    });

    it('lets an explicit preference override the system scheme', async () => {
      mockedUseColorScheme.mockReturnValue('light');
      await render(
        <ThemeProvider initialPreference="dark">
          <ThemeProbe />
        </ThemeProvider>,
      );
      expect(readTestId('probe')).toBe(`dark|${colors.dark.background}|dark`);
    });

    it('applies a preference chosen at runtime', async () => {
      function PreferenceSwitcher() {
        const { setPreference } = useThemePreference();
        useEffect(() => setPreference('dark'), [setPreference]);
        return <ThemeProbe />;
      }

      await render(
        <ThemeProvider>
          <PreferenceSwitcher />
        </ThemeProvider>,
      );
      expect(readTestId('probe')).toBe(`dark|${colors.dark.background}|dark`);
    });
  });

  describe('category surfaces', () => {
    it('uses the designed tint in light mode', async () => {
      await render(
        <ThemeProvider initialPreference="light">
          <CategorySurfaceProbe hue={WORK.hue} />
        </ThemeProvider>,
      );
      expect(readTestId('surface')).toBe(WORK.tint);
    });

    it('derives a translucent tint in dark mode', async () => {
      await render(
        <ThemeProvider initialPreference="dark">
          <CategorySurfaceProbe hue={WORK.hue} />
        </ThemeProvider>,
      );
      expect(readTestId('surface')).toMatch(/^rgba\(/);
    });
  });

  describe('reduced motion', () => {
    it('reports the system reduce-motion setting', async () => {
      mockedIsReduceMotionEnabled.mockResolvedValue(true);
      await render(
        <ThemeProvider>
          <MotionProbe />
        </ThemeProvider>,
      );
      expect(readTestId('motion')).toBe('true');
    });

    it('reacts when the setting changes while the app is running', async () => {
      await render(
        <ThemeProvider>
          <MotionProbe />
        </ThemeProvider>,
      );
      expect(readTestId('motion')).toBe('false');

      const notifyReduceMotionChanged = mockedAddEventListener.mock.calls[0]![1] as unknown as (
        isReduceMotionEnabled: boolean,
      ) => void;
      await act(async () => notifyReduceMotionChanged(true));

      expect(readTestId('motion')).toBe('true');
    });

    it('leaves motion enabled when the setting cannot be read', async () => {
      mockedIsReduceMotionEnabled.mockRejectedValue(new Error('unavailable'));
      await render(
        <ThemeProvider>
          <MotionProbe />
        </ThemeProvider>,
      );
      expect(readTestId('motion')).toBe('false');
    });

    it('removes its listener on unmount', async () => {
      const remove = jest.fn();
      mockedAddEventListener.mockReturnValue({ remove } as never);
      await render(
        <ThemeProvider>
          <MotionProbe />
        </ThemeProvider>,
      );
      await act(async () => screen.unmount());
      expect(remove).toHaveBeenCalled();
    });
  });

  it('throws a helpful error when used outside a provider', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<ThemeProbe />)).rejects.toThrow(/must be used inside a ThemeProvider/);
    consoleError.mockRestore();
  });
});
