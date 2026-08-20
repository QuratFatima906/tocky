import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, type ThemePreference } from '@/design-system';

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

export function renderWithProviders(
  element: ReactElement,
  { theme = 'light' }: { theme?: ThemePreference } = {},
) {
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider initialPreference={theme}>{element}</ThemeProvider>
    </SafeAreaProvider>,
  );
}

export const INCLUDING_HIDDEN = { includeHiddenElements: true } as const;
