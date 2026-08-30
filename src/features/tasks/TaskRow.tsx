import { View } from 'react-native';

import {
  IconButton,
  MINIMUM_TOUCH_TARGET,
  PressableScale,
  Surface,
  Text,
  TockyIcon,
  useTheme,
} from '@/design-system';
import { formatDuration, type Category, type Task } from '@/domain';

const CHECKBOX_SIZE = 26;
// The circle is what the design draws; the target is what a thumb has to hit.
const CHECKBOX_SLOP = (MINIMUM_TOUCH_TARGET - CHECKBOX_SIZE) / 2;
const TRACKING_DOT_SIZE = 6;
const CATEGORY_PILL_MAX_WIDTH = '32%';

export function TaskRow({
  task,
  category,
  trackedSeconds,
  isTracking,
  onToggleCompleted,
  onStartTracking,
  onDelete,
}: {
  task: Task;
  category: Category | undefined;
  trackedSeconds: number;
  isTracking: boolean;
  onToggleCompleted: () => void;
  onStartTracking: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const isCompleted = task.completedAt !== null;

  return (
    <Surface
      radius="xl"
      elevation="card"
      padding="lg"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        ...(isTracking && { borderWidth: 2, borderColor: theme.color.accent }),
      }}
    >
      <PressableScale
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isCompleted }}
        accessibilityLabel={task.title}
        onPress={onToggleCompleted}
        hitSlop={CHECKBOX_SLOP}
        style={{ width: CHECKBOX_SIZE, height: CHECKBOX_SIZE }}
      >
        {isCompleted ? (
          <TockyIcon name="check" color={theme.color.accent} size={CHECKBOX_SIZE} />
        ) : (
          <View
            style={{
              width: CHECKBOX_SIZE,
              height: CHECKBOX_SIZE,
              borderRadius: CHECKBOX_SIZE / 2,
              borderWidth: 2,
              borderColor: theme.color.borderInteractive,
            }}
          />
        )}
      </PressableScale>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={describeTask(task, trackedSeconds, isTracking)}
        disabled={isCompleted}
        onPress={onStartTracking}
        style={{ flex: 1, gap: theme.spacing.xs }}
      >
        <Text
          variant="bodyMedium"
          color={isCompleted ? 'textTertiary' : 'text'}
          numberOfLines={1}
          style={isCompleted ? { textDecorationLine: 'line-through' } : undefined}
        >
          {task.title}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          {isTracking && (
            <View
              style={{
                width: TRACKING_DOT_SIZE,
                height: TRACKING_DOT_SIZE,
                borderRadius: TRACKING_DOT_SIZE / 2,
                backgroundColor: theme.color.accent,
              }}
            />
          )}
          <Text variant="caption" color={isTracking ? 'accent' : 'textTertiary'}>
            {subtitleFor(task, trackedSeconds, isTracking)}
          </Text>
        </View>
      </PressableScale>

      {category !== undefined && (
        <Surface
          radius="pill"
          background="surfaceMuted"
          style={{
            paddingVertical: theme.spacing.xs,
            paddingHorizontal: theme.spacing.md,
            // The title has flex: 1, so it grows into what is left over — and
            // an unbounded pill claims its full content width first, which
            // crushed "Draft the quarterly..." down to "Draft t...". The
            // category is the least important thing on the row, so it is the
            // one that gets a ceiling and truncates.
            maxWidth: CATEGORY_PILL_MAX_WIDTH,
          }}
        >
          <Text variant="captionSmall" color="textSecondary" numberOfLines={1}>
            {category.name}
          </Text>
        </Surface>
      )}

      <IconButton
        icon="delete"
        accessibilityLabel={`Delete ${task.title}`}
        iconColor="errorText"
        onPress={onDelete}
      />
    </Surface>
  );
}

function subtitleFor(task: Task, trackedSeconds: number, isTracking: boolean): string {
  if (isTracking) return `Tracking now · ${formatDuration(trackedSeconds)}`;
  if (trackedSeconds > 0) return `Tracked ${formatDuration(trackedSeconds)}`;
  if (task.completedAt !== null) return 'No time tracked';
  if (task.estimateSeconds !== null) return `Est. ${formatDuration(task.estimateSeconds)}`;

  return 'Not tracked yet';
}

function describeTask(task: Task, trackedSeconds: number, isTracking: boolean): string {
  const state = task.completedAt === null ? 'Start tracking' : 'Completed';

  return `${task.title}, ${subtitleFor(task, trackedSeconds, isTracking)}. ${state}.`;
}
