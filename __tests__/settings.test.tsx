import { act, fireEvent, screen } from '@testing-library/react-native';

import { createInMemorySessionStore, DEFAULT_CATEGORIES, type SessionStore } from '@/data';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { renderWithProviders } from '@/test/renderWithProviders';

function storeWith(seed: Parameters<typeof createInMemorySessionStore>[0] | null = null) {
  return createInMemorySessionStore(
    seed ?? {
      status: 'ready',
      categories: DEFAULT_CATEGORIES,
      sessions: [],
      tasks: [],
    },
  );
}

async function renderSettings(store: SessionStore = storeWith(), props = {}) {
  await renderWithProviders(<SettingsScreen {...props} />, { store });
  return store;
}

async function press(label: string): Promise<void> {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

describe('SettingsScreen profile', () => {
  it('invites a name when there is none', async () => {
    await renderSettings();

    expect(screen.getByText('Add your name')).toBeOnTheScreen();
  });

  it('saves a name and greets Home with it', async () => {
    const store = await renderSettings();

    await press('Add your name');
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('Your name'), 'Alex Rivera');
    });
    await press('Save');

    expect(store.getSnapshot().profileName).toBe('Alex Rivera');
    expect(screen.getByText('Alex Rivera')).toBeOnTheScreen();
  });

  it('trims a name rather than storing blank space', async () => {
    const store = await renderSettings();

    await press('Add your name');
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('Your name'), '   ');
    });
    await press('Save');

    expect(store.getSnapshot().profileName).toBeNull();
    expect(screen.getByText('Add your name')).toBeOnTheScreen();
  });

  it('promises the name goes no further than the device', async () => {
    await renderSettings();

    expect(screen.getByText('Everything stays on this device')).toBeOnTheScreen();
  });
});

describe('SettingsScreen appearance', () => {
  it('follows the system until told otherwise', async () => {
    await renderWithProviders(<SettingsScreen />, { store: storeWith(), theme: 'system' });

    expect(screen.getByLabelText('System').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Light').props.accessibilityState.selected).toBe(false);
  });

  it('remembers a chosen theme so it survives a relaunch', async () => {
    const store = await renderSettings();

    await press('Dark');

    expect(store.getSnapshot().themePreference).toBe('dark');
    expect(screen.getByLabelText('Dark').props.accessibilityState.selected).toBe(true);
  });
});

describe('SettingsScreen rows', () => {
  it('counts the categories it can manage', async () => {
    await renderSettings();

    expect(screen.getByText(String(DEFAULT_CATEGORIES.length))).toBeOnTheScreen();
  });

  it('leaves archived categories out of the count', async () => {
    await renderSettings(
      storeWith({
        status: 'ready',
        categories: DEFAULT_CATEGORIES.map((category, index) =>
          index === 0 ? { ...category, isArchived: true } : category,
        ),
        sessions: [],
        tasks: [],
      }),
    );

    expect(screen.getByText(String(DEFAULT_CATEGORIES.length - 1))).toBeOnTheScreen();
  });

  it('opens category management when there is somewhere to go', async () => {
    const onManageCategories = jest.fn();
    await renderSettings(storeWith(), { onManageCategories });

    await press('Manage categories');

    expect(onManageCategories).toHaveBeenCalled();
  });

  it('says which rows are not built yet rather than leading nowhere', async () => {
    await renderSettings();

    expect(screen.getAllByText('Soon').length).toBeGreaterThan(0);
    expect(screen.queryByLabelText('Daily reminder')).toBeNull();
  });

  it('names the version it is running', async () => {
    await renderSettings();

    expect(screen.getByText(/^Tocky · v\d+\.\d+\.\d+$/)).toBeOnTheScreen();
  });
});
