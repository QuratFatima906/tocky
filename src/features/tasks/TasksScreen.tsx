import { useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { useSessionStore, useSessionStoreSnapshot } from '@/data';
import {
  IconButton,
  PressableScale,
  Screen,
  Skeleton,
  Text,
  TockyOwl,
  useTheme,
  useToast,
} from '@/design-system';
import {
  findActiveSession,
  isRunning,
  sessionTrackingTask,
  trackedSecondsForTask,
  type Category,
  type Session,
  type Task,
} from '@/domain';
import { useNow } from '@/hooks/useNow';

import { AddTaskForm } from './AddTaskForm';
import { TaskRow } from './TaskRow';
import { confirmSwitchToCategory } from '../categories/confirmSwitchToCategory';

const TRACKED_TICK_MS = 1000;
const SKELETON_HEIGHTS = [72, 88, 88, 88];
const OWL_SIZE = 88;
const ALL_CATEGORIES = 'all';

export function TasksScreen({ onTrackingStarted }: { onTrackingStarted: () => void }) {
  const theme = useTheme();
  const store = useSessionStore();
  const showToast = useToast();
  const { status, tasks, sessions, categories } = useSessionStoreSnapshot();
  const now = useNow(TRACKED_TICK_MS);
  const [isAdding, setIsAdding] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);

  // A filter naming a category with nothing left in it is not a filter, it is
  // a dead end: the chip row hides itself once one category is left, taking
  // the way back to All with it, and every remaining task with it. Deleting a
  // task is the first thing that can empty a category, so this is derived
  // rather than reset on delete — whatever empties one, the screen recovers.
  const activeFilter =
    categoryFilter !== ALL_CATEGORIES && tasks.some((task) => task.categoryId === categoryFilter)
      ? categoryFilter
      : ALL_CATEGORIES;

  const visibleTasks = useMemo(
    () =>
      activeFilter === ALL_CATEGORIES
        ? tasks
        : tasks.filter((task) => task.categoryId === activeFilter),
    [tasks, activeFilter],
  );

  const openTasks = visibleTasks.filter((task) => task.completedAt === null);
  const completedTasks = visibleTasks.filter((task) => task.completedAt !== null);
  const usedCategories = categories.filter((category) =>
    tasks.some((task) => task.categoryId === category.id),
  );

  function startTracking(task: Task): void {
    const category = categories.find((candidate) => candidate.id === task.categoryId);
    if (category === undefined) return;

    const active = findActiveSession(sessions);
    const track = () => {
      const landed = store.startSession({
        categoryId: task.categoryId,
        label: task.title,
        at: Date.now(),
        linkedTaskId: task.id,
      });
      if (landed) onTrackingStarted();
    };

    if (active === null) {
      track();
      return;
    }

    confirmSwitchToCategory({
      from: categories.find((candidate) => candidate.id === active.categoryId),
      to: category,
      onConfirm: track,
    });
  }

  function confirmDelete(task: Task): void {
    const tracked = sessions.filter((session) => session.linkedTaskId === task.id);

    Alert.alert(`Delete "${task.title}"?`, deleteWarningFor(tracked), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (store.deleteTask(task.id)) showToast(`Deleted "${task.title}"`);
        },
      },
    ]);
  }

  function toggleCompleted(task: Task, at: number): void {
    if (task.completedAt !== null) {
      store.setTaskCompleted(task.id, null);
      return;
    }

    const trackingThis = sessionTrackingTask(task, sessions);

    if (trackingThis === null) {
      store.setTaskCompleted(task.id, at);
      return;
    }

    Alert.alert('End the session too?', `Tocky is still tracking "${task.title}".`, [
      {
        text: 'Keep tracking',
        onPress: () => store.setTaskCompleted(task.id, at),
      },
      {
        text: 'End it',
        onPress: () => {
          // Both or neither: a task marked done while its session keeps
          // running is worse than a task that stayed open.
          if (store.endActiveSession(at)) store.setTaskCompleted(task.id, at);
        },
      },
    ]);
  }

  if (status === 'loading') {
    return (
      <Screen gap="xl" testID="tasks-screen">
        <Text variant="title" accessibilityRole="header">
          Tasks
        </Text>
        <Skeleton
          heights={SKELETON_HEIGHTS}
          accessibilityLabel="Loading your tasks"
          testID="tasks-skeleton"
        />
      </Screen>
    );
  }

  return (
    <Screen gap="lg" testID="tasks-screen">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text variant="title" accessibilityRole="header">
            Tasks
          </Text>
          <Text variant="caption" color="textSecondary">
            {completedTasks.length} of {visibleTasks.length} done
          </Text>
        </View>

        <IconButton
          icon={isAdding ? 'close' : 'add'}
          accessibilityLabel={isAdding ? 'Stop adding a task' : 'Add a task'}
          background="surface"
          onPress={() => setIsAdding(!isAdding)}
        />
      </View>

      {usedCategories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          // A horizontal list inside a column would otherwise stretch to fill it.
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: theme.spacing.xs }}
        >
          <FilterChip
            name="All"
            isSelected={activeFilter === ALL_CATEGORIES}
            onPress={() => setCategoryFilter(ALL_CATEGORIES)}
          />
          {usedCategories.map((category) => (
            <FilterChip
              key={category.id}
              name={category.name}
              isSelected={activeFilter === category.id}
              onPress={() => setCategoryFilter(category.id)}
            />
          ))}
        </ScrollView>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isAdding && (
          <AddTaskForm
            categories={categories}
            onCancel={() => setIsAdding(false)}
            onAdd={(input) => {
              store.addTask({ ...input, at: Date.now() });
              setIsAdding(false);
            }}
          />
        )}

        {openTasks.map((task) => (
          <TaskRowForTask
            key={task.id}
            task={task}
            categories={categories}
            sessions={sessions}
            now={now}
            onToggleCompleted={() => toggleCompleted(task, Date.now())}
            onStartTracking={() => startTracking(task)}
            onDelete={() => confirmDelete(task)}
          />
        ))}

        {completedTasks.length > 0 && (
          <Text
            variant="overline"
            color="textTertiary"
            accessibilityRole="header"
            style={{ marginTop: theme.spacing.md }}
          >
            Completed
          </Text>
        )}

        {completedTasks.map((task) => (
          <TaskRowForTask
            key={task.id}
            task={task}
            categories={categories}
            sessions={sessions}
            now={now}
            onToggleCompleted={() => toggleCompleted(task, Date.now())}
            onStartTracking={() => startTracking(task)}
            onDelete={() => confirmDelete(task)}
          />
        ))}

        {visibleTasks.length === 0 && !isAdding && (
          <View
            style={{ alignItems: 'center', gap: theme.spacing.lg, paddingTop: theme.spacing.xl }}
          >
            <TockyOwl expression="curious" size={OWL_SIZE} />
            <Text variant="bodyMedium" color="textSecondary" align="center">
              {tasks.length === 0
                ? 'No tasks yet. Add one and Tocky can track against it.'
                : 'Nothing in this category.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function TaskRowForTask({
  task,
  categories,
  sessions,
  now,
  onToggleCompleted,
  onStartTracking,
  onDelete,
}: {
  task: Task;
  categories: readonly Category[];
  sessions: readonly Session[];
  now: number;
  onToggleCompleted: () => void;
  onStartTracking: () => void;
  onDelete: () => void;
}) {
  return (
    <TaskRow
      task={task}
      category={categories.find((candidate) => candidate.id === task.categoryId)}
      trackedSeconds={trackedSecondsForTask(task, sessions, now)}
      isTracking={sessionTrackingTask(task, sessions) !== null}
      onToggleCompleted={onToggleCompleted}
      onStartTracking={onStartTracking}
      onDelete={onDelete}
    />
  );
}

function FilterChip({
  name,
  isSelected,
  onPress,
}: {
  name: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`Show ${name}`}
      onPress={onPress}
      style={{
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.pill,
        backgroundColor: isSelected ? theme.color.accent : theme.color.surface,
        ...theme.elevation.hairline,
      }}
    >
      <Text variant="labelSmall" color={isSelected ? 'textOnAccent' : 'textSecondary'}>
        {name}
      </Text>
    </PressableScale>
  );
}

/**
 * Says out loud what survives. Time tracked against a task was really spent,
 * so it stays in History with the label it holds — only the link to the task
 * goes. A session still running is worth naming separately, because it carries
 * on running and the row that showed it is about to disappear.
 */
function deleteWarningFor(tracked: readonly Session[]): string {
  if (tracked.length === 0) return 'Nothing has been tracked against it yet.';

  const stillRunning = tracked.some((session) => isRunning(session));
  const count = tracked.length === 1 ? '1 session' : `${tracked.length} sessions`;
  const kept = `${count} tracked against it will be kept in your history.`;

  return stillRunning ? `${kept} The one running now carries on.` : kept;
}
