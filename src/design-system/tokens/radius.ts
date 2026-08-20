export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  card: 28,
  sheet: 32,
  pill: 999,
} as const;

export type Radius = keyof typeof radius;
