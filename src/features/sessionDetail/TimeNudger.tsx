import { View } from 'react-native';

import { Button, Text, useTheme } from '@/design-system';
import { formatClockTime } from '@/domain';

const NUDGE_MINUTES = [-15, -5, 5, 15] as const;
const MINUTE = 60_000;

export function TimeNudger({
  name,
  at,
  onChange,
}: {
  name: string;
  at: number;
  onChange: (at: number) => void;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="labelSmall" color="textSecondary">
          {name}
        </Text>
        <Text variant="numericSmall" accessibilityLabel={`${name} at ${formatClockTime(at)}`}>
          {formatClockTime(at)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {NUDGE_MINUTES.map((minutes) => (
          <Button
            key={minutes}
            variant="secondary"
            size="small"
            style={{ flex: 1 }}
            label={minutes > 0 ? `+${minutes}m` : `${minutes}m`}
            accessibilityLabel={`${name} ${minutes > 0 ? 'later' : 'earlier'} by ${Math.abs(minutes)} minutes`}
            onPress={() => onChange(at + minutes * MINUTE)}
          />
        ))}
      </View>
    </View>
  );
}
