import { screen } from '@testing-library/react-native';

import { INCLUDING_HIDDEN, renderWithProviders } from '@/test/renderWithProviders';

import { TockyIcon, TOCKY_ICON_NAMES } from '../TockyIcon';
import { OWL_EXPRESSIONS, TockyOwl } from '../TockyOwl';

describe('TockyIcon', () => {
  it.each(TOCKY_ICON_NAMES)('renders %s with stable geometry', async (name) => {
    await renderWithProviders(<TockyIcon name={name} color="#8C7DE8" size={24} />);
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it('exposes a distinct name for every glyph it can draw', () => {
    expect(new Set(TOCKY_ICON_NAMES).size).toBe(TOCKY_ICON_NAMES.length);
  });

  it('renders at the requested size', async () => {
    await renderWithProviders(<TockyIcon name="work" color="#8C7DE8" size={32} />);
    const artwork = screen.getByTestId('tocky-icon-work', INCLUDING_HIDDEN);
    expect(artwork.props.style).toMatchObject({ width: 32, height: 32 });
  });

  it('needs no knowledge of what it sits on, since cutouts are masked to transparency', async () => {
    await renderWithProviders(<TockyIcon name="history" color="#8C7DE8" size={24} />);
    const rendered = JSON.stringify(screen.toJSON());
    expect(rendered).toContain('"mask":"history"');
    expect(rendered).toContain('RNSVGMask');
  });

  it('stays out of the accessibility tree, since a text label always accompanies it', async () => {
    await renderWithProviders(<TockyIcon name="work" color="#8C7DE8" size={24} />);
    const artwork = screen.getByTestId('tocky-icon-work', INCLUDING_HIDDEN);
    expect(artwork.props['aria-hidden']).toBe(true);
  });
});

describe('TockyOwl', () => {
  it.each(OWL_EXPRESSIONS)('renders the %s expression with stable geometry', async (expression) => {
    await renderWithProviders(<TockyOwl expression={expression} size={64} />);
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it('keeps the artwork aspect ratio when sized', async () => {
    await renderWithProviders(<TockyOwl size={128} />);
    const artwork = screen.getByTestId('tocky-owl-curious', INCLUDING_HIDDEN);
    expect(artwork.props.style.width).toBe(128);
    expect(artwork.props.style.height).toBeCloseTo(128 * (134 / 128), 5);
  });

  it('derives every shade from the two hues it is given', async () => {
    await renderWithProviders(<TockyOwl bodyColor="#2FBFA0" size={64} />);
    const rendered = JSON.stringify(screen.toJSON());
    expect(rendered).not.toContain('8C7DE8');
  });

  it('stays out of the accessibility tree, since it is decorative', async () => {
    await renderWithProviders(<TockyOwl size={64} />);
    const artwork = screen.getByTestId('tocky-owl-curious', INCLUDING_HIDDEN);
    expect(artwork.props['aria-hidden']).toBe(true);
  });
});
