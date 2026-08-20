import { categorySurface, hexToRgba, CATEGORY_PRESETS } from '../category';
import { colors, type ColorRole } from '../colors';
import { elevation } from '../elevation';
import { radius } from '../radius';
import { spacing } from '../spacing';
import { textVariants } from '../typography';

const SCHEMES = ['light', 'dark'] as const;

const COLOR_ROLES = Object.keys(colors.light) as ColorRole[];

describe('color roles', () => {
  it('defines every role in both schemes', () => {
    for (const scheme of SCHEMES) {
      for (const role of COLOR_ROLES) {
        expect(colors[scheme][role]).toBeDefined();
      }
    }
  });

  it('defines the same set of roles in both schemes', () => {
    expect(Object.keys(colors.dark).sort()).toEqual(COLOR_ROLES.sort());
  });

  it('resolves every role to a hex or rgba value', () => {
    for (const scheme of SCHEMES) {
      for (const role of COLOR_ROLES) {
        expect(colors[scheme][role]).toMatch(/^(#[0-9A-Fa-f]{6}|rgba\()/);
      }
    }
  });

  it('gives light and dark genuinely different backgrounds', () => {
    expect(colors.light.background).not.toBe(colors.dark.background);
    expect(colors.light.text).not.toBe(colors.dark.text);
  });
});

describe('elevation', () => {
  it('defines every level in both schemes', () => {
    for (const scheme of SCHEMES) {
      for (const level of Object.keys(elevation.light)) {
        expect(elevation[scheme][level as keyof typeof elevation.light]).toBeDefined();
      }
    }
  });
});

describe('spacing and radius', () => {
  it('keeps spacing on a 4-point grid', () => {
    for (const value of Object.values(spacing)) {
      expect(value % 4).toBe(0);
    }
  });

  it('increases monotonically', () => {
    const spacingValues = Object.values(spacing);
    const radiusValues = Object.values(radius);
    expect([...spacingValues].sort((a, b) => a - b)).toEqual(spacingValues);
    expect([...radiusValues].sort((a, b) => a - b)).toEqual(radiusValues);
  });
});

describe('typography', () => {
  it('gives every variant a line height at least as large as its font size', () => {
    for (const variant of Object.values(textVariants)) {
      expect(variant.lineHeight).toBeGreaterThanOrEqual(variant.fontSize);
    }
  });

  it('marks all timer and stat variants as tabular so digits do not jitter', () => {
    const timerVariants = [
      'timerHero',
      'timerLarge',
      'timerMedium',
      'timerSmall',
      'statHero',
    ] as const;
    for (const name of timerVariants) {
      expect(textVariants[name].tabular).toBe(true);
    }
  });
});

describe('hexToRgba', () => {
  it('converts six-digit hex', () => {
    expect(hexToRgba('#FF5C8A', 0.5)).toBe('rgba(255, 92, 138, 0.5)');
  });

  it('expands three-digit hex', () => {
    expect(hexToRgba('#F0A', 1)).toBe('rgba(255, 0, 170, 1)');
  });
});

describe('categorySurface', () => {
  it('returns the designed tint for a preset hue in light mode', () => {
    const work = CATEGORY_PRESETS[0]!;
    expect(categorySurface(work.hue, 'light')).toBe(work.tint);
  });

  it('is case insensitive about the hue', () => {
    const work = CATEGORY_PRESETS[0]!;
    expect(categorySurface(work.hue.toLowerCase(), 'light')).toBe(work.tint);
  });

  it('derives a translucent tint for user-created hues in light mode', () => {
    expect(categorySurface('#123456', 'light')).toBe('rgba(18, 52, 86, 0.12)');
  });

  it('derives a translucent tint for every hue in dark mode', () => {
    const work = CATEGORY_PRESETS[0]!;
    expect(categorySurface(work.hue, 'dark')).toBe('rgba(140, 125, 232, 0.18)');
  });

  it('gives every preset a distinct hue', () => {
    const hues = CATEGORY_PRESETS.map((preset) => preset.hue);
    expect(new Set(hues).size).toBe(hues.length);
  });
});
