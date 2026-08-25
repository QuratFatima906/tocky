import { act, configure, fireEvent, screen, within } from '@testing-library/react-native';
import { AccessibilityInfo, Dimensions, ScrollView } from 'react-native';

import { createInMemorySessionStore, type SessionStore } from '@/data';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { renderWithProviders } from '@/test/renderWithProviders';

const PANE_WIDTH = Dimensions.get('window').width;

const onSignIn = jest.fn();

async function renderOnboarding(): Promise<SessionStore> {
  const store = createInMemorySessionStore({
    status: 'ready',
    categories: [],
    sessions: [],
    tasks: [],
  });

  await renderWithProviders(
    <OnboardingScreen onDone={store.completeOnboarding} onSignIn={onSignIn} />,
    { store },
  );
  return store;
}

let scrollTo: jest.SpyInstance;
let announce: jest.SpyInstance;

beforeEach(() => {
  onSignIn.mockClear();
  scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo').mockImplementation(() => {});
  announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
});

afterEach(() => {
  scrollTo.mockRestore();
  announce.mockRestore();
});

// Off-screen panes are deliberately hidden from VoiceOver, and asserting on
// them is the point of most of these tests.
configure({ defaultIncludeHiddenElements: true });

function pane(index: number) {
  return within(screen.getByTestId(`onboarding-pane-${index}`));
}

async function swipeToPane(index: number): Promise<void> {
  await act(async () => {
    fireEvent(screen.getByTestId('onboarding-pager'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: index * PANE_WIDTH, y: 0 } },
    });
  });
}

async function press(element: Parameters<typeof fireEvent.press>[0]): Promise<void> {
  await act(async () => {
    fireEvent.press(element);
  });
}

describe('onboarding', () => {
  it('opens on the first pane', async () => {
    await renderOnboarding();

    expect(pane(0).getByText('Where did your day go?')).toBeOnTheScreen();
    expect(pane(0).getByLabelText('Step 1 of 3')).toBeOnTheScreen();
  });

  it('introduces the app, one tap and insights, in that order', async () => {
    await renderOnboarding();

    expect(pane(0).getByText('Meet Tocky')).toBeOnTheScreen();
    expect(pane(1).getByText('One tap')).toBeOnTheScreen();
    expect(pane(2).getByText('Insights')).toBeOnTheScreen();
  });

  it('scrolls the pager to the pane the dots claim, not just the dots', async () => {
    await renderOnboarding();

    await press(pane(0).getByLabelText('Next'));

    expect(scrollTo).toHaveBeenCalledWith({ x: PANE_WIDTH, animated: true });
    expect(pane(0).getByLabelText('Step 2 of 3')).toBeOnTheScreen();
  });

  it('tells a screen reader which pane it landed on', async () => {
    await renderOnboarding();

    await press(pane(0).getByLabelText('Next'));

    expect(announce).toHaveBeenCalledWith(
      expect.stringContaining('Pick a category, start the clock.'),
    );
    expect(announce).toHaveBeenCalledWith(expect.stringContaining('Step 2 of 3'));
  });

  it('keeps panes the reader is not on out of the way', async () => {
    await renderOnboarding();

    expect(screen.getByTestId('onboarding-pane-0').props.accessibilityElementsHidden).toBe(false);
    expect(screen.getByTestId('onboarding-pane-2').props.accessibilityElementsHidden).toBe(true);
  });

  it('moves the dot indicator on when Next is pressed', async () => {
    await renderOnboarding();

    await press(pane(0).getByLabelText('Next'));

    expect(pane(0).getByLabelText('Step 2 of 3')).toBeOnTheScreen();
  });

  it('moves the dot indicator with a swipe', async () => {
    await renderOnboarding();

    await swipeToPane(2);

    expect(pane(2).getByLabelText('Step 3 of 3')).toBeOnTheScreen();
  });

  it('offers Get started only on the last pane, and Skip only before it', async () => {
    await renderOnboarding();

    expect(pane(0).getByLabelText('Skip')).toBeOnTheScreen();
    expect(pane(1).getByLabelText('Skip')).toBeOnTheScreen();
    expect(pane(2).queryByLabelText('Skip')).toBeNull();
    expect(pane(2).getByLabelText('Get started')).toBeOnTheScreen();
    expect(pane(0).queryByLabelText('Get started')).toBeNull();
  });

  it('is done with onboarding when Get started is pressed', async () => {
    const store = await renderOnboarding();

    await press(pane(2).getByLabelText('Get started'));

    expect(store.getSnapshot().hasCompletedOnboarding).toBe(true);
  });

  it('is done with onboarding when it is skipped', async () => {
    const store = await renderOnboarding();

    await press(pane(0).getByLabelText('Skip'));

    expect(store.getSnapshot().hasCompletedOnboarding).toBe(true);
  });

  it('promises privacy rather than productivity', async () => {
    await renderOnboarding();

    expect(pane(2).getByText(/stays on your device/)).toBeOnTheScreen();
    expect(screen.queryByText(/streak|goal/i)).toBeNull();
  });

  it('offers a way in for people who already have an account, on the last pane only', async () => {
    await renderOnboarding();

    expect(pane(0).queryByText('I already have an account')).toBeNull();
    await swipeToPane(2);

    expect(pane(2).getByText('I already have an account')).toBeOnTheScreen();
  });

  it('retires the panes on the way to sign in, so they never come back', async () => {
    const store = await renderOnboarding();
    await swipeToPane(2);

    await press(pane(2).getByText('I already have an account'));

    expect(onSignIn).toHaveBeenCalled();
    expect(store.getSnapshot().hasCompletedOnboarding).toBe(true);
  });
});
