import { act, fireEvent, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { createInMemorySessionStore, DEFAULT_CATEGORIES, type SessionStore } from '@/data';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { renderWithProviders } from '@/test/renderWithProviders';

const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();
const mockSchedule = jest.fn();
const mockCancel = jest.fn();

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
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

function allow() {
  mockGetPermissions.mockResolvedValue({ granted: true, canAskAgain: false });
}

function refuseForGood() {
  mockGetPermissions.mockResolvedValue({ granted: false, canAskAgain: false });
}

function askable() {
  mockGetPermissions.mockResolvedValue({ granted: false, canAskAgain: true });
}

beforeEach(() => {
  jest.clearAllMocks();
  allow();
  mockRequestPermissions.mockResolvedValue({ granted: true });
  mockSchedule.mockResolvedValue('scheduled');
  mockCancel.mockResolvedValue(undefined);
});

async function openSettings(store: SessionStore = storeWith()) {
  await renderWithProviders(<SettingsScreen />, { store });
  return store;
}

/** The picker turns its own native event into the (event, date) pair we get. */
async function pickTime(hour: number, minute: number) {
  const picked = new Date();
  picked.setHours(hour, minute, 0, 0);

  await act(async () => {
    fireEvent(screen.getByTestId('reminder-time-picker'), 'change', {
      nativeEvent: { timestamp: picked.getTime() },
    });
  });
}

async function toggleReminder() {
  await act(async () => {
    fireEvent(screen.getByLabelText('Daily reminder'), 'valueChange', true);
  });
}

describe('switching the reminder on', () => {
  it('asks for permission, since it has never been asked', async () => {
    askable();
    await openSettings();
    await toggleReminder();

    expect(mockRequestPermissions).toHaveBeenCalled();
  });

  it('remembers it, so a relaunch still has it on', async () => {
    const store = await openSettings();
    await toggleReminder();

    expect(store.getSnapshot().dailyReminder).toEqual({ isOn: true, hour: 20, minute: 0 });
  });

  it('schedules one notification a day at the chosen time', async () => {
    await openSettings();
    await toggleReminder();

    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'tocky-daily-reminder',
        trigger: { type: 'daily', hour: 20, minute: 0 },
      }),
    );
  });

  it('cancels the old one first, so moving the time leaves no second reminder', async () => {
    await openSettings();
    await toggleReminder();

    expect(mockCancel).toHaveBeenCalledWith('tocky-daily-reminder');
  });

  it('never says anything about how much was tracked', async () => {
    await openSettings();
    await toggleReminder();

    const [{ content }] = mockSchedule.mock.calls[0] as [{ content: Record<string, string> }];
    expect(`${content.title} ${content.body}`).not.toMatch(/goal|streak|target|score|behind|fail/i);
  });
});

describe('switching it off', () => {
  it('cancels the notification and schedules nothing', async () => {
    const store = await openSettings(
      storeWith({ dailyReminder: { isOn: true, hour: 8, minute: 30 } }),
    );
    await act(async () => {
      fireEvent(screen.getByLabelText('Daily reminder'), 'valueChange', false);
    });

    expect(mockCancel).toHaveBeenCalledWith('tocky-daily-reminder');
    expect(mockSchedule).not.toHaveBeenCalled();
    expect(store.getSnapshot().dailyReminder.isOn).toBe(false);
  });

  it('keeps the time that was chosen', async () => {
    const store = await openSettings(
      storeWith({ dailyReminder: { isOn: true, hour: 8, minute: 30 } }),
    );
    await act(async () => {
      fireEvent(screen.getByLabelText('Daily reminder'), 'valueChange', false);
    });

    expect(store.getSnapshot().dailyReminder).toEqual({ isOn: false, hour: 8, minute: 30 });
  });
});

describe('when notifications are refused', () => {
  async function openWithReminderOnButDenied() {
    refuseForGood();
    await openSettings(storeWith({ dailyReminder: { isOn: true, hour: 8, minute: 30 } }));
    // The permission is read on open, which resolves after the first paint.
    await act(async () => {});
  }

  it('says the reminder will not arrive, rather than looking as though it will', async () => {
    await openWithReminderOnButDenied();

    expect(
      screen.getByText('Notifications are off for Tocky, so this reminder will not arrive.'),
    ).toBeTruthy();
  });

  it('offers the only place that can change it', async () => {
    const openSystemSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    await openWithReminderOnButDenied();

    await act(async () => {
      fireEvent.press(
        screen.getByLabelText('Notifications are off for Tocky. Open Settings to turn them on.'),
      );
    });

    expect(openSystemSettings).toHaveBeenCalled();
  });

  it('does not crash the toggle, which still remembers what was asked for', async () => {
    refuseForGood();
    const store = await openSettings();
    await toggleReminder();

    expect(store.getSnapshot().dailyReminder.isOn).toBe(true);
  });

  it('says nothing while the reminder is off, since nothing is expected', async () => {
    refuseForGood();
    await openSettings();
    await act(async () => {});

    expect(screen.queryByText(/will not arrive/)).toBeNull();
  });
});

describe('the time', () => {
  it('is shown only when the reminder is on', async () => {
    await openSettings();

    expect(screen.queryByLabelText(/^Reminder time/)).toBeNull();
  });

  it('reads as a clock time once it is on', async () => {
    await openSettings(storeWith({ dailyReminder: { isOn: true, hour: 8, minute: 5 } }));

    expect(screen.getByLabelText('Reminder time, 08:05')).toBeTruthy();
  });

  it('opens a picker rather than nudging, now that pods allow one', async () => {
    await openSettings(storeWith({ dailyReminder: { isOn: true, hour: 8, minute: 30 } }));

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Reminder time, 08:30'));
    });

    expect(screen.getByTestId('reminder-time-picker')).toBeTruthy();
  });

  it('reschedules at the time that was picked', async () => {
    const store = await openSettings(
      storeWith({ dailyReminder: { isOn: true, hour: 8, minute: 30 } }),
    );
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Reminder time, 08:30'));
    });

    await pickTime(7, 15);

    expect(store.getSnapshot().dailyReminder).toEqual({ isOn: true, hour: 7, minute: 15 });
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: { type: 'daily', hour: 7, minute: 15 } }),
    );
  });

  it('does not ask for permission again just because the time moved', async () => {
    await openSettings(storeWith({ dailyReminder: { isOn: true, hour: 8, minute: 30 } }));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Reminder time, 08:30'));
    });

    await pickTime(7, 15);

    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });
});
