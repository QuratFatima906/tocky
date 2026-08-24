import { CATEGORY_PRESETS } from '@/design-system';
import type { Category, Session } from '@/domain';

import type { SessionStoreSnapshot } from './sessionStore';

const MINUTE = 60_000;

export const DEFAULT_CATEGORIES: readonly Category[] = CATEGORY_PRESETS.map((preset) => ({
  id: preset.icon,
  name: preset.name,
  icon: preset.icon,
  color: preset.hue,
  isArchived: false,
}));

type SeedSession = {
  readonly id: string;
  readonly categoryId: string;
  readonly label: string;
  readonly minutesAgo: number;
  readonly durationMinutes: number | 'running';
};

const SEED_SESSIONS: readonly SeedSession[] = [
  {
    id: 'seed-active',
    categoryId: 'work',
    label: 'Building Tocky',
    minutesAgo: 102,
    durationMinutes: 'running',
  },
  {
    id: 'seed-creative',
    categoryId: 'creative',
    label: 'Icon polish',
    minutesAgo: 170,
    durationMinutes: 48,
  },
  {
    id: 'seed-learning',
    categoryId: 'learning',
    label: 'Reading · System Design',
    minutesAgo: 260,
    durationMinutes: 66,
  },
  {
    id: 'seed-work-morning',
    categoryId: 'work',
    label: 'Inbox and planning',
    minutesAgo: 360,
    durationMinutes: 42,
  },
];

const YESTERDAY_MINUTES_BY_CATEGORY: Readonly<Record<string, number>> = {
  work: 118,
  learning: 40,
  health: 30,
};

const DAY = 24 * 60;

function buildSession(seed: SeedSession, now: number): Session {
  const startedAt = now - seed.minutesAgo * MINUTE;

  return {
    id: seed.id,
    categoryId: seed.categoryId,
    label: seed.label,
    startedAt,
    endedAt: seed.durationMinutes === 'running' ? null : startedAt + seed.durationMinutes * MINUTE,
    pauses: [],
    linkedTaskId: null,
    note: null,
  };
}

export function createDevSeedSnapshot(now: number): SessionStoreSnapshot {
  const yesterday = Object.entries(YESTERDAY_MINUTES_BY_CATEGORY).map(([categoryId, minutes]) =>
    buildSession(
      {
        id: `seed-yesterday-${categoryId}`,
        categoryId,
        label: 'Yesterday',
        minutesAgo: DAY + minutes,
        durationMinutes: minutes,
      },
      now,
    ),
  );

  return {
    status: 'ready',
    categories: DEFAULT_CATEGORIES,
    sessions: [...SEED_SESSIONS.map((seed) => buildSession(seed, now)), ...yesterday],
  };
}
