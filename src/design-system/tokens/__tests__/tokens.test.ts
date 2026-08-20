import { categoryForeground, categoryGlyph, categorySurface, CATEGORY_PRESETS } from '../category';
import { colors, type ColorRole } from '../colors';
import {
  contrastRatio,
  hexToRgba,
  parseHex,
  readableOn,
  toHex,
  WCAG_AA_BODY_TEXT,
  WCAG_AA_NON_TEXT,
} from '../contrast';
import { elevation } from '../elevation';
import { gradients } from '../gradients';
import { durations } from '../motion';
import { radius, tileRadius } from '../radius';
import type { ColorScheme } from '../scheme';
import { spacing } from '../spacing';
import { textVariants } from '../typography';

const SCHEMES: readonly ColorScheme[] = ['light', 'dark'];

describe('contrast helpers', () => {
  it('computes known WCAG ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 1);
  });

  it('is symmetric in its arguments', () => {
    expect(contrastRatio('#FF5C8A', '#FFFFFF')).toBeCloseTo(contrastRatio('#FFFFFF', '#FF5C8A'), 6);
  });

  describe('parseHex', () => {
    it('parses six-digit and three-digit hex', () => {
      expect(parseHex('#FF5C8A')).toEqual([255, 92, 138]);
      expect(parseHex('#F0A')).toEqual([255, 0, 170]);
      expect(parseHex('ff5c8a')).toEqual([255, 92, 138]);
    });

    it('rejects anything that is not three- or six-digit hex', () => {
      for (const invalid of ['', 'rebeccapurple', '#GGG', '#FF5C8AFF', '#FF5C', '#F0AB']) {
        expect(parseHex(invalid)).toBeNull();
      }
    });
  });

  describe('hexToRgba', () => {
    it('converts valid hex', () => {
      expect(hexToRgba('#FF5C8A', 0.5)).toBe('rgba(255, 92, 138, 0.5)');
      expect(hexToRgba('#F0A', 1)).toBe('rgba(255, 0, 170, 1)');
    });

    it('never produces NaN channels from unparseable input', () => {
      for (const invalid of ['', 'rebeccapurple', '#GGG', '#FF5C8AFF']) {
        expect(hexToRgba(invalid, 0.5)).not.toContain('NaN');
      }
    });
  });

  it('clamps out-of-range channels when building hex', () => {
    expect(toHex(-20, 300, 128)).toBe('#00FF80');
  });

  describe('readableOn', () => {
    it('darkens a hue until it is readable on a light background', () => {
      const readable = readableOn('#45C67E', '#FFFFFF');
      expect(contrastRatio(readable, '#FFFFFF')).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
    });

    it('lightens a hue until it is readable on a dark background', () => {
      const readable = readableOn('#8C7DE8', '#2A2634');
      expect(contrastRatio(readable, '#2A2634')).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
    });

    it('leaves an already-readable hue untouched', () => {
      expect(readableOn('#000000', '#FFFFFF')).toBe('#000000');
    });

    it('returns unparseable input unchanged rather than producing garbage', () => {
      expect(readableOn('rebeccapurple', '#FFFFFF')).toBe('rebeccapurple');
    });
  });
});

describe('color role contrast', () => {
  const TEXT_ROLES_REQUIRING_BODY_CONTRAST: readonly ColorRole[] = [
    'text',
    'textSecondary',
    'textTertiary',
    'successText',
    'warningText',
    'errorText',
    'infoText',
  ];

  const TEXT_BACKDROPS: readonly ColorRole[] = ['background', 'surface', 'surfaceMuted'];

  it.each(SCHEMES)('meets AA body contrast for text roles in %s mode', (scheme) => {
    for (const role of TEXT_ROLES_REQUIRING_BODY_CONTRAST) {
      for (const backdrop of TEXT_BACKDROPS) {
        const ratio = contrastRatio(colors[scheme][role], colors[scheme][backdrop]);
        expect({ scheme, role, backdrop, ratio: Number(ratio.toFixed(2)) }).toEqual(
          expect.objectContaining({ ratio: expect.any(Number) }),
        );
        expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
      }
    }
  });

  it.each(SCHEMES)('meets the non-text threshold for interactive borders in %s mode', (scheme) => {
    const ratio = contrastRatio(colors[scheme].borderInteractive, colors[scheme].surface);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NON_TEXT);
  });

  it.each(SCHEMES)('keeps accent text readable on the accent tint in %s mode', (scheme) => {
    const ratio = contrastRatio(colors[scheme].accentOnTint, colors[scheme].accentTint);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NON_TEXT);
  });

  it.each(SCHEMES)('keeps inverse surface text readable in %s mode', (scheme) => {
    const ratio = contrastRatio(colors[scheme].onInverseSurface, colors[scheme].inverseSurface);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
  });

  it('gives light and dark genuinely different surfaces', () => {
    expect(colors.light.background).not.toBe(colors.dark.background);
    expect(colors.light.text).not.toBe(colors.dark.text);
  });

  it('keeps sunken surfaces recessed relative to the raised surface in both schemes', () => {
    expect(contrastRatio(colors.light.surfaceSunken, colors.light.surface)).toBeGreaterThan(1);
    expect(contrastRatio(colors.dark.surfaceSunken, colors.dark.background)).toBeGreaterThan(1);
  });
});

describe('category colors', () => {
  it('gives every preset a distinct hue and a distinct name', () => {
    expect(new Set(CATEGORY_PRESETS.map((preset) => preset.hue)).size).toBe(
      CATEGORY_PRESETS.length,
    );
    expect(new Set(CATEGORY_PRESETS.map((preset) => preset.name)).size).toBe(
      CATEGORY_PRESETS.length,
    );
  });

  it('returns the designed tint for a preset hue in light mode', () => {
    for (const preset of CATEGORY_PRESETS) {
      expect(categorySurface(preset.hue, 'light')).toBe(preset.tint);
      expect(categorySurface(preset.hue.toLowerCase(), 'light')).toBe(preset.tint);
    }
  });

  it('derives a translucent tint for user-created hues and for dark mode', () => {
    expect(categorySurface('#123456', 'light')).toBe('rgba(18, 52, 86, 0.12)');
    expect(categorySurface(CATEGORY_PRESETS[0]!.hue, 'dark')).toBe('rgba(140, 125, 232, 0.18)');
  });

  it.each(SCHEMES)('keeps every preset label readable on its own surface in %s mode', (scheme) => {
    for (const preset of CATEGORY_PRESETS) {
      const backdrop = scheme === 'light' ? preset.tint : colors.dark.surface;
      expect(
        contrastRatio(categoryForeground(preset.hue, scheme), backdrop),
      ).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
    }
  });

  it.each(SCHEMES)('keeps every preset glyph distinguishable in %s mode', (scheme) => {
    for (const preset of CATEGORY_PRESETS) {
      const backdrop = scheme === 'light' ? preset.tint : colors.dark.surface;
      expect(contrastRatio(categoryGlyph(preset.hue, scheme), backdrop)).toBeGreaterThanOrEqual(
        WCAG_AA_NON_TEXT,
      );
    }
  });

  it('keeps user-created hues readable too', () => {
    for (const hue of ['#FFEE00', '#000080', '#FF0000', '#00FF00']) {
      const backdrop = categorySurface(hue, 'light');
      expect(contrastRatio(categoryForeground(hue, 'light'), '#FFFFFF')).toBeGreaterThan(1);
      expect(backdrop).not.toContain('NaN');
    }
  });
});

describe('spacing and radius', () => {
  it('keeps spacing on a 4-point grid', () => {
    for (const value of Object.values(spacing)) {
      expect(value % 4).toBe(0);
    }
  });

  it('scales tile radius with tile size the way the design does', () => {
    expect(tileRadius(30)).toBe(10);
    expect(tileRadius(42)).toBe(14);
    expect(tileRadius(48)).toBe(16);
    expect(tileRadius(112)).toBe(37);
  });

  it('orders the radius scale from tightest to fully rounded', () => {
    const values = Object.values(radius);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });
});

describe('typography', () => {
  it('expresses line height as a ratio so Dynamic Type scales it', () => {
    for (const variant of Object.values(textVariants)) {
      expect(variant.lineHeightRatio).toBeGreaterThanOrEqual(1);
      expect(variant.lineHeightRatio).toBeLessThanOrEqual(1.6);
      expect(variant).not.toHaveProperty('lineHeight');
    }
  });

  it('marks every timer and stat variant as tabular so digits do not jitter', () => {
    for (const name of [
      'timerHero',
      'timerLarge',
      'timerMedium',
      'timerSmall',
      'statHero',
    ] as const) {
      expect(textVariants[name].tabular).toBe(true);
    }
  });

  it('caps Dynamic Type only on variants that cannot reflow', () => {
    expect(textVariants.body.maxFontSizeMultiplier).toBeUndefined();
    expect(textVariants.bodyLarge.maxFontSizeMultiplier).toBeUndefined();
    expect(textVariants.label.maxFontSizeMultiplier).toBeUndefined();
    expect(textVariants.timerHero.maxFontSizeMultiplier).toBeDefined();
    expect(textVariants.tabLabel.maxFontSizeMultiplier).toBeDefined();
  });
});

describe('gradients', () => {
  it.each(SCHEMES)('pairs every gradient colour with a stop location in %s mode', (scheme) => {
    for (const gradient of Object.values(gradients[scheme])) {
      expect(gradient.colors.length).toBe(gradient.locations.length);
      expect(gradient.locations[0]).toBe(0);
      expect(gradient.locations[gradient.locations.length - 1]).toBe(1);
    }
  });

  it('keeps the three-stop accent gradient the design specifies', () => {
    expect(gradients.light.accent.colors).toHaveLength(3);
  });
});

describe('elevation', () => {
  it.each(SCHEMES)('grows shadow radius with each level in %s mode', (scheme) => {
    const ordered = ['hairline', 'card', 'raised', 'sheet'] as const;
    const radii = ordered.map((level) => elevation[scheme][level].shadowRadius ?? 0);
    expect([...radii].sort((a, b) => a - b)).toEqual(radii);
  });
});

describe('motion', () => {
  it('orders durations from fastest to slowest', () => {
    const values = [durations.instant, durations.fast, durations.normal, durations.slow];
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });
});
