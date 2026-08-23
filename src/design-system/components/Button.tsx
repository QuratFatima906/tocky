import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';

import { TockyIcon, type TockyIconName } from '../art';
import { useTheme } from '../theme/ThemeProvider';
import { MINIMUM_TOUCH_TARGET, type ColorRole, type TextVariant } from '../tokens';
import { PressableScale, type PressableScaleProps } from './PressableScale';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export type ButtonProps = Omit<PressableScaleProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: TockyIconName;
  loading?: boolean;
  fullWidth?: boolean;
};

const SIZES: Record<
  ButtonSize,
  { height: number; paddingHorizontal: number; text: TextVariant; icon: number }
> = {
  small: { height: MINIMUM_TOUCH_TARGET, paddingHorizontal: 16, text: 'labelSmall', icon: 16 },
  medium: { height: 52, paddingHorizontal: 24, text: 'label', icon: 20 },
  large: { height: 60, paddingHorizontal: 28, text: 'screenTitle', icon: 22 },
};

type VariantColors = { label: ColorRole; background?: ColorRole; border?: ColorRole };

const VARIANTS: Record<ButtonVariant, VariantColors> = {
  primary: { label: 'textOnAccent' },
  secondary: { label: 'text', background: 'surface', border: 'borderInteractive' },
  destructive: { label: 'errorText', background: 'surface', border: 'errorBorder' },
  ghost: { label: 'textSecondary' },
};

export function Button({
  label,
  variant = 'primary',
  size = 'medium',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...pressableProps
}: ButtonProps) {
  const theme = useTheme();
  const metrics = SIZES[size];
  const colors = VARIANTS[variant];
  const isDisabled = disabled === true || loading;
  const labelColor = theme.color[colors.label];

  const shape: ViewStyle = {
    height: metrics.height,
    paddingHorizontal: metrics.paddingHorizontal,
    borderRadius: theme.radius.xl,
    opacity: isDisabled ? 0.45 : 1,
    ...(fullWidth && { width: '100%' }),
    ...(colors.background !== undefined && { backgroundColor: theme.color[colors.background] }),
    ...(colors.border !== undefined && { borderWidth: 2, borderColor: theme.color[colors.border] }),
  };

  const content = (
    <View style={[styles.content, { gap: theme.spacing.sm }]}>
      {loading ? (
        <ActivityIndicator color={labelColor} accessibilityLabel="Loading" />
      ) : (
        <>
          {icon !== undefined && <TockyIcon name={icon} color={labelColor} size={metrics.icon} />}
          <Text variant={metrics.text} color={colors.label}>
            {label}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={[styles.button, shape, style as ViewStyle]}
      {...pressableProps}
    >
      {variant === 'primary' && (
        <LinearGradient
          colors={[...theme.gradient.accent.colors] as [string, string, ...string[]]}
          locations={[...theme.gradient.accent.locations] as [number, number, ...number[]]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: theme.radius.xl }]}
        />
      )}
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
