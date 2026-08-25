import { useState } from 'react';
import { View } from 'react-native';

import { Button, Surface, Text, TextField, useTheme } from '@/design-system';
import { formatDuration, type Category } from '@/domain';

import { CategoryPicker } from '../categories/CategoryPicker';

const TITLE_MAX_LENGTH = 80;
const MINUTE = 60;

export const ESTIMATE_CHOICES: readonly (number | null)[] = [
  null,
  15 * MINUTE,
  30 * MINUTE,
  60 * MINUTE,
  120 * MINUTE,
];

export function AddTaskForm({
  categories,
  onCancel,
  onAdd,
}: {
  categories: readonly Category[];
  onCancel: () => void;
  onAdd: (input: { title: string; categoryId: string; estimateSeconds: number | null }) => void;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [estimateSeconds, setEstimateSeconds] = useState<number | null>(null);

  const canAdd = title.trim() !== '' && categoryId !== null;

  return (
    <Surface radius="card" elevation="card" padding="lg" gap="lg" testID="add-task-form">
      <TextField
        value={title}
        onChangeText={setTitle}
        accessibilityLabel="What needs doing?"
        placeholder="What needs doing?"
        maxLength={TITLE_MAX_LENGTH}
        autoFocus
      />

      <CategoryPicker
        categories={categories}
        selectedCategoryId={categoryId}
        onSelectCategory={setCategoryId}
      />

      <Text variant="overline" color="textTertiary" accessibilityRole="header">
        How long, roughly?
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {ESTIMATE_CHOICES.map((choice) => (
          <Button
            key={choice ?? 'none'}
            size="small"
            variant={choice === estimateSeconds ? 'primary' : 'secondary'}
            label={choice === null ? 'No estimate' : formatDuration(choice)}
            onPress={() => setEstimateSeconds(choice)}
          />
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <Button label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={onCancel} />
        <Button
          label="Add task"
          style={{ flex: 1 }}
          disabled={!canAdd}
          onPress={() => canAdd && onAdd({ title: title.trim(), categoryId, estimateSeconds })}
        />
      </View>
    </Surface>
  );
}
