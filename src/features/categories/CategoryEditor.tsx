import { useState } from 'react';
import { View } from 'react-native';

import type { CategoryDraft } from '@/data';
import {
  Button,
  CATEGORY_PRESETS,
  CategoryTile,
  PressableScale,
  Text,
  TextField,
  useTheme,
} from '@/design-system';
import type { Category } from '@/domain';

const CATEGORY_NAME_MAX_LENGTH = 24;
const SWATCH_SIZE = 44;

export function CategoryEditor({
  existing,
  onCancel,
  onSave,
}: {
  existing?: Category;
  onCancel: () => void;
  onSave: (draft: CategoryDraft) => void;
}) {
  const theme = useTheme();
  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? CATEGORY_PRESETS[0]!.icon);
  const [color, setColor] = useState(existing?.color ?? CATEGORY_PRESETS[0]!.hue);

  const canSave = name.trim() !== '';

  return (
    <View style={{ gap: theme.spacing.lg }} testID="category-editor">
      <TextField
        value={name}
        onChangeText={setName}
        accessibilityLabel="Category name"
        placeholder="Category name"
        maxLength={CATEGORY_NAME_MAX_LENGTH}
        autoFocus
      />

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="captionSmall" color="textSecondary">
          Icon
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {CATEGORY_PRESETS.map((preset) => (
            <PressableScale
              key={preset.icon}
              accessibilityRole="radio"
              accessibilityLabel={preset.name}
              accessibilityState={{ selected: icon === preset.icon }}
              onPress={() => setIcon(preset.icon)}
              style={{ opacity: icon === preset.icon ? 1 : 0.4 }}
            >
              <CategoryTile icon={preset.icon} color={color} size={SWATCH_SIZE} />
            </PressableScale>
          ))}
        </View>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="captionSmall" color="textSecondary">
          Colour
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {CATEGORY_PRESETS.map((preset) => (
            <PressableScale
              key={preset.hue}
              accessibilityRole="radio"
              accessibilityLabel={`${preset.name} colour`}
              accessibilityState={{ selected: color === preset.hue }}
              onPress={() => setColor(preset.hue)}
              style={{ opacity: color === preset.hue ? 1 : 0.4 }}
            >
              <CategoryTile icon={icon} color={preset.hue} size={SWATCH_SIZE} />
            </PressableScale>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <Button
          label="Cancel"
          variant="secondary"
          size="small"
          onPress={onCancel}
          style={{ flex: 1 }}
        />
        <Button
          label={existing === undefined ? 'Add category' : 'Save'}
          size="small"
          disabled={!canSave}
          onPress={() => onSave({ name, icon, color })}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
