import type { ViewStyle } from 'react-native';

import { palette, shadowColor } from './palette';
import type { ColorScheme } from './scheme';

export type ElevationLevel = 'hairline' | 'card' | 'raised' | 'sheet' | 'glow';

type Shadow = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

const LIGHT_SHADOWS: Record<ElevationLevel, Shadow> = {
  hairline: {
    shadowColor: shadowColor.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
    elevation: 1,
  },
  card: {
    shadowColor: shadowColor.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 3,
  },
  raised: {
    shadowColor: shadowColor.light,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 11,
    elevation: 6,
  },
  sheet: {
    shadowColor: shadowColor.light,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 12,
  },
  glow: {
    shadowColor: palette.pink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 10,
    elevation: 10,
  },
};

const DARK_SHADOWS: Record<ElevationLevel, Shadow> = {
  hairline: {
    shadowColor: shadowColor.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: shadowColor.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  raised: {
    shadowColor: shadowColor.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 12,
    elevation: 6,
  },
  sheet: {
    shadowColor: shadowColor.dark,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 17,
    elevation: 12,
  },
  glow: {
    shadowColor: palette.pinkOnDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
};

export const elevation: Record<ColorScheme, Record<ElevationLevel, Shadow>> = {
  light: LIGHT_SHADOWS,
  dark: DARK_SHADOWS,
};
