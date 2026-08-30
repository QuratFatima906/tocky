import { act, fireEvent, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { createInMemorySessionStore, DEFAULT_CATEGORIES, type SessionStore } from '@/data';
import { HelpScreen } from '@/features/settings/HelpScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { renderWithProviders } from '@/test/renderWithProviders';

const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();
const mockSchedule = jest.fn();
const mockCancel = jest.fn();

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DAILY: 'daily', WEEKLY: 'weekly' },
  getPermissionsAsync: () => mockGetPermissions(),
  requestPermissionsAsync: () => mockRequestPermissions(),
  scheduleNotificationAsync: (request: unknown) => mockSchedule(request),
  cancelScheduledNotificationAsync: (id: string) => mockCancel(id),
}));

function storeWith(overrides = {}): SessionStore {
  return createInMemorySessionStore({
    status: 'ready',
    categories: DEFAULT_CATEGORIES,
    sessions: [],
    tasks: [],
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPermissions.mockResolvedValue({ granted: true, canAskAgain: false });
  mockRequestPermissions.mockResolvedValue({ granted: true });
  mockSchedule.mockResolvedValue('scheduled');
  mockCancel.mockResolvedValue(undefined);
});

async function openSettings(store: SessionStore = storeWith()) {
  await renderWithProviders(<SettingsScreen />, { store });
  return store;
}

async function toggleWeekly(isOn: boolean) {
  await act(async () => {
    fireEvent(screen.getByTestId('weekly-report-switch'), 'valueChange', isOn);
  });
}

describe('the weekly report', () => {
  it('arrives on Monday morning, since weeks start Monday everywhere else', async () => {
    await openSettings();
    await toggleWeekly(true);

    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'tocky-weekly-report',
        // iOS counts weekdays from Sunday, so Monday is the second.
        trigger: { type: 'weekly', weekday: 2, hour: 9, minute: 0 },
      }),
    );
  });

  it('is remembered, so it survives a relaunch', async () => {
    const store = await openSettings();
    await toggleWeekly(true);

    expect(store.getSnapshot().weeklyReport).toBe(true);
  });

  it('cancels rather than leaving one scheduled when switched off', async () => {
    const store = await openSettings(storeWith({ weeklyReport: true }));
    await toggleWeekly(false);

    expect(mockCancel).toHaveBeenCalledWith('tocky-weekly-report');
    expect(mockSchedule).not.toHaveBeenCalled();
    expect(store.getSnapshot().weeklyReport).toBe(false);
  });

  it('invites a look rather than claiming a total it cannot know a week ahead', async () => {
    await openSettings();
    await toggleWeekly(true);

    const [{ content }] = mockSchedule.mock.calls[0] as [{ content: Record<string, string> }];
    expect(`${content.title} ${content.body}`).not.toMatch(
      /goal|streak|target|score|behind|fail|\d/i,
    );
  });

  it('says it will not arrive when notifications are refused', async () => {
    mockGetPermissions.mockResolvedValue({ granted: false, canAskAgain: false });
    await openSettings(storeWith({ weeklyReport: true }));
    await act(async () => {});

    expect(
      screen.getByLabelText(
        'Notifications are off for Tocky, so Weekly report will not arrive. Open Settings.',
      ),
    ).toBeTruthy();
  });
});

describe('help and support', () => {
  const onBack = jest.fn();

  async function openHelp() {
    await renderWithProviders(<HelpScreen onBack={onBack} />);
  }

  it('answers where the data lives, since nothing else can say so', async () => {
    await openHelp();

    expect(screen.getByText('Where is my data?')).toBeTruthy();
    expect(screen.getByText(/Nothing is uploaded/)).toBeTruthy();
  });

  it('warns that deleting the app takes the sessions with it', async () => {
    await openHelp();

    expect(screen.getByText(/Export your sessions from Settings first/)).toBeTruthy();
  });

  it('explains the long-session question as a question, never a cap', async () => {
    await openHelp();

    expect(screen.getByText(/keeps the session unless you say otherwise/)).toBeTruthy();
  });

  it('names the version, which is the first thing support would ask for', async () => {
    await openHelp();

    expect(screen.getByText(/^Tocky · v\d+\.\d+\.\d+$/)).toBeTruthy();
  });

  it('opens an email with the version already in the subject', async () => {
    const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await openHelp();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Email hello@tocky.app'));
    });

    expect(openUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^mailto:hello@tocky\.app\?subject=/),
    );
    expect(openUrl.mock.calls[0]![0]).toContain(encodeURIComponent('Tocky v'));
  });

  it('goes back the way it came', async () => {
    await openHelp();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Back'));
    });

    expect(onBack).toHaveBeenCalled();
  });
});
