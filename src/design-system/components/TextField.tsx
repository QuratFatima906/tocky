import { TextInput } from 'react-native';

import { TockyIcon, type TockyIconName } from '../art';
import { useTheme } from '../theme/ThemeProvider';
import { useTextStyle } from '../theme/useTextStyle';
import type { TextVariant } from '../tokens';
import { Surface } from './Surface';

const TRAILING_ICON_SIZE = 18;

export type TextFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  accessibilityLabel: string;
  placeholder?: string;
  maxLength?: number;
  icon?: TockyIconName;
  variant?: TextVariant;
  autoFocus?: boolean;
  testID?: string;
};

export function TextField({
  value,
  onChangeText,
  accessibilityLabel,
  placeholder = '',
  maxLength = 120,
  icon = 'edit',
  variant = 'bodyMedium',
  autoFocus = false,
  testID,
}: TextFieldProps) {
  const theme = useTheme();
  const { style } = useTextStyle(variant);

  return (
    <Surface
      radius="lg"
      padding="lg"
      elevation="card"
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={accessibilityLabel}
        placeholder={placeholder}
        placeholderTextColor={theme.color.textTertiary}
        maxLength={maxLength}
        autoFocus={autoFocus}
        returnKeyType="done"
        testID={testID}
        style={[style, { flex: 1, padding: 0 }]}
      />
      <TockyIcon name={icon} color={theme.color.textTertiary} size={TRAILING_ICON_SIZE} />
    </Surface>
  );
}
