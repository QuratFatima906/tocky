import { act, fireEvent, screen, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { createInMemorySessionStore, type SessionStore } from '@/data';
import { Screen, Text } from '@/design-system';
import type { Category, Session } from '@/domain';
import { BottomChromeProvider } from '@/features/navigation/BottomChrome';
import { ComingSoonScreen } from '@/features/navigation/ComingSoonScreen';
import { NowTrackingHost } from '@/features/navigation/NowTrackingHost';
import { TAB_DEFINITIONS, TockyTabBar } from '@/features/navigation/TockyTabBar';
import { renderWithProviders } from '@/test/renderWithProviders';

const NOW = new Date(2026, 7, 19, 12, 0).getTime();
const MINUTE = 60_000;

const CATEGORIES: readonly Category[] = [
  { id: 'work', name: 'Work', icon: 'work', color: '#8C7DE8', isArchived: false },
];

function buildSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'active',
    categoryId: 'work',
    label: 'Building Tocky',
    startedAt: NOW - 102 * MINUTE,
    endedAt: null,
    pauses: [],
    linkedTaskId: null,
    note: null,
    ...overrides,
  };
}

function storeWith(sessions: readonly Session[]): SessionStore {
  return createInMemorySessionStore({ status: 'ready', categories: CATEGORIES, sessions });
}

function tabBarState(activeTabName: string) {
  return {
    index: TAB_DEFINITIONS.findIndex((tab) => tab.name === activeTabName),
    routes: TAB_DEFINITIONS.map((tab) => ({ name: tab.name })),
  };
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('TockyTabBar', () => {
  const navigate = jest.fn();
  const onStartSession = jest.fn();

  beforeEach(() => {
    navigate.mockClear();
    onStartSession.mockClear();
  });

  async function renderTabBar(activeTabName = 'index') {
    await renderWithProviders(
      <BottomChromeProvider>
        <TockyTabBar
          state={tabBarState(activeTabName)}
          navigation={{ navigate }}
          onStartSession={onStartSession}
        />
      </BottomChromeProvider>,
    );
  }

  it('shows every destination plus the start button', async () => {
    await renderTabBar();

    for (const tab of TAB_DEFINITIONS) {
      expect(screen.getByLabelText(tab.label)).toBeTruthy();
    }
    expect(screen.getByLabelText('Start a new session')).toBeTruthy();
  });

  it('marks only the current tab as selected', async () => {
    await renderTabBar('insights');

    expect(screen.getByLabelText('Insights').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Home').props.accessibilityState.selected).toBe(false);
  });

  it('navigates to the tab that was pressed', async () => {
    await renderTabBar();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('History'));
    });

    expect(navigate).toHaveBeenCalledWith('history');
  });

  it('opens the new-session flow from the centre button rather than navigating a tab', async () => {
    await renderTabBar();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Start a new session'));
    });

    expect(onStartSession).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('exposes each tab as a tab role for assistive technology', async () => {
    await renderTabBar();

    expect(screen.getAllByRole('tab')).toHaveLength(TAB_DEFINITIONS.length);
  });
});

describe('NowTrackingHost', () => {
  const onOpenTimer = jest.fn();

  async function renderHost(store: SessionStore) {
    await renderWithProviders(
      <BottomChromeProvider>
        <NowTrackingHost onOpenTimer={onOpenTimer} />
      </BottomChromeProvider>,
      { store },
    );
  }

  it('stays hidden when nothing is being tracked', async () => {
    await renderHost(storeWith([buildSession({ endedAt: NOW - MINUTE })]));

    expect(screen.queryByTestId('now-tracking-host')).toBeNull();
  });

  it('shows the live elapsed time of the active session', async () => {
    await renderHost(storeWith([buildSession()]));

    expect(screen.getByText('Now tracking · Work')).toBeTruthy();
    expect(screen.getByText('1:42:00')).toBeTruthy();
  });

  it('ticks the elapsed time every second', async () => {
    await renderHost(storeWith([buildSession()]));

    await act(async () => {
      jest.advanceTimersByTime(18_000);
    });

    expect(screen.getByText('1:42:18')).toBeTruthy();
  });

  it('pauses the session in place and stops the clock', async () => {
    await renderHost(storeWith([buildSession()]));

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Pause Work'));
    });
    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });

    expect(screen.getByText('Paused · Work')).toBeTruthy();
    expect(screen.getByText('1:42:00')).toBeTruthy();
  });

  it('resumes a paused session and starts the clock again', async () => {
    await renderHost(storeWith([buildSession()]));

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Pause Work'));
    });
    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Resume Work'));
    });
    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });

    expect(screen.getByText('Now tracking · Work')).toBeTruthy();
    expect(screen.getByText('1:42:05')).toBeTruthy();
  });

  it('keeps the pause button reachable separately from the bar', async () => {
    await renderHost(storeWith([buildSession()]));

    const bar = screen.getByLabelText(/^Now tracking, Work,/);
    const pauseButton = screen.getByLabelText('Pause Work');

    expect(bar).not.toBe(pauseButton);
    expect(within(bar).queryByLabelText('Pause Work')).toBeNull();
  });

  it('speaks the elapsed time as words rather than a stopwatch string', async () => {
    await renderHost(storeWith([buildSession()]));

    expect(screen.getByLabelText(/1 hour 42 minutes\. Open the timer\.$/)).toBeTruthy();
  });

  it('opens the timer when the bar is tapped', async () => {
    await renderHost(storeWith([buildSession()]));

    await act(async () => {
      fireEvent.press(screen.getByLabelText(/^Now tracking, Work,/));
    });

    expect(onOpenTimer).toHaveBeenCalled();
  });

  it('names an uncategorised active session', async () => {
    await renderHost(storeWith([buildSession({ categoryId: 'gone' })]));

    expect(screen.getByText('Now tracking · Uncategorised')).toBeTruthy();
  });
});

describe('bottom chrome clearance', () => {
  it('pads a screen by the combined height of the tab bar and the tracking bar', async () => {
    await renderWithProviders(
      <BottomChromeProvider>
        <Screen scrollable testID="scrollable-screen">
          <Text>Content</Text>
        </Screen>
        <NowTrackingHost onOpenTimer={jest.fn()} />
        <TockyTabBar
          state={tabBarState('index')}
          navigation={{ navigate: jest.fn() }}
          onStartSession={jest.fn()}
        />
      </BottomChromeProvider>,
      { store: storeWith([buildSession()]) },
    );

    const tabBarHeight = 92;
    const trackingBarHeight = 64;

    await act(async () => {
      fireEvent(screen.getByTestId('tocky-tab-bar'), 'layout', {
        nativeEvent: { layout: { height: tabBarHeight, width: 390, x: 0, y: 0 } },
      });
    });
    await act(async () => {
      fireEvent(screen.getByTestId('now-tracking-host'), 'layout', {
        nativeEvent: { layout: { height: trackingBarHeight, width: 358, x: 0, y: 0 } },
      });
    });

    const { paddingBottom } = StyleSheet.flatten(
      screen.getByTestId('scrollable-screen').props.contentContainerStyle,
    );

    expect(paddingBottom).toBeGreaterThanOrEqual(tabBarHeight + trackingBarHeight);
  });
});

describe('ComingSoonScreen', () => {
  it('names the destination and says what will land there', async () => {
    await renderWithProviders(
      <ComingSoonScreen title="History" promise="Your tracked sessions will show up here." />,
    );

    expect(screen.getByRole('header', { name: 'History' })).toBeTruthy();
    expect(screen.getByText('Your tracked sessions will show up here.')).toBeTruthy();
  });
});
