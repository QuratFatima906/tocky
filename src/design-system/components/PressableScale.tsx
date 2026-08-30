import { forwardRef, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type View,
  type ViewStyle,
} from 'react-native';
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
  // Reduce Motion asks for the movement to go, not the feedback. Collapsing the
  // duration alone would keep the scale and merely snap it, which is the jump
  // the setting exists to avoid; the opacity change carries the press instead.
  const pressedScale = theme.motion.reduced ? 1 : PRESSED_SCALE;
  // The animated style is applied last and would otherwise overwrite whatever
  // opacity the caller set -- which is how every disabled button lost its dimming.
  const callerOpacity = StyleSheet.flatten(style)?.opacity;
  const restingOpacity = typeof callerOpacity === 'number' ? callerOpacity : 1;

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: 1 - pressProgress.value * (1 - pressedScale) }],
      opacity: restingOpacity * (1 - pressProgress.value * (1 - PRESSED_OPACITY)),
    }),
    [restingOpacity, pressedScale],
  ) as AnimatedStyle<ViewStyle>;

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
