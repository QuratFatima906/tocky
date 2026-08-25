import { View } from 'react-native';

import { PressableScale, Text, TockyIcon, useTheme } from '@/design-system';
import type { TockyIconName } from '@/design-system';

const PRIMARY_SIZE = 112;
const PRIMARY_ICON_SIZE = 44;
const SECONDARY_SIZE = 72;
const SECONDARY_ICON_SIZE = 26;

export function TimerControls({
  isPaused,
  onEnd,
  onTogglePause,
  onSwitch,
}: {
  isPaused: boolean;
  onEnd: () => void;
  onTogglePause: () => void;
  onSwitch: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: theme.spacing['2xl'],
      }}
    >
      <SecondaryControl
        icon="stop"
        label="End"
        tint={theme.color.errorText}
        borderColor={theme.color.errorBorder}
        onPress={onEnd}
      />

      <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={isPaused ? 'Resume tracking' : 'Pause tracking'}
          onPress={onTogglePause}
          style={{
            width: PRIMARY_SIZE,
            height: PRIMARY_SIZE,
            borderRadius: theme.radius.sheet,
            backgroundColor: theme.color.accent,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.elevation.glow,
          }}
        >
          <TockyIcon
            name={isPaused ? 'start' : 'pause'}
            color={theme.color.textOnAccent}
            size={PRIMARY_ICON_SIZE}
          />
        </PressableScale>
        <Text variant="label">{isPaused ? 'Resume' : 'Pause'}</Text>
      </View>

      <SecondaryControl
        icon="switch"
        label="Switch"
        tint={theme.color.text}
        borderColor={theme.color.border}
        onPress={onSwitch}
      />
    </View>
  );
}

function SecondaryControl({
  icon,
  label,
  tint,
  borderColor,
  onPress,
}: {
  icon: TockyIconName;
  label: string;
  tint: string;
  borderColor: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={{
          width: SECONDARY_SIZE,
          height: SECONDARY_SIZE,
          borderRadius: theme.radius.card,
          backgroundColor: theme.color.surface,
          borderWidth: 2,
          borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.elevation.card,
        }}
      >
        <TockyIcon name={icon} color={tint} size={SECONDARY_ICON_SIZE} />
      </PressableScale>
      <Text variant="labelSmall" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}
