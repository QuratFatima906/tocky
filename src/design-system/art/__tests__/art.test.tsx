import { render, screen } from '@testing-library/react-native';

import { INCLUDING_HIDDEN } from '@/test/renderWithProviders';

import { shade } from '../../tokens/contrast';
import { TockyIcon, TOCKY_ICON_NAMES } from '../TockyIcon';
import { OWL_EXPRESSIONS, TockyOwl } from '../TockyOwl';

describe('TockyIcon', () => {
  it.each(TOCKY_ICON_NAMES)('renders %s without crashing', async (name) => {
    await render(<TockyIcon name={name} color="#8C7DE8" size={24} />);
    expect(screen.getByTestId(`tocky-icon-${name}`, INCLUDING_HIDDEN)).toBeTruthy();
  });

  it('covers every icon the design system declares', () => {
    expect(TOCKY_ICON_NAMES).toHaveLength(16);
    expect(new Set(TOCKY_ICON_NAMES).size).toBe(TOCKY_ICON_NAMES.length);
  });

  it('renders at the requested size', async () => {
    await render(<TockyIcon name="work" color="#8C7DE8" size={32} />);
    const artwork = screen.getByTestId('tocky-icon-work', INCLUDING_HIDDEN);
    expect(artwork.props.style).toMatchObject({ width: 32, height: 32 });
  });

  it('stays out of the accessibility tree, since a text label always accompanies it', async () => {
    await render(<TockyIcon name="work" color="#8C7DE8" size={24} />);
    const artwork = screen.getByTestId('tocky-icon-work', INCLUDING_HIDDEN);
    expect(artwork.props['aria-hidden']).toBe(true);
    expect(artwork.props.accessibilityElementsHidden).toBe(true);
    expect(artwork.props.importantForAccessibility).toBe('no-hide-descendants');
  });
});

describe('TockyOwl', () => {
  it.each(OWL_EXPRESSIONS)('renders the %s expression without crashing', async (expression) => {
    await render(<TockyOwl expression={expression} size={64} />);
    expect(screen.getByTestId(`tocky-owl-${expression}`, INCLUDING_HIDDEN)).toBeTruthy();
  });

  it('keeps the artwork aspect ratio when sized', async () => {
    await render(<TockyOwl size={128} />);
    const artwork = screen.getByTestId('tocky-owl-curious', INCLUDING_HIDDEN);
    expect(artwork.props.style.width).toBe(128);
    expect(artwork.props.style.height).toBeCloseTo(128 * (134 / 128), 5);
  });

  it('stays out of the accessibility tree, since it is decorative', async () => {
    await render(<TockyOwl size={64} />);
    const artwork = screen.getByTestId('tocky-owl-curious', INCLUDING_HIDDEN);
    expect(artwork.props['aria-hidden']).toBe(true);
    expect(artwork.props.accessibilityElementsHidden).toBe(true);
    expect(artwork.props.importantForAccessibility).toBe('no-hide-descendants');
  });
});

describe('shade', () => {
  it('darkens toward black for negative amounts', () => {
    expect(shade('#8C7DE8', -0.16)).toBe('#7669C3');
  });

  it('lightens toward white for positive amounts', () => {
    expect(shade('#8C7DE8', 0.58)).toBe('#CFC8F5');
  });

  it('is a no-op at zero', () => {
    expect(shade('#8C7DE8', 0)).toBe('#8C7DE8');
  });

  it('returns unparseable input unchanged', () => {
    expect(shade('rebeccapurple', -0.2)).toBe('rebeccapurple');
  });

  it('matches the shade formula the design source uses', () => {
    const designShade = (hex: string, amount: number) => {
      const channels = [0, 2, 4].map((index) => parseInt(hex.slice(index + 1, index + 3), 16));
      return `#${channels
        .map((channel) =>
          Math.round(amount >= 0 ? channel + (255 - channel) * amount : channel * (1 + amount))
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')
        .toUpperCase()}`;
    };

    for (const hue of ['#8C7DE8', '#2FBFA0', '#F2B21E', '#FF5C8A']) {
      for (const amount of [-0.22, -0.16, 0, 0.42, 0.58]) {
        expect(shade(hue, amount)).toBe(designShade(hue, amount));
      }
    }
  });
});
