import { hexToRgba, readableOn, WCAG_AA_NON_TEXT } from './contrast';
import { palette } from './palette';
import type { ColorScheme } from './scheme';

export type CategoryIconName = 'work' | 'learning' | 'personal' | 'health' | 'creative' | 'social';

export type CategoryPreset = {
  readonly name: string;
  readonly icon: CategoryIconName;
  readonly hue: string;
  readonly tint: string;
};

export const CATEGORY_PRESETS: readonly CategoryPreset[] = [
  { name: 'Work', icon: 'work', hue: '#8C7DE8', tint: '#ECE9FC' },
  { name: 'Learning', icon: 'learning', hue: '#2FBFA0', tint: '#DEF6F0' },
  { name: 'Personal', icon: 'personal', hue: '#F2B21E', tint: '#FCF0D2' },
  { name: 'Health', icon: 'health', hue: '#45C67E', tint: '#E1F6E9' },
  { name: 'Creative', icon: 'creative', hue: '#FF8A5C', tint: '#FFEAE0' },
  { name: 'Social', icon: 'social', hue: '#B57BFF', tint: '#F1E7FF' },
] as const;

const DARK_TINT_ALPHA = 0.18;
const DERIVED_LIGHT_TINT_ALPHA = 0.12;

const presetByHue = new Map(CATEGORY_PRESETS.map((preset) => [preset.hue.toUpperCase(), preset]));

export function categorySurface(hue: string, scheme: ColorScheme): string {
  if (scheme === 'dark') return hexToRgba(hue, DARK_TINT_ALPHA);
  return presetByHue.get(hue.toUpperCase())?.tint ?? hexToRgba(hue, DERIVED_LIGHT_TINT_ALPHA);
}

export function categoryForeground(hue: string, scheme: ColorScheme): string {
  return readableOn(hue, categoryBackdrop(hue, scheme));
}

export function categoryGlyph(hue: string, scheme: ColorScheme): string {
  return readableOn(hue, categoryBackdrop(hue, scheme), WCAG_AA_NON_TEXT);
}

function categoryBackdrop(hue: string, scheme: ColorScheme): string {
  if (scheme === 'dark') return palette.nightCard;
  return presetByHue.get(hue.toUpperCase())?.tint ?? palette.white;
}

export { hexToRgba };
