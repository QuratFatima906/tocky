import { palette } from './palette';
import type { ColorScheme } from './scheme';

export type GradientName =
  | 'accent'
  | 'accentCompact'
  | 'screenFocus'
  | 'screenWarm'
  | 'heroLilac'
  | 'heroBlush'
  | 'heroMint';

export type Gradient = {
  readonly colors: readonly string[];
  readonly locations: readonly number[];
};

const LIGHT: Record<GradientName, Gradient> = {
  accent: {
    colors: [palette.pinkLight, palette.pink, palette.pinkPressed],
    locations: [0, 0.55, 1],
  },
  accentCompact: { colors: [palette.pinkLight, palette.pinkPressed], locations: [0, 1] },
  screenFocus: {
    colors: [palette.lilacWash, palette.paper, palette.pinkWash],
    locations: [0, 0.46, 1],
  },
  screenWarm: {
    colors: [palette.violetWash, palette.pinkWash, palette.pinkTint],
    locations: [0, 0.55, 1],
  },
  heroLilac: { colors: [palette.violetWash, palette.pinkWash], locations: [0, 1] },
  heroBlush: { colors: [palette.pinkWash, palette.violetWash], locations: [0, 1] },
  heroMint: {
    colors: [palette.mintWash, palette.violetWash, palette.pinkWash],
    locations: [0, 0.55, 1],
  },
};

const DARK: Record<GradientName, Gradient> = {
  accent: {
    colors: [palette.pinkSoft, palette.pinkOnDark, palette.pink],
    locations: [0, 0.55, 1],
  },
  accentCompact: { colors: [palette.pinkSoft, palette.pink], locations: [0, 1] },
  screenFocus: {
    colors: [palette.nightRaised, palette.night, palette.nightCard],
    locations: [0, 0.46, 1],
  },
  screenWarm: {
    colors: [palette.nightCard, palette.night, palette.nightRaised],
    locations: [0, 0.55, 1],
  },
  heroLilac: { colors: [palette.nightCard, palette.nightRaised], locations: [0, 1] },
  heroBlush: { colors: [palette.nightRaised, palette.nightCard], locations: [0, 1] },
  heroMint: {
    colors: [palette.nightRaised, palette.nightCard, palette.night],
    locations: [0, 0.55, 1],
  },
};

export const gradients: Record<ColorScheme, Record<GradientName, Gradient>> = {
  light: LIGHT,
  dark: DARK,
};
