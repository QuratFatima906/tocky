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

export type CategoryTotal = {
  readonly category: Category;
  readonly seconds: number;
  readonly share: number;
};
