import type { Session } from '@/domain';
import { describeSessionStoreContract, FINISHED_SESSION } from '@/test/sessionStoreContract';

import { DEFAULT_CATEGORIES } from '../defaultCategories';
import { createInMemorySessionStore, LOADING_SNAPSHOT } from '../sessionStore';

function createStore(sessions: readonly Session[]) {
  return createInMemorySessionStore({ status: 'ready', categories: DEFAULT_CATEGORIES, sessions });
}

describeSessionStoreContract('createInMemorySessionStore', createStore);

describe('createInMemorySessionStore', () => {
  it('exposes the snapshot it was created with', () => {
    expect(createStore([FINISHED_SESSION]).getSnapshot()).toEqual({
      status: 'ready',
      categories: DEFAULT_CATEGORIES,
      sessions: [FINISHED_SESSION],
    });
  });

  it('starts empty and loading from the loading snapshot', () => {
    expect(createInMemorySessionStore(LOADING_SNAPSHOT).getSnapshot().status).toBe('loading');
  });
});
