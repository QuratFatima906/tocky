import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import type { SessionEdit } from '@/data';
import { Button, Surface, Text, TextField, useTheme } from '@/design-system';
import {
  findSessionTimeProblem,
  type Category,
  type Session,
  type SessionTimeProblem,
} from '@/domain';

import { TimeNudger } from './TimeNudger';
import { CategoryPicker } from '../categories/CategoryPicker';

const LABEL_MAX_LENGTH = 80;
const NOTE_MAX_LENGTH = 240;

const PROBLEM_MESSAGES: Record<SessionTimeProblem, string> = {
  endsBeforeItStarts: 'A session has to end after it starts.',
  startsInTheFuture: 'A session cannot start in the future.',
  overlapsAnother: 'That overlaps another session, so the same minutes would count twice.',
};

export function EditSessionForm({
  session,
  categories,
  sessions,
  now,
  onCancel,
  onSave,
}: {
  session: Session;
  categories: readonly Category[];
  sessions: readonly Session[];
  now: number;
  onCancel: () => void;
  onSave: (edit: SessionEdit) => void;
}) {
  const theme = useTheme();
  const [categoryId, setCategoryId] = useState(session.categoryId);
  const [label, setLabel] = useState(session.label ?? '');
  const [note, setNote] = useState(session.note ?? '');
  const [startedAt, setStartedAt] = useState(session.startedAt);
  const [endedAt, setEndedAt] = useState(session.endedAt);

  const problem = findSessionTimeProblem({ id: session.id, startedAt, endedAt }, sessions, now);

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.lg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="overline" color="textTertiary" accessibilityRole="header">
          Category
        </Text>
        <CategoryPicker
          categories={categories}
          selectedCategoryId={categoryId}
          onSelectCategory={setCategoryId}
        />

        <Text variant="overline" color="textTertiary" accessibilityRole="header">
          What were you working on?
        </Text>
        <TextField
          value={label}
          onChangeText={setLabel}
          accessibilityLabel="What were you working on?"
          placeholder="Optional"
          maxLength={LABEL_MAX_LENGTH}
        />

        <Text variant="overline" color="textTertiary" accessibilityRole="header">
          When
        </Text>
        <Surface radius="lg" padding="lg" elevation="card" gap="lg">
          <TimeNudger name="Started" at={startedAt} onChange={setStartedAt} />
          {endedAt !== null && <TimeNudger name="Ended" at={endedAt} onChange={setEndedAt} />}
        </Surface>

        {problem !== null && (
          <Text variant="labelSmall" color="errorText" accessibilityRole="alert">
            {PROBLEM_MESSAGES[problem]}
          </Text>
        )}

        <Text variant="overline" color="textTertiary" accessibilityRole="header">
          Note
        </Text>
        <TextField
          value={note}
          onChangeText={setNote}
          accessibilityLabel="Session note"
          placeholder="Anything worth remembering?"
          maxLength={NOTE_MAX_LENGTH}
        />
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <Button label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={onCancel} />
        <Button
          label="Save changes"
          style={{ flex: 1 }}
          disabled={problem !== null}
          onPress={() =>
            onSave({
              categoryId,
              label: label.trim() === '' ? null : label.trim(),
              note: note.trim() === '' ? null : note.trim(),
              startedAt,
              endedAt,
            })
          }
        />
      </View>
    </>
  );
}
