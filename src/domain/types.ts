export type Category = {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly isArchived: boolean;
};

export type Pause = {
  readonly startedAt: number;
  readonly endedAt: number | null;
};

export type Session = {
  readonly id: string;
  readonly categoryId: string;
  readonly label: string | null;
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly pauses: readonly Pause[];
  readonly linkedTaskId: string | null;
  readonly note: string | null;
};

export type TimeRange = {
  readonly start: number;
  readonly end: number;
};

export type CategoryTotal = {
  readonly category: Category;
  readonly seconds: number;
  readonly share: number;
};

export type DaySessionEntry = {
  readonly session: Session;
  readonly seconds: number;
  readonly startedAtInDay: number;
};

export type DaySessions = {
  readonly dayStart: number;
  readonly totalSeconds: number;
  readonly entries: readonly DaySessionEntry[];
};

export type DayBreakdown = {
  readonly totalSeconds: number;
  readonly categoryTotals: readonly CategoryTotal[];
};
