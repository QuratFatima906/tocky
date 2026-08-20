const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function parseHex(hex: string): [number, number, number] | null {
  if (!HEX_PATTERN.test(hex)) return null;
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;
  return [
    parseInt(expanded.slice(0, 2), 16),
    parseInt(expanded.slice(2, 4), 16),
    parseInt(expanded.slice(4, 6), 16),
  ];
}

export function toHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue]
    .map((channel) =>
      Math.round(Math.max(0, Math.min(255, channel)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const channels = parseHex(hex);
  if (channels === null) return hex;
  const [red, green, blue] = channels;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function relativeLuminance(hex: string): number {
  const channels = parseHex(hex);
  if (channels === null) return 0;
  const [red, green, blue] = channels.map((channel) => {
    const proportion = channel / 255;
    return proportion <= 0.03928 ? proportion / 12.92 : Math.pow((proportion + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (a, b) => b - a,
  ) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}

export const WCAG_AA_BODY_TEXT = 4.5;
export const WCAG_AA_LARGE_TEXT = 3;
export const WCAG_AA_NON_TEXT = 3;

const SHADE_STEP = 0.02;

const readableCache = new Map<string, string>();

export function readableOn(
  hue: string,
  background: string,
  targetRatio: number = WCAG_AA_BODY_TEXT,
): string {
  const cacheKey = `${hue}|${background}|${targetRatio}`;
  const cached = readableCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const channels = parseHex(hue);
  if (channels === null) {
    readableCache.set(cacheKey, hue);
    return hue;
  }

  const backgroundIsDark = relativeLuminance(background) < 0.5;
  let result = toHex(...channels);

  for (let step = 0; step <= 1 / SHADE_STEP; step += 1) {
    if (contrastRatio(result, background) >= targetRatio) break;
    const factor = 1 - step * SHADE_STEP;
    const [red, green, blue] = channels;
    result = backgroundIsDark
      ? toHex(
          red + (255 - red) * (1 - factor),
          green + (255 - green) * (1 - factor),
          blue + (255 - blue) * (1 - factor),
        )
      : toHex(red * factor, green * factor, blue * factor);
  }

  readableCache.set(cacheKey, result);
  return result;
}
