import { act, fireEvent, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { createInMemorySessionStore, DEFAULT_CATEGORIES, type SessionStore } from '@/data';
import type { Session } from '@/domain';
import { ManageCategoriesScreen } from '@/features/categories/ManageCategoriesScreen';
import { renderWithProviders } from '@/test/renderWithProviders';

const NOW = new Date(2026, 7, 19, 12, 0).getTime();

function storeWith(sessions: readonly Session[] = []): SessionStore {
  return createInMemorySessionStore({
    status: 'ready',
    categories: DEFAULT_CATEGORIES,
    sessions,
    tasks: [],
  });
}

const TRACKED_SESSION: Session = {
  id: 'tracked',
  categoryId: DEFAULT_CATEGORIES[0]!.id,
  label: null,
  startedAt: NOW - 3_600_000,
  endedAt: NOW,
  pauses: [],
  linkedTaskId: null,
  note: null,
};

async function renderCategories(store: SessionStore = storeWith()) {
  await renderWithProviders(<ManageCategoriesScreen />, { store });
  return store;
}

async function press(label: string): Promise<void> {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

describe('ManageCategoriesScreen', () => {
  it('lists the categories it can manage', async () => {
    await renderCategories();

    DEFAULT_CATEGORIES.forEach((category) => {
      expect(screen.getByText(category.name)).toBeOnTheScreen();
    });
  });

  it('adds a category', async () => {
    const store = await renderCategories();

    await press('Add category');
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('Category name'), 'Reading');
    });
    await press('Add category');

    expect(store.getSnapshot().categories.at(-1)?.name).toBe('Reading');
  });

  it('will not add a category with no name', async () => {
    const store = await renderCategories();
    const before = store.getSnapshot().categories.length;

    await press('Add category');
    await press('Add category');

    expect(store.getSnapshot().categories).toHaveLength(before);
  });

  it('renames a category', async () => {
    const store = await renderCategories();
    const target = DEFAULT_CATEGORIES[0]!;

    await press(`Edit ${target.name}`);
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('Category name'), 'Deep work');
    });
    await press('Save');

    expect(store.getSnapshot().categories[0]?.name).toBe('Deep work');
  });

  it('moves a category down the order', async () => {
    const store = await renderCategories();
    const [first, second] = DEFAULT_CATEGORIES;

    await press(`Move ${first!.name} down`);

    expect(store.getSnapshot().categories[0]?.id).toBe(second!.id);
    expect(store.getSnapshot().categories[1]?.id).toBe(first!.id);
  });

  it('cannot move the first category up', async () => {
    await renderCategories();

    expect(
      screen.getByLabelText(`Move ${DEFAULT_CATEGORIES[0]!.name} up`).props.accessibilityState
        .disabled,
    ).toBe(true);
  });

  it('archives a category that has tracked time, rather than offering to delete it', async () => {
    const store = await renderCategories(storeWith([TRACKED_SESSION]));
    const tracked = DEFAULT_CATEGORIES[0]!;

    expect(screen.queryByLabelText(`Delete ${tracked.name}`)).toBeNull();
    await press(`Archive ${tracked.name}`);

    expect(store.getSnapshot().categories.find((c) => c.id === tracked.id)?.isArchived).toBe(true);
    expect(store.getSnapshot().sessions).toHaveLength(1);
  });

  it('explains what archiving does, and restores', async () => {
    const store = await renderCategories(storeWith([TRACKED_SESSION]));
    const tracked = DEFAULT_CATEGORIES[0]!;
    await press(`Archive ${tracked.name}`);

    expect(screen.getByText(/keep their history/)).toBeOnTheScreen();
    await press('Restore');

    expect(store.getSnapshot().categories.find((c) => c.id === tracked.id)?.isArchived).toBe(false);
  });

  it('asks before deleting a category nothing points at', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const store = await renderCategories();
    const unused = DEFAULT_CATEGORIES[0]!;

    await press(`Delete ${unused.name}`);

    expect(alert).toHaveBeenCalled();
    expect(store.getSnapshot().categories.some((c) => c.id === unused.id)).toBe(true);
    alert.mockRestore();
  });
});
