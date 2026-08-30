import { renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useSpokenElapsed } from '@/hooks/useSpokenElapsed';

let announce: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibility>;

beforeEach(() => {
  announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
});

afterEach(() => {
  announce.mockRestore();
});

type Elapsed = { elapsedSeconds: number; isPaused: boolean };

async function trackFrom(initialProps: Elapsed) {
  const { rerender } = await renderHook(
    ({ elapsedSeconds, isPaused }: Elapsed) => useSpokenElapsed(elapsedSeconds, isPaused),
    { initialProps },
  );

  return {
    tickTo: (elapsedSeconds: number, isPaused = initialProps.isPaused) =>
      rerender({ elapsedSeconds, isPaused }),
    spoken: () => announce.mock.calls.map(([sentence]) => sentence),
  };
}

it('says nothing for the minute the timer was opened partway through', async () => {
  const timer = await trackFrom({ elapsedSeconds: 95, isPaused: false });

  expect(timer.spoken()).toEqual([]);
});

it('says nothing on the seconds between one minute and the next', async () => {
  const timer = await trackFrom({ elapsedSeconds: 95, isPaused: false });
  await timer.tickTo(119);

  expect(timer.spoken()).toEqual([]);
});

it('speaks once the minute turns over, in whole minutes', async () => {
  const timer = await trackFrom({ elapsedSeconds: 95, isPaused: false });
  await timer.tickTo(120);

  expect(timer.spoken()).toEqual(['Tracking 2 minutes']);
});

it('speaks once per minute rather than once per tick', async () => {
  const timer = await trackFrom({ elapsedSeconds: 0, isPaused: false });
  for (const seconds of [30, 60, 90, 120, 150, 180]) await timer.tickTo(seconds);

  expect(timer.spoken()).toEqual(['Tracking 1 minute', 'Tracking 2 minutes', 'Tracking 3 minutes']);
});

it('reads hours as hours once there are some', async () => {
  const timer = await trackFrom({ elapsedSeconds: 3599, isPaused: false });
  await timer.tickTo(3600);

  expect(timer.spoken()).toEqual(['Tracking 1 hour']);
});

it('stays quiet while the session is paused', async () => {
  const timer = await trackFrom({ elapsedSeconds: 60, isPaused: true });
  await timer.tickTo(120, true);

  expect(timer.spoken()).toEqual([]);
});

it('does not announce the minute it was paused in when it resumes', async () => {
  const timer = await trackFrom({ elapsedSeconds: 120, isPaused: true });
  await timer.tickTo(120, false);

  expect(timer.spoken()).toEqual([]);

  await timer.tickTo(180, false);
  expect(timer.spoken()).toEqual(['Tracking 3 minutes']);
});
