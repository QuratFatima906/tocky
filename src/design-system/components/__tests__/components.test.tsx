import { act, fireEvent, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { INCLUDING_HIDDEN, renderWithProviders } from '@/test/renderWithProviders';

import { colors, MINIMUM_TOUCH_TARGET, textVariants, tileRadius } from '../../tokens';
import { Button } from '../Button';
import { CategoryTile } from '../CategoryTile';
import { IconButton } from '../IconButton';
import { Screen } from '../Screen';
import { Card, Surface } from '../Surface';
import { Text } from '../Text';

function flatten(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...[style].flat(Infinity).filter(Boolean)) as Record<string, unknown>;
}

describe('Text', () => {
  it('applies the variant font, size and derived line height', async () => {
    await renderWithProviders(<Text variant="heading">Breakdown</Text>);
    const style = flatten(screen.getByText('Breakdown').props.style);
    expect(style.fontFamily).toBe(textVariants.heading.fontFamily);
    expect(style.fontSize).toBe(textVariants.heading.fontSize);
    expect(style.lineHeight).toBe(
      textVariants.heading.fontSize * textVariants.heading.lineHeightRatio,
    );
  });

  it('resolves colour through a theme role, never a raw value', async () => {
    await renderWithProviders(<Text color="textSecondary">Work</Text>, { theme: 'dark' });
    expect(flatten(screen.getByText('Work').props.style).color).toBe(colors.dark.textSecondary);
  });

  it('carries the variant Dynamic Type cap where one exists', async () => {
    await renderWithProviders(<Text variant="timerHero">01:42:18</Text>);
    expect(screen.getByText('01:42:18').props.maxFontSizeMultiplier).toBe(
      textVariants.timerHero.maxFontSizeMultiplier,
    );
  });

  it('leaves body text uncapped so it scales to the largest sizes', async () => {
    await renderWithProviders(<Text variant="body">Reading</Text>);
    expect(screen.getByText('Reading').props.maxFontSizeMultiplier).toBeUndefined();
  });

  it('uses tabular figures for timer variants so digits do not jitter', async () => {
    await renderWithProviders(<Text variant="timerMedium">01:42:18</Text>);
    expect(flatten(screen.getByText('01:42:18').props.style).fontVariant).toEqual(['tabular-nums']);
  });
});

describe('Surface', () => {
  it('resolves background, radius, padding and gap from tokens', async () => {
    await renderWithProviders(
      <Surface testID="surface" background="surfaceMuted" radius="card" padding="lg" gap="sm" />,
    );
    const style = flatten(screen.getByTestId('surface').props.style);
    expect(style.backgroundColor).toBe(colors.light.surfaceMuted);
    expect(style.borderRadius).toBe(28);
    expect(style.padding).toBe(16);
    expect(style.gap).toBe(8);
  });

  it('applies an elevation shadow when asked', async () => {
    await renderWithProviders(<Surface testID="raised" elevation="card" />);
    expect(flatten(screen.getByTestId('raised').props.style).shadowRadius).toBeGreaterThan(0);
  });

  it('Card is a Surface with the standard card treatment', async () => {
    await renderWithProviders(<Card testID="card" />);
    const style = flatten(screen.getByTestId('card').props.style);
    expect(style.borderRadius).toBe(28);
    expect(style.backgroundColor).toBe(colors.light.surface);
  });
});

describe('Button', () => {
  it('is announced as a button with its label', async () => {
    await renderWithProviders(<Button label="Start Work session" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Start Work session' })).toBeTruthy();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Start" onPress={onPress} />);
    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Start' })));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire while disabled, and says so to assistive technology', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Start" disabled onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Start' });
    await act(async () => fireEvent.press(button));
    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('looks disabled, not just behaves disabled', async () => {
    await renderWithProviders(<Button label="Start" disabled onPress={jest.fn()} />);

    const { opacity } = StyleSheet.flatten(
      screen.getByRole('button', { name: 'Start' }).props.style,
    );

    expect(opacity).toBeLessThan(1);
  });

  it('reports busy and blocks presses while loading', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Start" loading onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Start' });
    await act(async () => fireEvent.press(button));
    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState.busy).toBe(true);
  });

  it.each(['small', 'medium', 'large'] as const)(
    'meets the 44pt minimum at %s size',
    async (size) => {
      await renderWithProviders(<Button label="Start" size={size} onPress={jest.fn()} />);
      const height = flatten(screen.getByRole('button', { name: 'Start' }).props.style).height;
      expect(height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
    },
  );
});

describe('IconButton', () => {
  it('requires a label, since an icon alone says nothing to a screen reader', async () => {
    await renderWithProviders(
      <IconButton icon="pause" accessibilityLabel="Pause timer" onPress={jest.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Pause timer' })).toBeTruthy();
  });

  it('never renders below the 44pt minimum, even when asked to', async () => {
    await renderWithProviders(
      <IconButton icon="pause" accessibilityLabel="Pause" size={24} onPress={jest.fn()} />,
    );
    const style = flatten(screen.getByRole('button', { name: 'Pause' }).props.style);
    expect(style.width).toBe(MINIMUM_TOUCH_TARGET);
    expect(style.height).toBe(MINIMUM_TOUCH_TARGET);
  });

  it('hides its glyph from assistive technology, since the button carries the label', async () => {
    await renderWithProviders(
      <IconButton icon="pause" accessibilityLabel="Pause" onPress={jest.fn()} />,
    );
    expect(screen.getByTestId('tocky-icon-pause', INCLUDING_HIDDEN).props['aria-hidden']).toBe(
      true,
    );
  });
});

describe('Screen', () => {
  it('adds safe-area insets on top of its padding', async () => {
    await renderWithProviders(
      <Screen testID="screen" padding="xl">
        <Text>Home</Text>
      </Screen>,
    );
    const style = flatten(screen.getByTestId('screen').props.style);
    expect(style.paddingTop).toBe(59 + 24);
    expect(style.paddingBottom).toBe(34 + 24);
  });

  it('omits an inset when the edge is opted out', async () => {
    await renderWithProviders(
      <Screen testID="screen" padding="xl" edges={{ top: false }}>
        <Text>Home</Text>
      </Screen>,
    );
    expect(flatten(screen.getByTestId('screen').props.style).paddingTop).toBe(24);
  });
});

describe('CategoryTile', () => {
  const WORK_HUE = '#8C7DE8';

  it('renders the category glyph on a tinted tile', async () => {
    await renderWithProviders(<CategoryTile icon="work" color={WORK_HUE} testID="tile" />);

    expect(screen.getByTestId('tocky-icon-work', INCLUDING_HIDDEN)).toBeTruthy();
  });

  it('rounds the tile in proportion to its size', async () => {
    await renderWithProviders(
      <CategoryTile icon="work" color={WORK_HUE} size={44} testID="tile" />,
    );

    expect(flatten(screen.getByTestId('tile').props.style).borderRadius).toBe(tileRadius(44));
  });

  it('leaves the tile empty rather than showing a misleading glyph for an unknown category', async () => {
    await renderWithProviders(<CategoryTile icon={undefined} color={WORK_HUE} testID="tile" />);

    expect(screen.getByTestId('tile')).toBeTruthy();
    expect(screen.queryByTestId('tocky-icon-work', INCLUDING_HIDDEN)).toBeNull();
  });
});
