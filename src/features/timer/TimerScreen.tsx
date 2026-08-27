import { useState } from 'react';
import { Alert, View } from 'react-native';

import { useSessionStore, useSessionStoreSnapshot } from '@/data';
import {
  Button,
  CategoryTile,
  IconButton,
  PressableScale,
  Screen,
  Surface,
  Text,
  TextField,
  TockyIcon,
  useTheme,
  useToast,
} from '@/design-system';
import {
  findActiveSession,
  formatDuration,
  isPaused as isSessionPaused,
  sessionSeconds,
  type Category,
  type Session,
} from '@/domain';
import { useNow } from '@/hooks/useNow';

import { TimerControls } from './TimerControls';
import { TimerRing } from './TimerRing';

const ELAPSED_TICK_MS = 1000;
const KEEP_OR_DISCARD_BELOW_SECONDS = 60;
const NOTE_MAX_LENGTH = 240;
const PILL_ICON_SIZE = 16;
const PILL_TILE_SIZE = 30;

export function TimerScreen({
  onCollapse,
  onSwitchCategory,
  onEnded,
}: {
  onCollapse: () => void;
  onSwitchCategory: () => void;
  onEnded: () => void;
}) {
  const { sessions } = useSessionStoreSnapshot();
  const activeSession = findActiveSession(sessions);

  if (activeSession === null) return <NothingTracked onCollapse={onCollapse} />;

  return (
    <RunningTimer
      session={activeSession}
      onCollapse={onCollapse}
      onSwitchCategory={onSwitchCategory}
      onEnded={onEnded}
    />
  );
}

function RunningTimer({
  session,
  onCollapse,
  onSwitchCategory,
  onEnded,
}: {
  session: Session;
  onCollapse: () => void;
  onSwitchCategory: () => void;
  onEnded: () => void;
}) {
  const theme = useTheme();
  const store = useSessionStore();
  const showToast = useToast();
  const { categories } = useSessionStoreSnapshot();
  const [isEditingNote, setIsEditingNote] = useState(false);

  const isPaused = isSessionPaused(session);
  const now = useNow(isPaused ? null : ELAPSED_TICK_MS);
  const elapsedSeconds = sessionSeconds(session, now);
  const category = categories.find((candidate) => candidate.id === session.categoryId);

  function endSession(at: number): void {
    // A write that did not land has already said so. Saying "saved" over the
    // top of it, and leaving for Home, would be the app lying about the one
    // thing it exists to record.
    if (!store.endActiveSession(at)) return;

    showToast(`Session saved · ${formatDuration(sessionSeconds(session, at))}`);
    onEnded();
  }

  function discardSession(): void {
    if (!store.deleteSession(session.id)) return;

    showToast('Session discarded');
    onEnded();
  }

  function end(): void {
    const at = Date.now();

    if (sessionSeconds(session, at) >= KEEP_OR_DISCARD_BELOW_SECONDS) {
      endSession(at);
      return;
    }

    Alert.alert(
      'Keep this session?',
      'It is under a minute. Tocky will save it unless you would rather it did not.',
      [
        { text: 'Discard', style: 'destructive', onPress: discardSession },
        { text: 'Keep it', onPress: () => endSession(at) },
      ],
    );
  }

  function confirmDiscard(): void {
    Alert.alert('Discard this session?', 'The time tracked so far will not be saved.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: discardSession },
    ]);
  }

  return (
    <Screen gap="lg" testID="timer-screen">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton
          icon="collapse"
          accessibilityLabel="Collapse the timer"
          background="surface"
          onPress={onCollapse}
        />
        <Text variant="screenTitle" accessibilityRole="header">
          {isPaused ? 'Paused session' : 'Tracking session'}
        </Text>
        <IconButton
          icon="more"
          accessibilityLabel="More options"
          background="surface"
          onPress={confirmDiscard}
        />
      </View>

      <SessionCategoryPill category={category} label={session.label} />

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <TimerRing
          elapsedSeconds={elapsedSeconds}
          isPaused={isPaused}
          categoryColor={category?.color ?? theme.color.accent}
        />
      </View>

      <View style={{ gap: theme.spacing.lg }}>
        <TimerControls
          isPaused={isPaused}
          onEnd={end}
          onSwitch={onSwitchCategory}
          onTogglePause={() =>
            isPaused ? store.resumeActiveSession(Date.now()) : store.pauseActiveSession(Date.now())
          }
        />

        {isEditingNote ? (
          <TextField
            value={session.note ?? ''}
            onChangeText={(note) => store.noteActiveSession(note === '' ? null : note)}
            accessibilityLabel="Session note"
            placeholder="Anything worth remembering?"
            maxLength={NOTE_MAX_LENGTH}
            autoFocus
          />
        ) : (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={session.note === null ? 'Add a note' : `Note: ${session.note}`}
            onPress={() => setIsEditingNote(true)}
            style={{
              alignSelf: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.sm,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.xl,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.color.surface,
              ...theme.elevation.hairline,
            }}
          >
            <TockyIcon name="edit" color={theme.color.accent} size={PILL_ICON_SIZE} />
            <Text variant="labelSmall" color="textSecondary" numberOfLines={1}>
              {session.note ?? 'Add a note'}
            </Text>
          </PressableScale>
        )}
      </View>
    </Screen>
  );
}

function SessionCategoryPill({
  category,
  label,
}: {
  category: Category | undefined;
  label: string | null;
}) {
  const theme = useTheme();

  return (
    <Surface
      radius="pill"
      elevation="card"
      style={{
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        paddingLeft: theme.spacing.xs,
        paddingRight: theme.spacing.lg,
      }}
    >
      <CategoryTile
        icon={category?.icon}
        color={category?.color ?? theme.color.accent}
        size={PILL_TILE_SIZE}
      />
      <Text variant="labelSmall">{category?.name ?? 'Uncategorised'}</Text>
      {label !== null && (
        <>
          <Text variant="labelSmall" color="textTertiary">
            ·
          </Text>
          <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Surface>
  );
}

function NothingTracked({ onCollapse }: { onCollapse: () => void }) {
  return (
    <Screen gap="xl" testID="timer-screen">
      <Text variant="title" accessibilityRole="header">
        Nothing is being tracked
      </Text>
      <Text variant="bodyMedium" color="textSecondary">
        Start a session and the clock shows up here.
      </Text>
      <Button label="Back to Home" variant="secondary" size="small" onPress={onCollapse} />
    </Screen>
  );
}
