import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { useTextStyle } from '../theme/useTextStyle';
import type { ColorRole, TextVariant } from '../tokens';

export type TextProps = Omit<RNTextProps, 'style'> & {
  variant?: TextVariant;
  color?: ColorRole;
  align?: 'left' | 'center' | 'right';
  style?: RNTextProps['style'];
};

export function Text({ variant = 'body', color = 'text', align, style, ...textProps }: TextProps) {
  const theme = useTheme();
  const { style: variantStyle, ...dynamicTypeProps } = useTextStyle(variant, theme.color[color]);

  return (
    <RNText
      {...dynamicTypeProps}
      {...textProps}
      style={[variantStyle, align !== undefined && { textAlign: align }, style]}
    />
  );
}
