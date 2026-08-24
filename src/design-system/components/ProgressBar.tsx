import { View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../tokens';

export type ProgressBarProps = {
  progress: number;
  color: string;
  height: number;
  accessibilityLabel?: string;
};

export function ProgressBar({ progress, color, height, accessibilityLabel }: ProgressBarProps) {
  const theme = useTheme();
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View
      accessibilityRole="progressbar"
      {...(accessibilityLabel !== undefined && { accessibilityLabel })}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedProgress * 100) }}
      style={{
        height,
        borderRadius: radius.pill,
        backgroundColor: theme.color.track,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${clampedProgress * 100}%`,
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
