export const durations = {
  instant: 90,
  fast: 160,
  normal: 240,
  slow: 380,
  ring: 600,
} as const;

export type DurationName = keyof typeof durations;

export const REDUCED_MOTION_DURATION = 0;

export const easing = {
  standard: [0.32, 0.72, 0, 1] as const,
  decelerate: [0.16, 1, 0.3, 1] as const,
  accelerate: [0.7, 0, 0.84, 0] as const,
} as const;

export const springs = {
  press: { damping: 26, stiffness: 420, mass: 0.7 },
  sheet: { damping: 30, stiffness: 260, mass: 0.9 },
  bounce: { damping: 14, stiffness: 220, mass: 0.8 },
} as const;

export type SpringName = keyof typeof springs;

export const PRESSED_SCALE = 0.96;
export const PRESSED_OPACITY = 0.9;
