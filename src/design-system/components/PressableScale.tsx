import { forwardRef, type ReactNode } from 'react';
import { Pressable, type PressableProps, type View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';

import { useTheme } from '../theme/ThemeProvider';
import { PRESSED_OPACITY, PRESSED_SCALE } from '../tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  children?: ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export const PressableScale = forwardRef<View, PressableScaleProps>(function PressableScale(
  { children, style, onPressIn, onPressOut, disabled, ...pressableProps },
  ref,
) {
  const theme = useTheme();
  const pressProgress = useSharedValue(0);
  const pressDuration = theme.motion.duration('instant');

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressProgress.value * (1 - PRESSED_SCALE) }],
    opacity: 1 - pressProgress.value * (1 - PRESSED_OPACITY),
  })) as AnimatedStyle<ViewStyle>;

  return (
    <AnimatedPressable
      ref={ref}
      {...pressableProps}
      disabled={disabled}
      onPressIn={(event) => {
        pressProgress.value = withTiming(1, { duration: pressDuration });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressProgress.value = withTiming(0, { duration: pressDuration });
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
});
