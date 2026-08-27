import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useSessionStore, useSessionStoreSnapshot } from '@/data';
import { Button, IconButton, Screen, Text, TextField, useTheme } from '@/design-system';
import { findActiveSession, type Category } from '@/domain';

import { CategoryPicker } from '../categories/CategoryPicker';
import { confirmSwitchToCategory } from '../categories/confirmSwitchToCategory';

const SESSION_LABEL_MAX_LENGTH = 80;

const noop = () => {};

export function NewSessionScreen({
  onDismiss,
  onStarted,
}: {
  onDismiss: () => void;
  onStarted: () => void;
}) {
  const theme = useTheme();
  const store = useSessionStore();
  const { categories, sessions } = useSessionStoreSnapshot();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [label, setLabel] = useState('');

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const activeSession = findActiveSession(sessions);
  const runningCategory = categories.find((category) => category.id === activeSession?.categoryId);

  function startSession(category: Category): void {
    const landed = store.startSession({
      categoryId: category.id,
      label: label.trim() === '' ? null : label.trim(),
      at: Date.now(),
    });

    // Opening the timer over a session that was never recorded would show a
    // clock counting time nothing is keeping.
    if (landed) onStarted();
  }

  function confirmSwitchThenStart(category: Category): void {
    confirmSwitchToCategory({
      from: runningCategory,
      to: category,
      onConfirm: () => startSession(category),
    });
  }

  const start =
    selectedCategory === undefined
      ? noop
      : () => {
          if (activeSession === null) startSession(selectedCategory);
          else confirmSwitchThenStart(selectedCategory);
        };

  return (
    <Screen gap="lg" testID="new-session-screen">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Text variant="title" accessibilityRole="header">
            Start tracking
          </Text>
          <Text variant="bodySmall" color="textSecondary">
            Pick a category and Tocky starts the clock.
          </Text>
        </View>

        <IconButton
          icon="close"
          accessibilityLabel="Close"
          background="surface"
          onPress={onDismiss}
        />
      </View>

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
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        <Text variant="overline" color="textTertiary" accessibilityRole="header">
          What are you working on?
        </Text>
        <TextField
          value={label}
          onChangeText={setLabel}
          accessibilityLabel="What are you working on?"
          placeholder="Optional"
          maxLength={SESSION_LABEL_MAX_LENGTH}
        />
      </ScrollView>

      <Button
        size="large"
        icon="start"
        fullWidth
        disabled={selectedCategory === undefined}
        label={
          selectedCategory === undefined
            ? 'Pick a category to start'
            : `Start ${selectedCategory.name} session`
        }
        onPress={start}
      />
    </Screen>
  );
}
