import { View } from 'react-native';

import { PressableScale, Surface, Text, TockyOwl } from '@/design-system';
import { formatDayHeading } from '@/domain';

const AVATAR_SIZE = 48;
const OWL_SIZE = 32;

export function HomeGreeting({
  greeting,
  name,
  now,
  onOpenProfile,
}: {
  greeting: string;
  name: string | undefined;
  now: number;
  onOpenProfile: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View>
        <Text variant="caption" color="textTertiary">
          {formatDayHeading(now)}
        </Text>
        <Text variant="title" accessibilityRole="header">
          {name === undefined ? greeting : `${greeting}, ${name}`}
        </Text>
      </View>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Open your profile"
        onPress={onOpenProfile}
      >
        <Surface
          radius="lg"
          elevation="card"
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TockyOwl expression="happy" size={OWL_SIZE} />
        </Surface>
      </PressableScale>
    </View>
  );
}
