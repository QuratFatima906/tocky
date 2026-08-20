import { hexToRgba, readableOn } from './contrast';
import { palette } from './palette';
import type { ColorScheme } from './scheme';

export type ColorRole =
  | 'background'
  | 'surface'
  | 'surfaceMuted'
  | 'surfaceSunken'
  | 'surfaceTranslucent'
  | 'inverseSurface'
  | 'onInverseSurface'
  | 'border'
  | 'borderSubtle'
  | 'borderInteractive'
  | 'text'
  | 'textSecondary'
  | 'textTertiary'
  | 'textDecorative'
  | 'textOnAccent'
  | 'accent'
  | 'accentPressed'
  | 'accentTint'
  | 'accentBorder'
  | 'accentOnTint'
  | 'track'
  | 'success'
  | 'successText'
  | 'warning'
  | 'warningText'
  | 'error'
  | 'errorText'
  | 'errorBorder'
  | 'info'
  | 'infoText'
  | 'scrim';

const LIGHT_TEXT_BACKDROP = palette.mist;
const DARK_TEXT_BACKDROP = palette.nightCard;

const LIGHT: Record<ColorRole, string> = {
  background: palette.paper,
  surface: palette.white,
  surfaceMuted: palette.mist,
  surfaceSunken: palette.hairline,
  surfaceTranslucent: hexToRgba(palette.white, 0.85),
  inverseSurface: palette.ink,
  onInverseSurface: palette.nightTextInverse,

  border: palette.hairline,
  borderSubtle: palette.violetBorder,
  borderInteractive: palette.soft,

  text: palette.ink,
  textSecondary: palette.slate,
  textTertiary: palette.stone,
  textDecorative: palette.lilac,
  textOnAccent: palette.white,

  accent: palette.pink,
  accentPressed: palette.pinkPressed,
  accentTint: palette.pinkTint,
  accentBorder: palette.pinkBorder,
  accentOnTint: readableOn(palette.pinkDeep, palette.pinkTint),

  track: palette.hairline,

  success: palette.success,
  successText: readableOn(palette.success, LIGHT_TEXT_BACKDROP),
  warning: palette.warning,
  warningText: readableOn(palette.warning, LIGHT_TEXT_BACKDROP),
  error: palette.error,
  errorText: readableOn(palette.error, LIGHT_TEXT_BACKDROP),
  errorBorder: palette.blushBorder,
  info: palette.info,
  infoText: readableOn(palette.info, LIGHT_TEXT_BACKDROP),

  scrim: hexToRgba(palette.ink, 0.42),
};

const DARK: Record<ColorRole, string> = {
  background: palette.night,
  surface: palette.nightCard,
  surfaceMuted: palette.nightRaised,
  surfaceSunken: palette.nightSunken,
  surfaceTranslucent: hexToRgba(palette.nightCard, 0.85),
  inverseSurface: palette.nightText,
  onInverseSurface: palette.ink,

  border: palette.nightLine,
  borderSubtle: palette.nightLine,
  borderInteractive: palette.nightBorderStrong,

  text: palette.nightText,
  textSecondary: palette.nightMuted,
  textTertiary: palette.nightMuted,
  textDecorative: palette.nightSubtle,
  textOnAccent: palette.nightInk,

  accent: palette.pinkOnDark,
  accentPressed: palette.pink,
  accentTint: hexToRgba(palette.pinkOnDark, 0.16),
  accentBorder: hexToRgba(palette.pinkOnDark, 0.32),
  accentOnTint: palette.pinkPale,

  track: palette.nightLine,

  success: palette.success,
  successText: readableOn(palette.success, DARK_TEXT_BACKDROP),
  warning: palette.warning,
  warningText: readableOn(palette.warning, DARK_TEXT_BACKDROP),
  error: palette.error,
  errorText: readableOn(palette.error, DARK_TEXT_BACKDROP),
  errorBorder: hexToRgba(palette.error, 0.36),
  info: palette.info,
  infoText: readableOn(palette.info, DARK_TEXT_BACKDROP),

  scrim: hexToRgba('#000000', 0.62),
};

export const colors: Record<ColorScheme, Record<ColorRole, string>> = {
  light: LIGHT,
  dark: DARK,
};
