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

const presetByHue = new Map(CATEGORY_PRESETS.map((preset) => [preset.hue.toUpperCase(), preset]));

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;
  const red = parseInt(expanded.slice(0, 2), 16);
  const green = parseInt(expanded.slice(2, 4), 16);
  const blue = parseInt(expanded.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function categorySurface(hue: string, scheme: ColorScheme): string {
  if (scheme === 'dark') return hexToRgba(hue, DARK_TINT_ALPHA);
  return presetByHue.get(hue.toUpperCase())?.tint ?? hexToRgba(hue, 0.12);
}
