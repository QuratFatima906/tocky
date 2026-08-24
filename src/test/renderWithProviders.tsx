import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createInMemorySessionStore, SessionStoreProvider, type SessionStore } from '@/data';
import { ThemeProvider, type ThemePreference } from '@/design-system';

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const EMPTY_STORE = { status: 'ready', categories: [], sessions: [] } as const;

export function renderWithProviders(
  element: ReactElement,
  {
    theme = 'light',
    store = createInMemorySessionStore(EMPTY_STORE),
  }: { theme?: ThemePreference; store?: SessionStore } = {},
) {
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider initialPreference={theme}>
        <SessionStoreProvider store={store}>{element}</SessionStoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

export const INCLUDING_HIDDEN = { includeHiddenElements: true } as const;
