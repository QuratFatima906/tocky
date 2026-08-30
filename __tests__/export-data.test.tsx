import { act, fireEvent, screen } from '@testing-library/react-native';
import { Alert, Share } from 'react-native';

import { createInMemorySessionStore, DEFAULT_CATEGORIES, type SessionStore } from '@/data';
import type { Session } from '@/domain';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { renderWithProviders } from '@/test/renderWithProviders';

const NOW = new Date(2026, 7, 19, 12, 0).getTime();
const MINUTE = 60_000;

const SESSION: Session = {
  id: 'session-1',
  categoryId: 'work',
  label: 'Building Tocky',
  startedAt: NOW - 60 * MINUTE,
  endedAt: NOW - 30 * MINUTE,
  pauses: [],
  linkedTaskId: null,
  note: 'Fixed it, finally',
};

const mockWritten = jest.fn();
const mockDeleted = jest.fn();
const mockFileExists = jest.fn(() => false);

jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  File: class {
    name: string;
    uri: string;
    get exists() {
      return mockFileExists();
    }
    constructor(_directory: unknown, name: string) {
      this.name = name;
      this.uri = `file:///cache/${name}`;
    }
    create() {}
    delete() {
      mockDeleted();
    }
    write(contents: string) {
      mockWritten(this.name, contents);
    }
  },
}));

function storeWith(sessions: readonly Session[]): SessionStore {
  return createInMemorySessionStore({
    status: 'ready',
    categories: DEFAULT_CATEGORIES,
    sessions,
    tasks: [],
  });
}

let share: jest.SpiedFunction<typeof Share.share>;
let alert: jest.SpiedFunction<typeof Alert.alert>;

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  mockWritten.mockClear();
  mockDeleted.mockClear();
  mockFileExists.mockReturnValue(false);
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  share = jest
    .spyOn(Share, 'share')
    .mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function openSettings(sessions: readonly Session[]) {
  await renderWithProviders(<SettingsScreen />, { store: storeWith(sessions) });
}

async function chooseFormat(format: 'CSV' | 'JSON') {
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Export data, 1'));
  });
  const [, , buttons] = alert.mock.calls[0]!;
  await act(async () => {
    await buttons?.find((button) => button.text === format)?.onPress?.();
  });
}

describe('the export row', () => {
  it('counts what would go out, aloud as well as on screen', async () => {
    await openSettings([SESSION]);

    expect(screen.getByLabelText('Export data, 1')).toBeTruthy();
  });

  it('offers an export of nothing rather than a row that does nothing', async () => {
    await openSettings([]);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Export data, 0'));
    });

    expect(alert).toHaveBeenCalled();
  });

  it('asks which format rather than choosing one', async () => {
    await openSettings([SESSION]);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Export data, 1'));
    });

    const [title, , buttons] = alert.mock.calls[0]!;
    expect(title).toBe('Export your sessions');
    expect(buttons?.map((button) => button.text)).toEqual(['Cancel', 'CSV', 'JSON']);
  });
});

describe('what gets shared', () => {
  it('writes a CSV named for the day and hands the file to the share sheet', async () => {
    await openSettings([SESSION]);
    await chooseFormat('CSV');

    const [name, contents] = mockWritten.mock.calls[0]!;
    expect(name).toBe('tocky-2026-08-19.csv');
    expect(contents).toContain('Building Tocky');
    // The note has a comma in it, so the file is only readable if it is quoted.
    expect(contents).toContain('"Fixed it, finally"');
    expect(share).toHaveBeenCalledWith({
      url: 'file:///cache/tocky-2026-08-19.csv',
      title: 'tocky-2026-08-19.csv',
    });
  });

  it('replaces the file rather than appending to yesterday of the same name', async () => {
    mockFileExists.mockReturnValue(true);
    await openSettings([SESSION]);
    await chooseFormat('CSV');

    expect(mockDeleted).toHaveBeenCalledTimes(1);
    expect(mockWritten).toHaveBeenCalledTimes(1);
  });

  it('writes JSON when JSON is what was asked for', async () => {
    await openSettings([SESSION]);
    await chooseFormat('JSON');

    const [name, contents] = mockWritten.mock.calls[0]!;
    expect(name).toBe('tocky-2026-08-19.json');
    expect(JSON.parse(contents as string)).toMatchObject({ sessions: [{ id: 'session-1' }] });
  });

  it('confirms only once the sheet says it went', async () => {
    await openSettings([SESSION]);
    await chooseFormat('CSV');

    expect(screen.getByText('Exported 1 sessions')).toBeTruthy();
  });

  it('says nothing when the sheet was dismissed, which is a decision not a fault', async () => {
    share.mockResolvedValue({ action: Share.dismissedAction });
    await openSettings([SESSION]);
    await chooseFormat('CSV');

    expect(screen.queryByText('Exported 1 sessions')).toBeNull();
    expect(screen.queryByText('Export failed')).toBeNull();
  });

  it('never claims an export went out when it did not', async () => {
    share.mockRejectedValue(new Error('no share sheet'));
    await openSettings([SESSION]);
    await chooseFormat('CSV');

    expect(screen.getByText('Export failed')).toBeTruthy();
    expect(screen.queryByText('Exported 1 sessions')).toBeNull();
  });
});
