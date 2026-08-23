import { StyleSheet, type ViewStyle } from 'react-native';

import { TockyIcon, type TockyIconName } from '../art';
import { useTheme } from '../theme/ThemeProvider';
import { MINIMUM_TOUCH_TARGET, tileRadius, type ColorRole } from '../tokens';
import { PressableScale, type PressableScaleProps } from './PressableScale';

export type IconButtonProps = Omit<PressableScaleProps, 'children'> & {
  icon: TockyIconName;
  accessibilityLabel: string;
  size?: number;
  iconColor?: ColorRole;
  background?: ColorRole;
  border?: ColorRole;
};

const ICON_TO_BUTTON_RATIO = 0.42;

export function IconButton({
  icon,
  accessibilityLabel,
  size = MINIMUM_TOUCH_TARGET,
  iconColor = 'text',
  background,
  border,
  disabled,
  style,
  ...pressableProps
}: IconButtonProps) {
  const theme = useTheme();
  const touchableSize = Math.max(size, MINIMUM_TOUCH_TARGET);

  const shape: ViewStyle = {
    width: touchableSize,
    height: touchableSize,
    borderRadius: tileRadius(touchableSize),
    opacity: disabled === true ? 0.45 : 1,
    ...(background !== undefined && { backgroundColor: theme.color[background] }),
    ...(border !== undefined && { borderWidth: 2, borderColor: theme.color[border] }),
  };

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled === true }}
      disabled={disabled}
      style={[styles.button, shape, style as ViewStyle]}
      {...pressableProps}
    >
      <TockyIcon
        name={icon}
        color={theme.color[iconColor]}
        size={Math.round(touchableSize * ICON_TO_BUTTON_RATIO)}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
});
