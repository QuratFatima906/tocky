import { sessionSeconds } from './duration';
import type { Category, Session, Task } from './types';

/**
 * What leaves the app is what it recorded, not what a screen made of it: every
 * session, whole, with the ids that link them so an export can be read back.
 *
 * Durations are derived here the same way every screen derives them, rather
 * than written down, so an export can never disagree with what was on screen.
 */
export type ExportFormat = 'csv' | 'json';

export type ExportContents = {
  readonly sessions: readonly Session[];
  readonly categories: readonly Category[];
  readonly tasks: readonly Task[];
};

const CSV_COLUMNS = [
  'id',
  'category',
  'label',
  'startedAt',
  'endedAt',
  'trackedSeconds',
  'pauseCount',
  'linkedTask',
  'note',
] as const;

export const EXPORT_MIME_TYPES: Record<ExportFormat, string> = {
  csv: 'text/csv',
  json: 'application/json',
};

/** A field that could be mistaken for structure is quoted; a quote is doubled. */
function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function isoOrEmpty(at: number | null): string {
  return at === null ? '' : new Date(at).toISOString();
}

type ExportRow = Record<(typeof CSV_COLUMNS)[number], string>;

function rowsFrom({ sessions, categories, tasks }: ExportContents, now: number): ExportRow[] {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const taskTitles = new Map(tasks.map((task) => [task.id, task.title]));

  return sessions.map((session) => ({
    id: session.id,
    // A category deleted since is still what the session was tracked under, so
    // the id is kept rather than the row pretending it had none.
    category: categoryNames.get(session.categoryId) ?? session.categoryId,
    label: session.label ?? '',
    startedAt: isoOrEmpty(session.startedAt),
    endedAt: isoOrEmpty(session.endedAt),
    trackedSeconds: String(sessionSeconds(session, now)),
    pauseCount: String(session.pauses.length),
    linkedTask: session.linkedTaskId === null ? '' : (taskTitles.get(session.linkedTaskId) ?? ''),
    note: session.note ?? '',
  }));
}

export function sessionsToCsv(contents: ExportContents, now: number): string {
  const rows = rowsFrom(contents, now).map((row) =>
    CSV_COLUMNS.map((column) => csvField(row[column])).join(','),
  );

  return [CSV_COLUMNS.join(','), ...rows].join('\n');
}

export function sessionsToJson(contents: ExportContents, now: number): string {
  return JSON.stringify(
    {
      exportedAt: new Date(now).toISOString(),
      sessions: rowsFrom(contents, now),
      categories: contents.categories,
      tasks: contents.tasks,
    },
    null,
    2,
  );
}

export function exportFileName(format: ExportFormat, now: number): string {
  const [day] = new Date(now).toISOString().split('T');

  return `tocky-${day}.${format}`;
}

export function exportContents(
  contents: ExportContents,
  format: ExportFormat,
  now: number,
): string {
  return format === 'csv' ? sessionsToCsv(contents, now) : sessionsToJson(contents, now);
}
