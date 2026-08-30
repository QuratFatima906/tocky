import { View } from 'react-native';

import {
  CategoryTile,
  PressableScale,
  Text,
  TockyIcon,
  useTheme,
  type TockyIconName,
} from '@/design-system';

const ROW_TILE_SIZE = 34;
const CHEVRON_SIZE = 14;

export type SettingsRowProps = {
  icon: TockyIconName;
  hue: string;
  label: string;
  value?: string;
  onPress?: () => void;
  /** Rows for work that cannot ship yet say so, rather than leading nowhere. */
  isAwaited?: boolean;
  isLast?: boolean;
};

export function SettingsRow({
  icon,
  hue,
  label,
  value,
  onPress,
  isAwaited = false,
  isLast = false,
}: SettingsRowProps) {
  const theme = useTheme();

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
        ...(isLast ? {} : { borderBottomWidth: 1, borderBottomColor: theme.color.border }),
      }}
    >
      <CategoryTile icon={icon} color={hue} size={ROW_TILE_SIZE} />
      <Text variant="label" style={{ flex: 1 }} color={isAwaited ? 'textTertiary' : 'text'}>
        {label}
      </Text>

      {value !== undefined && (
        <Text variant="bodySmall" color="textSecondary">
          {value}
        </Text>
      )}

      {isAwaited ? (
        <Text variant="captionSmall" color="textTertiary">
          Soon
        </Text>
      ) : (
        <TockyIcon name="forward" color={theme.color.textTertiary} size={CHEVRON_SIZE} />
      )}
    </View>
  );

  if (onPress === undefined) {
    return (
      <View accessible accessibilityState={{ disabled: isAwaited }}>
        {body}
      </View>
    );
  }

  return (
    <PressableScale
      accessibilityRole="button"
      // The value is the whole point of most of these rows -- how many
      // categories, how many sessions -- and reading only the label drops it.
      accessibilityLabel={value === undefined ? label : `${label}, ${value}`}
      onPress={onPress}
    >
      {body}
    </PressableScale>
  );
}
