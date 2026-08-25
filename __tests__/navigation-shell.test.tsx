import { act, fireEvent, screen, within } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { createInMemorySessionStore, type SessionStore } from '@/data';
import { BOTTOM_CHROME_GAP, BottomChromeProvider, Screen, Text } from '@/design-system';
import type { Category, Session } from '@/domain';
import { ComingSoonScreen } from '@/features/navigation/ComingSoonScreen';
import { NowTrackingHost } from '@/features/navigation/NowTrackingHost';
import { TAB_DEFINITIONS, TockyTabBar } from '@/features/navigation/TockyTabBar';
import { renderWithProviders } from '@/test/renderWithProviders';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));

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
  return createInMemorySessionStore({
    status: 'ready',
    categories: CATEGORIES,
    sessions,
    tasks: [],
  });
}

function tabBarState(activeTabName: string, routeNames = TAB_DEFINITIONS.map((tab) => tab.name)) {
  return {
    index: routeNames.indexOf(activeTabName),
    routes: routeNames.map((name) => ({ key: `${name}-key`, name })),
  };
}

const TAB_BAR_HEIGHT = 92;
const TRACKING_BAR_HEIGHT = 64;
const SCREEN_PADDING_XS = 4;

async function measureTabBar() {
  await act(async () => {
    fireEvent(screen.getByTestId('tocky-tab-bar'), 'layout', {
      nativeEvent: { layout: { height: TAB_BAR_HEIGHT, width: 390, x: 0, y: 0 } },
    });
  });
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

  it('gives every tab a button trait so VoiceOver announces it as actionable', async () => {
    await renderTabBar();

    for (const tab of TAB_DEFINITIONS) {
      expect(screen.getByLabelText(tab.label).props.accessibilityRole).toBe('button');
    }
    expect(screen.getByTestId('tocky-tab-bar').props.accessibilityRole).toBe('tabbar');
  });

  it('shows only the routes the navigator actually has', async () => {
    await renderWithProviders(
      <BottomChromeProvider>
        <TockyTabBar
          state={tabBarState('index', ['index', 'history'])}
          navigation={{ navigate }}
          onStartSession={onStartSession}
        />
      </BottomChromeProvider>,
    );

    expect(screen.getByLabelText('Home')).toBeTruthy();
    expect(screen.queryByLabelText('Insights')).toBeNull();
  });

  it('keeps a tab highlighted when the navigator is on a route with no tab button', async () => {
    await renderWithProviders(
      <BottomChromeProvider>
        <TockyTabBar
          state={tabBarState('settings', [...TAB_DEFINITIONS.map((t) => t.name), 'settings'])}
          navigation={{ navigate }}
          onStartSession={onStartSession}
        />
      </BottomChromeProvider>,
    );

    for (const tab of TAB_DEFINITIONS) {
      expect(screen.getByLabelText(tab.label)).toBeTruthy();
    }
  });

  it('does not re-navigate when the already-active tab is pressed', async () => {
    await renderTabBar('history');

    await act(async () => {
      fireEvent.press(screen.getByLabelText('History'));
    });

    expect(navigate).not.toHaveBeenCalled();
  });

  it('lets a tabPress listener cancel navigation', async () => {
    const emit = jest.fn(() => ({ defaultPrevented: true }));
    await renderWithProviders(
      <BottomChromeProvider>
        <TockyTabBar
          state={tabBarState('index')}
          navigation={{ navigate, emit }}
          onStartSession={onStartSession}
        />
      </BottomChromeProvider>,
    );

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Tasks'));
    });

    expect(emit).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('NowTrackingHost', () => {
  const onOpenTimer = jest.fn();

  async function renderHost(store: SessionStore) {
    await renderWithProviders(
      <BottomChromeProvider>
        <NowTrackingHost onOpenTimer={onOpenTimer} />
        <TockyTabBar
          state={tabBarState('index')}
          navigation={{ navigate: jest.fn() }}
          onStartSession={jest.fn()}
        />
      </BottomChromeProvider>,
      { store },
    );
    await measureTabBar();
  }

  it('stays hidden until the tab bar has been measured, so it never covers it', async () => {
    await renderWithProviders(
      <BottomChromeProvider>
        <NowTrackingHost onOpenTimer={onOpenTimer} />
      </BottomChromeProvider>,
      { store: storeWith([buildSession()]) },
    );

    expect(screen.queryByTestId('now-tracking-host')).toBeNull();
  });

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

  it('stops the clock while the tabs are not the screen on top', async () => {
    await renderWithProviders(
      <BottomChromeProvider>
        <NowTrackingHost isLive={false} onOpenTimer={onOpenTimer} />
        <TockyTabBar
          state={tabBarState('index')}
          navigation={{ navigate: jest.fn() }}
          onStartSession={jest.fn()}
        />
      </BottomChromeProvider>,
      { store: storeWith([buildSession()]) },
    );
    await measureTabBar();

    await act(async () => {
      jest.advanceTimersByTime(18_000);
    });

    expect(screen.getByText('1:42:00')).toBeTruthy();
  });

  it('catches the clock up as soon as the tabs are back on top', async () => {
    function FocusableHost() {
      const [isLive, setIsLive] = useState(false);

      return (
        <>
          <Pressable accessibilityLabel="Return to the tabs" onPress={() => setIsLive(true)} />
          <NowTrackingHost isLive={isLive} onOpenTimer={onOpenTimer} />
          <TockyTabBar
            state={tabBarState('index')}
            navigation={{ navigate: jest.fn() }}
            onStartSession={jest.fn()}
          />
        </>
      );
    }

    await renderWithProviders(
      <BottomChromeProvider>
        <FocusableHost />
      </BottomChromeProvider>,
      { store: storeWith([buildSession()]) },
    );
    await measureTabBar();

    await act(async () => {
      jest.advanceTimersByTime(5 * MINUTE);
    });
    expect(screen.getByText('1:42:00')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Return to the tabs'));
    });
    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByText('1:47:00')).toBeTruthy();
  });

  it('names an uncategorised active session', async () => {
    await renderHost(storeWith([buildSession({ categoryId: 'gone' })]));

    expect(screen.getByText('Now tracking · Uncategorised')).toBeTruthy();
  });
});

describe('bottom chrome clearance', () => {
  function DismissableTrackingHost() {
    const [mounted, setMounted] = useState(true);

    return (
      <>
        <Pressable accessibilityLabel="Hide the tracking bar" onPress={() => setMounted(false)} />
        {mounted && <NowTrackingHost onOpenTimer={jest.fn()} />}
      </>
    );
  }

  async function renderChrome(store: SessionStore, screenProps = {}, dismissable = false) {
    await renderWithProviders(
      <BottomChromeProvider>
        <Screen testID="chrome-screen" {...screenProps}>
          <Text>Content</Text>
        </Screen>
        {dismissable ? <DismissableTrackingHost /> : <NowTrackingHost onOpenTimer={jest.fn()} />}
        <TockyTabBar
          state={tabBarState('index')}
          navigation={{ navigate: jest.fn() }}
          onStartSession={jest.fn()}
        />
      </BottomChromeProvider>,
      { store },
    );
    await measureTabBar();
  }

  function paddingBottomOf(testID: string, scrollable: boolean): number {
    const node = screen.getByTestId(testID).props;
    const style = scrollable ? node.contentContainerStyle : node.style;
    return StyleSheet.flatten(style).paddingBottom as number;
  }

  async function measureTrackingBar() {
    await act(async () => {
      fireEvent(screen.getByTestId('now-tracking-host'), 'layout', {
        nativeEvent: { layout: { height: TRACKING_BAR_HEIGHT, width: 358, x: 0, y: 0 } },
      });
    });
  }

  it('reserves both bars plus the gap between them, on a scrollable screen', async () => {
    await renderChrome(storeWith([buildSession()]), { scrollable: true, padding: 'xs' });
    await measureTrackingBar();

    expect(paddingBottomOf('chrome-screen', true)).toBe(
      TAB_BAR_HEIGHT + BOTTOM_CHROME_GAP + TRACKING_BAR_HEIGHT + SCREEN_PADDING_XS,
    );
  });

  it('reserves the same space on a fixed screen', async () => {
    await renderChrome(storeWith([buildSession()]), { padding: 'xs' });
    await measureTrackingBar();

    expect(paddingBottomOf('chrome-screen', false)).toBe(
      TAB_BAR_HEIGHT + BOTTOM_CHROME_GAP + TRACKING_BAR_HEIGHT + SCREEN_PADDING_XS,
    );
  });

  it('gives the space back when the tracking bar goes away', async () => {
    await renderChrome(storeWith([buildSession()]), { scrollable: true, padding: 'xs' }, true);
    await measureTrackingBar();

    const withTrackingBar = paddingBottomOf('chrome-screen', true);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Hide the tracking bar'));
    });

    expect(paddingBottomOf('chrome-screen', true)).toBeLessThan(withTrackingBar);
    expect(paddingBottomOf('chrome-screen', true)).toBe(TAB_BAR_HEIGHT + SCREEN_PADDING_XS);
  });
});

describe('ComingSoonScreen', () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it('names the screen and what it will become', async () => {
    await renderWithProviders(
      <BottomChromeProvider>
        <ComingSoonScreen title="Timer" promise="Your running session will live here." />
      </BottomChromeProvider>,
    );

    expect(screen.getByText('Timer').props.accessibilityRole).toBe('header');
    expect(screen.getByText('Your running session will live here.')).toBeTruthy();
  });

  it('offers no way out when it is a tab that cannot be left', async () => {
    await renderWithProviders(
      <BottomChromeProvider>
        <ComingSoonScreen title="History" promise="Every session you have tracked." />
      </BottomChromeProvider>,
    );

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('goes back from a pushed screen through its own labelled exit', async () => {
    await renderWithProviders(
      <BottomChromeProvider>
        <ComingSoonScreen
          title="Timer"
          promise="Your running session will live here."
          dismissLabel="Back to Home"
        />
      </BottomChromeProvider>,
    );

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Back to Home'));
    });

    expect(mockBack).toHaveBeenCalled();
  });
});
