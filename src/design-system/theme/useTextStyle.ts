import type { TextProps, TextStyle } from 'react-native';

import type { TextVariant } from '../tokens';
import { useTheme } from './ThemeProvider';

export type TextStyleProps = {
  style: TextStyle;
  maxFontSizeMultiplier?: number;
};

export function useTextStyle(variant: TextVariant, color?: string): TextStyleProps {
  const theme = useTheme();
  const {
    fontFamily,
    fontSize,
    lineHeightRatio,
    letterSpacing,
    textTransform,
    tabular,
    maxFontSizeMultiplier,
  } = theme.text[variant];

  const style: TextStyle = {
    fontFamily,
    fontSize,
    lineHeight: fontSize * lineHeightRatio,
    color: color ?? theme.color.text,
    ...(letterSpacing !== undefined && { letterSpacing }),
    ...(textTransform !== undefined && { textTransform }),
    ...(tabular === true && { fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] }),
  };

  return maxFontSizeMultiplier === undefined ? { style } : { style, maxFontSizeMultiplier };
}

export type TextRenderProps = Pick<TextProps, 'maxFontSizeMultiplier'> & { style: TextStyle };
