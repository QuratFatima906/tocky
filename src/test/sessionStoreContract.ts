import type { SessionStore } from '@/data';
import { isPaused, isRunning, sessionSeconds, type Session } from '@/domain';

export const CONTRACT_NOW = new Date(2026, 7, 19, 12, 0).getTime();
const MINUTE = 60_000;

export const ACTIVE_SESSION: Session = {
  id: 'active',
  categoryId: 'work',
  label: 'Building Tocky',
  startedAt: CONTRACT_NOW - 60 * MINUTE,
  endedAt: null,
  pauses: [],
  linkedTaskId: null,
  note: null,
};

export const FINISHED_SESSION: Session = {
  ...ACTIVE_SESSION,
  id: 'finished',
  startedAt: CONTRACT_NOW - 180 * MINUTE,
  endedAt: CONTRACT_NOW - 120 * MINUTE,
};

export function describeSessionStoreContract(
  storeName: string,
  createStore: (sessions: readonly Session[]) => SessionStore,
): void {
  describe(`${storeName} honours the session store contract`, () => {
    it('returns a stable snapshot reference until something changes', () => {
      const store = createStore([FINISHED_SESSION]);

      expect(store.getSnapshot()).toBe(store.getSnapshot());
    });

    it('notifies subscribers when the active session changes', () => {
      const store = createStore([ACTIVE_SESSION]);
      const onStoreChanged = jest.fn();
      store.subscribe(onStoreChanged);

      store.pauseActiveSession(CONTRACT_NOW);

      expect(onStoreChanged).toHaveBeenCalledTimes(1);
    });

    it('stops notifying after unsubscribing', () => {
      const store = createStore([ACTIVE_SESSION]);
      const onStoreChanged = jest.fn();
      store.subscribe(onStoreChanged)();

      store.pauseActiveSession(CONTRACT_NOW);

      expect(onStoreChanged).not.toHaveBeenCalled();
    });

    it('opens a pause on the active session and freezes its elapsed time', () => {
      const store = createStore([ACTIVE_SESSION]);

      store.pauseActiveSession(CONTRACT_NOW);
      const paused = store.getSnapshot().sessions[0]!;

      expect(isPaused(paused)).toBe(true);
      expect(sessionSeconds(paused, CONTRACT_NOW + 30 * MINUTE)).toBe(
        sessionSeconds(paused, CONTRACT_NOW),
      );
    });

    it('closes the open pause on resume and keeps time running again', () => {
      const store = createStore([ACTIVE_SESSION]);

      store.pauseActiveSession(CONTRACT_NOW);
      store.resumeActiveSession(CONTRACT_NOW + 10 * MINUTE);
      const resumed = store.getSnapshot().sessions[0]!;

      expect(isPaused(resumed)).toBe(false);
      expect(sessionSeconds(resumed, CONTRACT_NOW + 10 * MINUTE)).toBe(60 * 60);
    });

    it('ignores a second pause while already paused', () => {
      const store = createStore([ACTIVE_SESSION]);
      const onStoreChanged = jest.fn();
      store.subscribe(onStoreChanged);

      store.pauseActiveSession(CONTRACT_NOW);
      store.pauseActiveSession(CONTRACT_NOW + MINUTE);

      expect(store.getSnapshot().sessions[0]!.pauses).toHaveLength(1);
      expect(onStoreChanged).toHaveBeenCalledTimes(1);
    });

    it('ignores a resume when nothing is paused', () => {
      const store = createStore([ACTIVE_SESSION]);
      const before = store.getSnapshot();

      store.resumeActiveSession(CONTRACT_NOW);

      expect(store.getSnapshot()).toBe(before);
    });

    it('starts a session that is running, newest first, with its own id', () => {
      const store = createStore([FINISHED_SESSION]);

      store.startSession({ categoryId: 'learning', label: 'Reading', at: CONTRACT_NOW });
      const [started, ...rest] = store.getSnapshot().sessions;

      expect(started).toMatchObject({
        categoryId: 'learning',
        label: 'Reading',
        startedAt: CONTRACT_NOW,
        endedAt: null,
        pauses: [],
      });
      expect(started!.id).not.toBe(FINISHED_SESSION.id);
      expect(rest.map((session) => session.id)).toEqual([FINISHED_SESSION.id]);
    });

    it('starts a session with no label at all', () => {
      const store = createStore([]);

      store.startSession({ categoryId: 'work', label: null, at: CONTRACT_NOW });

      expect(store.getSnapshot().sessions[0]!.label).toBeNull();
    });

    it('ends the running session at the very instant the next one starts', () => {
      const store = createStore([ACTIVE_SESSION]);

      store.startSession({ categoryId: 'health', label: null, at: CONTRACT_NOW });
      const { sessions } = store.getSnapshot();
      const previous = sessions.find((session) => session.id === ACTIVE_SESSION.id)!;

      expect(previous.endedAt).toBe(CONTRACT_NOW);
      expect(sessions.filter(isRunning)).toHaveLength(1);
    });

    it('leaves no untracked gap and no overlap between the two', () => {
      const store = createStore([ACTIVE_SESSION]);

      store.startSession({ categoryId: 'health', label: null, at: CONTRACT_NOW });
      const { sessions } = store.getSnapshot();
      const previous = sessions.find((session) => session.id === ACTIVE_SESSION.id)!;
      const started = sessions.find(isRunning)!;

      expect(started.startedAt).toBe(previous.endedAt);
    });

    it('discards a session a second Start tap ended before it recorded anything', () => {
      const store = createStore([FINISHED_SESSION]);

      store.startSession({ categoryId: 'work', label: null, at: CONTRACT_NOW });
      const ghostId = store.getSnapshot().sessions[0]!.id;
      store.startSession({ categoryId: 'work', label: null, at: CONTRACT_NOW + 40 });

      const { sessions } = store.getSnapshot();
      expect(sessions.map((session) => session.id)).not.toContain(ghostId);
      expect(sessions.filter(isRunning)).toHaveLength(1);
      expect(sessions).toHaveLength(2);
    });

    it('keeps a session switched away from after a full second of tracking', () => {
      const store = createStore([]);

      store.startSession({ categoryId: 'work', label: null, at: CONTRACT_NOW });
      store.startSession({ categoryId: 'health', label: null, at: CONTRACT_NOW + 1000 });

      expect(store.getSnapshot().sessions).toHaveLength(2);
    });

    it('keeps a session paused on purpose, however little of it counted', () => {
      const store = createStore([]);

      store.startSession({ categoryId: 'work', label: null, at: CONTRACT_NOW });
      store.pauseActiveSession(CONTRACT_NOW);
      store.startSession({ categoryId: 'health', label: null, at: CONTRACT_NOW + 10 * MINUTE });

      const paused = store.getSnapshot().sessions.find((session) => session.categoryId === 'work')!;
      expect(sessionSeconds(paused, CONTRACT_NOW + 20 * MINUTE)).toBe(0);
      expect(paused.endedAt).toBe(CONTRACT_NOW + 10 * MINUTE);
    });

    it('keeps a session the clock jumped backwards over, rather than eating it', () => {
      const store = createStore([]);

      store.startSession({ categoryId: 'work', label: null, at: CONTRACT_NOW });
      store.startSession({ categoryId: 'health', label: null, at: CONTRACT_NOW - 30 * MINUTE });

      expect(store.getSnapshot().sessions).toHaveLength(2);
    });

    it('takes the discarded session pauses and all', () => {
      const store = createStore([]);

      store.startSession({ categoryId: 'work', label: null, at: CONTRACT_NOW });
      store.pauseActiveSession(CONTRACT_NOW);
      store.startSession({ categoryId: 'health', label: null, at: CONTRACT_NOW + 40 });

      const [running] = store.getSnapshot().sessions;
      expect(store.getSnapshot().sessions).toHaveLength(1);
      expect(running!.pauses).toEqual([]);
    });

    it('closes an open pause when the paused session is switched away from', () => {
      const store = createStore([ACTIVE_SESSION]);

      store.pauseActiveSession(CONTRACT_NOW - MINUTE);
      store.startSession({ categoryId: 'health', label: null, at: CONTRACT_NOW });
      const previous = store
        .getSnapshot()
        .sessions.find((session) => session.id === ACTIVE_SESSION.id)!;

      expect(previous.pauses).toEqual([
        { startedAt: CONTRACT_NOW - MINUTE, endedAt: CONTRACT_NOW },
      ]);
      expect(sessionSeconds(previous, CONTRACT_NOW + 30 * MINUTE)).toBe(59 * 60);
    });

    it('notifies subscribers once when a session starts', () => {
      const store = createStore([ACTIVE_SESSION]);
      const onStoreChanged = jest.fn();
      store.subscribe(onStoreChanged);

      store.startSession({ categoryId: 'health', label: null, at: CONTRACT_NOW });

      expect(onStoreChanged).toHaveBeenCalledTimes(1);
    });

    it('ends the running session at the moment it was told', () => {
      const store = createStore([ACTIVE_SESSION]);

      store.endActiveSession(CONTRACT_NOW);
      const ended = store.getSnapshot().sessions[0]!;

      expect(ended.endedAt).toBe(CONTRACT_NOW);
      expect(isRunning(ended)).toBe(false);
      expect(sessionSeconds(ended, CONTRACT_NOW + 30 * MINUTE)).toBe(60 * 60);
    });

    it('closes an open pause when the paused session ends, rather than leaving it hanging', () => {
      const store = createStore([ACTIVE_SESSION]);

      store.pauseActiveSession(CONTRACT_NOW - MINUTE);
      store.endActiveSession(CONTRACT_NOW);
      const ended = store.getSnapshot().sessions[0]!;

      expect(ended.pauses).toEqual([{ startedAt: CONTRACT_NOW - MINUTE, endedAt: CONTRACT_NOW }]);
      expect(isPaused(ended)).toBe(false);
    });

    it('keeps the ended session in history rather than dropping it', () => {
      const store = createStore([ACTIVE_SESSION]);

      store.endActiveSession(CONTRACT_NOW);

      expect(store.getSnapshot().sessions).toHaveLength(1);
    });

    it('deletes a session outright, pauses and all', () => {
      const store = createStore([ACTIVE_SESSION, FINISHED_SESSION]);

      store.pauseActiveSession(CONTRACT_NOW - MINUTE);
      store.deleteSession(ACTIVE_SESSION.id);

      expect(store.getSnapshot().sessions.map((session) => session.id)).toEqual([
        FINISHED_SESSION.id,
      ]);
    });

    it('deletes a session that has already ended, when asked for it by name', () => {
      const store = createStore([ACTIVE_SESSION, FINISHED_SESSION]);

      store.deleteSession(FINISHED_SESSION.id);

      expect(store.getSnapshot().sessions.map((session) => session.id)).toEqual([
        ACTIVE_SESSION.id,
      ]);
    });

    it('ignores a delete for a session it does not have', () => {
      const store = createStore([FINISHED_SESSION]);
      const before = store.getSnapshot();

      store.deleteSession('never-existed');

      expect(store.getSnapshot()).toBe(before);
    });

    it('edits every field the user can change, and leaves the rest alone', () => {
      const store = createStore([FINISHED_SESSION]);

      store.editSession(FINISHED_SESSION.id, {
        categoryId: 'health',
        label: 'Lunch walk',
        startedAt: CONTRACT_NOW - 30 * MINUTE,
        endedAt: CONTRACT_NOW,
        note: 'Longer than planned',
      });

      expect(store.getSnapshot().sessions[0]).toMatchObject({
        id: FINISHED_SESSION.id,
        categoryId: 'health',
        label: 'Lunch walk',
        startedAt: CONTRACT_NOW - 30 * MINUTE,
        endedAt: CONTRACT_NOW,
        note: 'Longer than planned',
        pauses: FINISHED_SESSION.pauses,
      });
    });

    it('ignores an edit for a session it does not have', () => {
      const store = createStore([FINISHED_SESSION]);
      const before = store.getSnapshot();

      store.editSession('never-existed', {
        categoryId: 'health',
        label: null,
        startedAt: CONTRACT_NOW,
        endedAt: null,
        note: null,
      });

      expect(store.getSnapshot()).toBe(before);
    });

    it('notes the running session, and clears the note again', () => {
      const store = createStore([ACTIVE_SESSION]);

      store.noteActiveSession('Deep in the schema');
      expect(store.getSnapshot().sessions[0]!.note).toBe('Deep in the schema');

      store.noteActiveSession(null);
      expect(store.getSnapshot().sessions[0]!.note).toBeNull();
    });

    it('does not churn subscribers when the note has not changed', () => {
      const store = createStore([ACTIVE_SESSION]);
      const onStoreChanged = jest.fn();
      store.subscribe(onStoreChanged);

      store.noteActiveSession('Same');
      store.noteActiveSession('Same');

      expect(onStoreChanged).toHaveBeenCalledTimes(1);
    });

    it('has nothing to end, discard or note when nothing is running', () => {
      const store = createStore([FINISHED_SESSION]);
      const before = store.getSnapshot();

      store.endActiveSession(CONTRACT_NOW);
      store.noteActiveSession('Ignored');

      expect(store.getSnapshot()).toBe(before);
    });

    it('adds a task, newest first, open until it is completed', () => {
      const store = createStore([]);

      store.addTask({
        title: 'Write release notes',
        categoryId: 'work',
        estimateSeconds: 1800,
        at: CONTRACT_NOW,
      });
      const [task] = store.getSnapshot().tasks;

      expect(task).toMatchObject({
        title: 'Write release notes',
        categoryId: 'work',
        estimateSeconds: 1800,
        createdAt: CONTRACT_NOW,
        completedAt: null,
      });
    });

    it('completes a task and lets it be reopened', () => {
      const store = createStore([]);
      store.addTask({
        title: 'Ship it',
        categoryId: 'work',
        estimateSeconds: null,
        at: CONTRACT_NOW,
      });
      const taskId = store.getSnapshot().tasks[0]!.id;

      store.setTaskCompleted(taskId, CONTRACT_NOW + MINUTE);
      expect(store.getSnapshot().tasks[0]!.completedAt).toBe(CONTRACT_NOW + MINUTE);

      store.setTaskCompleted(taskId, null);
      expect(store.getSnapshot().tasks[0]!.completedAt).toBeNull();
    });

    it('does not churn subscribers when a task is already in that state', () => {
      const store = createStore([]);
      store.addTask({
        title: 'Ship it',
        categoryId: 'work',
        estimateSeconds: null,
        at: CONTRACT_NOW,
      });
      const taskId = store.getSnapshot().tasks[0]!.id;
      const onStoreChanged = jest.fn();
      store.subscribe(onStoreChanged);

      store.setTaskCompleted(taskId, null);
      store.setTaskCompleted('never-existed', CONTRACT_NOW);

      expect(onStoreChanged).not.toHaveBeenCalled();
    });

    it('links a session to the task it was started from', () => {
      const store = createStore([]);
      store.addTask({
        title: 'Ship it',
        categoryId: 'work',
        estimateSeconds: null,
        at: CONTRACT_NOW,
      });
      const taskId = store.getSnapshot().tasks[0]!.id;

      store.startSession({
        categoryId: 'work',
        label: 'Ship it',
        at: CONTRACT_NOW,
        linkedTaskId: taskId,
      });

      expect(store.getSnapshot().sessions[0]!.linkedTaskId).toBe(taskId);
    });

    it('links a session to nothing when it was not started from a task', () => {
      const store = createStore([]);

      store.startSession({ categoryId: 'work', label: null, at: CONTRACT_NOW });

      expect(store.getSnapshot().sessions[0]!.linkedTaskId).toBeNull();
    });

    it('starts out having never shown onboarding', () => {
      expect(createStore([]).getSnapshot().hasCompletedOnboarding).toBe(false);
    });

    it('remembers that onboarding is done', () => {
      const store = createStore([]);

      store.completeOnboarding();

      expect(store.getSnapshot().hasCompletedOnboarding).toBe(true);
    });

    it('does not churn subscribers when onboarding is already done', () => {
      const store = createStore([]);
      store.completeOnboarding();
      const onStoreChanged = jest.fn();
      store.subscribe(onStoreChanged);

      store.completeOnboarding();

      expect(onStoreChanged).not.toHaveBeenCalled();
    });

    it('starts with no profile name and no theme of its own', () => {
      const snapshot = createStore([]).getSnapshot();

      expect(snapshot.profileName).toBeNull();
      expect(snapshot.themePreference).toBe('system');
    });

    it('remembers a profile name, trimmed', () => {
      const store = createStore([]);

      store.setProfileName('  Alex Rivera  ');

      expect(store.getSnapshot().profileName).toBe('Alex Rivera');
    });

    it('clears the name rather than storing blank space', () => {
      const store = createStore([]);
      store.setProfileName('Alex');

      store.setProfileName('   ');

      expect(store.getSnapshot().profileName).toBeNull();
    });

    it('remembers a theme preference', () => {
      const store = createStore([]);

      store.setThemePreference('dark');

      expect(store.getSnapshot().themePreference).toBe('dark');
    });

    it('does not churn subscribers when a setting is unchanged', () => {
      const store = createStore([]);
      store.setProfileName('Alex');
      store.setThemePreference('dark');
      const onStoreChanged = jest.fn();
      store.subscribe(onStoreChanged);

      store.setProfileName('Alex');
      store.setThemePreference('dark');

      expect(onStoreChanged).not.toHaveBeenCalled();
    });

    it('adds a category at the end, where it was put', () => {
      const store = createStore([]);
      const before = store.getSnapshot().categories.length;

      store.addCategory({ name: '  Reading  ', icon: 'learning', color: '#2FBFA0' });
      const categories = store.getSnapshot().categories;

      expect(categories).toHaveLength(before + 1);
      expect(categories[before]?.name).toBe('Reading');
      expect(categories[before]?.isArchived).toBe(false);
    });

    it('edits a category everywhere at once', () => {
      const store = createStore([]);
      const target = store.getSnapshot().categories[0]!;

      store.editCategory(target.id, { name: 'Deep work', icon: 'work', color: '#8C7DE8' });

      expect(store.getSnapshot().categories[0]).toMatchObject({
        id: target.id,
        name: 'Deep work',
        color: '#8C7DE8',
      });
    });

    it('archives a category without losing it', () => {
      const store = createStore([]);
      const target = store.getSnapshot().categories[0]!;

      store.setCategoryArchived(target.id, true);

      expect(store.getSnapshot().categories.find((c) => c.id === target.id)?.isArchived).toBe(true);
    });

    it('rearranges categories into the order it was handed', () => {
      const store = createStore([]);
      const [first, second] = store.getSnapshot().categories;

      store.reorderCategories([second!.id, first!.id]);
      const categories = store.getSnapshot().categories;

      expect(categories[0]?.id).toBe(second!.id);
      expect(categories[1]?.id).toBe(first!.id);
    });

    it('keeps unnamed categories after the ones it was given', () => {
      const store = createStore([]);
      const all = store.getSnapshot().categories;
      const last = all[all.length - 1]!;

      store.reorderCategories([last.id]);

      expect(store.getSnapshot().categories).toHaveLength(all.length);
      expect(store.getSnapshot().categories[0]?.id).toBe(last.id);
    });

    it('deletes a category nothing points at', () => {
      const store = createStore([]);
      store.addCategory({ name: 'Spare', icon: 'personal', color: '#F2B21E' });
      const spare = store.getSnapshot().categories.at(-1)!;

      store.deleteCategory(spare.id);

      expect(store.getSnapshot().categories.some((c) => c.id === spare.id)).toBe(false);
    });

    it('refuses to delete a category a session still belongs to', () => {
      const store = createStore([FINISHED_SESSION]);
      const inUse = FINISHED_SESSION.categoryId;

      store.deleteCategory(inUse);

      expect(store.getSnapshot().categories.some((c) => c.id === inUse)).toBe(true);
      expect(store.getSnapshot().sessions).toHaveLength(1);
    });

    it('refuses to delete a category a task still belongs to', () => {
      const store = createStore([]);
      const target = store.getSnapshot().categories[0]!;
      store.addTask({
        title: 'Ship it',
        categoryId: target.id,
        estimateSeconds: null,
        at: CONTRACT_NOW,
      });

      store.deleteCategory(target.id);

      expect(store.getSnapshot().categories.some((c) => c.id === target.id)).toBe(true);
    });

    it('leaves finished sessions alone when there is nothing active', () => {
      const store = createStore([FINISHED_SESSION]);
      const before = store.getSnapshot();

      store.pauseActiveSession(CONTRACT_NOW);
      store.resumeActiveSession(CONTRACT_NOW);

      expect(store.getSnapshot()).toBe(before);
    });
  });
}
