import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { useSessionStore, useSessionStoreSnapshot, type SessionEdit } from '@/data';
import {
  Button,
  CategoryTile,
  IconButton,
  Screen,
  Surface,
  Text,
  TockyOwl,
  useTheme,
  useToast,
} from '@/design-system';
import {
  findActiveSession,
  formatClockTime,
  formatDayHeading,
  formatDuration,
  formatSessionRange,
  isRunning,
  sessionSeconds,
  type Session,
} from '@/domain';
import { useNow } from '@/hooks/useNow';

import { EditSessionForm } from './EditSessionForm';
import { confirmSwitchToCategory } from '../categories/confirmSwitchToCategory';

const OWL_SIZE = 96;
const PILL_TILE_SIZE = 26;
const ELAPSED_TICK_MS = 1000;

export function SessionDetailScreen({
  sessionId,
  onBack,
  onResumed,
}: {
  sessionId: string;
  onBack: () => void;
  onResumed: () => void;
}) {
  const { sessions } = useSessionStoreSnapshot();
  const session = sessions.find((candidate) => candidate.id === sessionId);

  if (session === undefined) return <SessionGone onBack={onBack} />;

  return <SessionDetail session={session} onBack={onBack} onResumed={onResumed} />;
}

function SessionDetail({
  session,
  onBack,
  onResumed,
}: {
  session: Session;
  onBack: () => void;
  onResumed: () => void;
}) {
  const theme = useTheme();
  const store = useSessionStore();
  const showToast = useToast();
  const { sessions, categories, tasks } = useSessionStoreSnapshot();
  const [isEditing, setIsEditing] = useState(false);

  const stillRunning = isRunning(session);
  const now = useNow(stillRunning ? ELAPSED_TICK_MS : null);
  const category = categories.find((candidate) => candidate.id === session.categoryId);
  const seconds = sessionSeconds(session, now);
  const linkedTask = tasks.find((task) => task.id === session.linkedTaskId);

  function saveEdit(edit: SessionEdit): void {
    // The form stays open on a failed write, so the user still has what they
    // typed rather than losing it to a toast that claims it was saved.
    if (!store.editSession(session.id, edit)) return;

    setIsEditing(false);
    showToast('Session updated');
  }

  function confirmDelete(): void {
    Alert.alert('Delete this session?', `${formatDuration(seconds)} will be removed for good.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (!store.deleteSession(session.id)) return;

          showToast('Session deleted');
          onBack();
        },
      },
    ]);
  }

  function resume(): void {
    const active = findActiveSession(sessions);
    const startAgain = () => {
      const landed = store.startSession({
        categoryId: session.categoryId,
        label: session.label,
        at: Date.now(),
      });
      if (landed) onResumed();
    };

    if (active === null || category === undefined) {
      startAgain();
      return;
    }

    confirmSwitchToCategory({
      from: categories.find((candidate) => candidate.id === active.categoryId),
      to: category,
      onConfirm: startAgain,
    });
  }

  return (
    <Screen gap="lg" testID="session-detail-screen">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton
          icon="back"
          accessibilityLabel="Back"
          background="surface"
          onPress={isEditing ? () => setIsEditing(false) : onBack}
        />
        <Text variant="screenTitle" accessibilityRole="header">
          {isEditing ? 'Edit session' : 'Session'}
        </Text>
        {isEditing ? (
          <View style={{ width: theme.spacing['3xl'] }} />
        ) : (
          <IconButton
            icon="edit"
            accessibilityLabel="Edit this session"
            background="surface"
            onPress={() => setIsEditing(true)}
          />
        )}
      </View>

      {isEditing ? (
        <EditSessionForm
          session={session}
          categories={categories}
          sessions={sessions}
          now={now}
          onCancel={() => setIsEditing(false)}
          onSave={saveEdit}
        />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: theme.spacing.xl, paddingBottom: theme.spacing.lg }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
            <TockyOwl
              expression="happy"
              bodyColor={category?.color ?? theme.color.accent}
              size={OWL_SIZE}
            />

            <Surface
              radius="pill"
              elevation="card"
              style={{
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
                color={category?.color ?? theme.color.textTertiary}
                size={PILL_TILE_SIZE}
              />
              <Text variant="labelSmall">{category?.name ?? 'Uncategorised'}</Text>
            </Surface>

            <Text variant="heading" align="center">
              {session.label ?? category?.name ?? 'Session'}
            </Text>
            <Text variant="statHero">{formatDuration(seconds)}</Text>
            <Text variant="bodySmall" color="textSecondary">
              {formatDayHeading(session.startedAt)} ·{' '}
              {formatSessionRange(session.startedAt, session.endedAt)}
            </Text>
          </View>

          <Surface radius="xl" elevation="card" padding="lg" gap="md">
            <MetaRow name="Started" value={formatClockTime(session.startedAt)} />
            <MetaRow
              name="Ended"
              value={session.endedAt === null ? 'Still running' : formatClockTime(session.endedAt)}
            />
            <MetaRow name="Pauses" value={describePauses(session, now)} />
            {linkedTask !== undefined && <MetaRow name="Linked task" value={linkedTask.title} />}
          </Surface>

          {session.note !== null && (
            <Surface radius="xl" elevation="card" padding="lg" gap="sm">
              <Text variant="overline" color="textTertiary" accessibilityRole="header">
                Note
              </Text>
              <Text variant="bodySmall" color="textSecondary">
                {session.note}
              </Text>
            </Surface>
          )}

          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <Button
              label="Resume"
              icon="start"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={resume}
            />
            <Button
              label="Delete"
              icon="delete"
              variant="destructive"
              style={{ flex: 1 }}
              disabled={stillRunning}
              onPress={confirmDelete}
            />
          </View>

          {stillRunning && (
            <Text variant="labelSmall" color="textTertiary" align="center">
              This session is still running. End it before deleting it.
            </Text>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

function MetaRow({ name, value }: { name: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text variant="bodySmall" color="textTertiary">
        {name}
      </Text>
      <Text variant="labelSmall" accessibilityLabel={`${name}: ${value}`}>
        {value}
      </Text>
    </View>
  );
}

function describePauses(session: Session, now: number): string {
  const pauses = session.pauses;
  if (pauses.length === 0) return 'None';

  const pausedSeconds = pauses.reduce(
    (total, pause) => total + ((pause.endedAt ?? now) - pause.startedAt),
    0,
  );

  return `${pauses.length} · ${formatDuration(Math.floor(pausedSeconds / 1000))} total`;
}

function SessionGone({ onBack }: { onBack: () => void }) {
  return (
    <Screen gap="xl" testID="session-detail-screen">
      <Text variant="title" accessibilityRole="header">
        This session is gone
      </Text>
      <Text variant="bodyMedium" color="textSecondary">
        It was deleted, or it never existed.
      </Text>
      <Button label="Back to History" variant="secondary" size="small" onPress={onBack} />
    </Screen>
  );
}
