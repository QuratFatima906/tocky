import { TextInput } from 'react-native';

import { Surface, TockyIcon, useTextStyle, useTheme } from '@/design-system';

const EDIT_ICON_SIZE = 18;
export const SESSION_LABEL_MAX_LENGTH = 80;

export function SessionLabelField({
  label,
  onChangeLabel,
}: {
  label: string;
  onChangeLabel: (label: string) => void;
}) {
  const theme = useTheme();
  const { style } = useTextStyle('bodyMedium');

  return (
    <Surface
      radius="lg"
      padding="lg"
      elevation="card"
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
    >
      <TextInput
        value={label}
        onChangeText={onChangeLabel}
        accessibilityLabel="What are you working on?"
        placeholder="Optional"
        placeholderTextColor={theme.color.textTertiary}
        maxLength={SESSION_LABEL_MAX_LENGTH}
        returnKeyType="done"
        style={[style, { flex: 1, padding: 0 }]}
      />
      <TockyIcon name="edit" color={theme.color.textTertiary} size={EDIT_ICON_SIZE} />
    </Surface>
  );
}
