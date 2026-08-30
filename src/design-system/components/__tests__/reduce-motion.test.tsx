import { act, fireEvent, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { renderWithProviders } from '@/test/renderWithProviders';

import { PRESSED_OPACITY, PRESSED_SCALE, REDUCED_MOTION_DURATION } from '../../tokens';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

const mockedIsReduceMotionEnabled = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled');

type PressedStyle = { transform: [{ scale: number }]; opacity: number };

async function styleWhilePressed(isReduceMotionOn: boolean): Promise<PressedStyle> {
  mockedIsReduceMotionEnabled.mockResolvedValue(isReduceMotionOn);

  await renderWithProviders(
    <PressableScale accessibilityRole="button" accessibilityLabel="Start" onPress={jest.fn()}>
      <Text>Start</Text>
    </PressableScale>,
  );

  const button = screen.getByRole('button', { name: 'Start' });
  await act(async () => fireEvent(button, 'pressIn'));
  await act(async () => {
    jest.advanceTimersByTime(200);
  });

  return button.props.jestAnimatedStyle.value as PressedStyle;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  mockedIsReduceMotionEnabled.mockReset();
});

/**
 * Collapsing the duration alone would leave the scale in place and merely snap
 * it, which is the jump Reduce Motion exists to avoid rather than a smaller
 * version of it. The dimming stays either way, so a press is never silent.
 */
describe('a press under Reduce Motion', () => {
  it('shrinks the control when motion is allowed', async () => {
    const [{ scale }] = (await styleWhilePressed(false)).transform;

    expect(scale).toBeCloseTo(PRESSED_SCALE);
  });

  it('does not move the control at all when motion is reduced', async () => {
    const [{ scale }] = (await styleWhilePressed(true)).transform;

    expect(scale).toBe(1);
  });

  it.each([false, true])('still dims the control when reduced is %s', async (isReduceMotionOn) => {
    expect((await styleWhilePressed(isReduceMotionOn)).opacity).toBeCloseTo(PRESSED_OPACITY);
  });

  it('has a zero-length transition to collapse to', () => {
    expect(REDUCED_MOTION_DURATION).toBe(0);
  });
});
