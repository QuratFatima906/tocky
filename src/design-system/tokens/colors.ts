import { palette } from './palette';
import type { ColorScheme } from './scheme';

export type ColorRole =
  | 'background'
  | 'backgroundElevated'
  | 'surface'
  | 'surfaceMuted'
  | 'surfaceSunken'
  | 'border'
  | 'borderStrong'
  | 'text'
  | 'textSecondary'
  | 'textMuted'
  | 'textOnAccent'
  | 'accent'
  | 'accentPressed'
  | 'accentGradientStart'
  | 'accentGradientEnd'
  | 'accentTint'
  | 'accentOnTint'
  | 'track'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'scrim';

const LIGHT: Record<ColorRole, string> = {
  background: palette.paper,
  backgroundElevated: palette.white,
  surface: palette.white,
  surfaceMuted: palette.mist,
  surfaceSunken: palette.hairline,
  border: palette.hairline,
  borderStrong: palette.line,
  text: palette.ink,
  textSecondary: palette.slate,
  textMuted: palette.lilac,
  textOnAccent: palette.white,
  accent: palette.pink,
  accentPressed: palette.pinkPressed,
  accentGradientStart: palette.pinkLight,
  accentGradientEnd: palette.pinkPressed,
  accentTint: palette.pinkTint,
  accentOnTint: palette.pinkDeep,
  track: palette.hairline,
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
  info: palette.info,
  scrim: 'rgba(44, 40, 51, 0.42)',
};

const DARK: Record<ColorRole, string> = {
  background: palette.night,
  backgroundElevated: palette.nightRaised,
  surface: palette.nightCard,
  surfaceMuted: palette.nightRaised,
  surfaceSunken: palette.nightHairline,
  border: palette.nightLine,
  borderStrong: palette.nightSubtle,
  text: palette.nightText,
  textSecondary: palette.nightMuted,
  textMuted: palette.nightSubtle,
  textOnAccent: palette.nightInk,
  accent: palette.pinkOnDark,
  accentPressed: palette.pink,
  accentGradientStart: palette.pinkSoft,
  accentGradientEnd: palette.pink,
  accentTint: 'rgba(255, 111, 151, 0.16)',
  accentOnTint: palette.pinkPale,
  track: palette.nightHairline,
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
  info: palette.info,
  scrim: 'rgba(0, 0, 0, 0.62)',
};

export const colors: Record<ColorScheme, Record<ColorRole, string>> = {
  light: LIGHT,
  dark: DARK,
};
