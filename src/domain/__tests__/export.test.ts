import {
  exportContents,
  exportFileName,
  sessionsToCsv,
  sessionsToJson,
  type ExportContents,
} from '../export';
import type { Category, Session, Task } from '../types';

const NOW = new Date(2026, 7, 19, 12, 0).getTime();
const MINUTE = 60_000;

const CATEGORIES: readonly Category[] = [
  { id: 'work', name: 'Work', icon: 'work', color: '#8C7DE8', isArchived: false },
];

const TASKS: readonly Task[] = [
  {
    id: 'task-1',
    title: 'Ship the timer',
    categoryId: 'work',
    estimateSeconds: null,
    createdAt: NOW - 90 * MINUTE,
    completedAt: null,
  },
];

function sessionWith(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    categoryId: 'work',
    label: 'Building Tocky',
    startedAt: NOW - 60 * MINUTE,
    endedAt: NOW - 30 * MINUTE,
    pauses: [],
    linkedTaskId: null,
    note: null,
    ...overrides,
  };
}

function contentsOf(sessions: readonly Session[]): ExportContents {
  return { sessions, categories: CATEGORIES, tasks: TASKS };
}

function csvRows(csv: string): string[][] {
  return csv.split('\n').map((line) => line.split(','));
}

/** The row under the header, which every one of these fixtures has exactly one of. */
function onlyRow(csv: string): string[] {
  const [, row] = csvRows(csv);
  return row!;
}

describe('the CSV', () => {
  it('leads with a header naming every column', () => {
    const [header] = csvRows(sessionsToCsv(contentsOf([]), NOW));

    expect(header).toEqual([
      'id',
      'category',
      'label',
      'startedAt',
      'endedAt',
      'trackedSeconds',
      'pauseCount',
      'linkedTask',
      'note',
    ]);
  });

  it('is only a header when nothing has been tracked', () => {
    expect(sessionsToCsv(contentsOf([]), NOW).split('\n')).toHaveLength(1);
  });

  it('writes a session as its category name, times and tracked seconds', () => {
    expect(onlyRow(sessionsToCsv(contentsOf([sessionWith()]), NOW))).toEqual([
      'session-1',
      'Work',
      'Building Tocky',
      new Date(NOW - 60 * MINUTE).toISOString(),
      new Date(NOW - 30 * MINUTE).toISOString(),
      '1800',
      '0',
      '',
      '',
    ]);
  });

  it('derives the duration rather than trusting a stored one', () => {
    const paused = sessionWith({
      pauses: [{ startedAt: NOW - 50 * MINUTE, endedAt: NOW - 40 * MINUTE }],
    });
    const row = onlyRow(sessionsToCsv(contentsOf([paused]), NOW));

    expect(row[5]).toBe('1200');
    expect(row[6]).toBe('1');
  });

  it('measures a still-running session against now, so it is not left blank', () => {
    const row = onlyRow(sessionsToCsv(contentsOf([sessionWith({ endedAt: null })]), NOW));

    expect(row[4]).toBe('');
    expect(row[5]).toBe('3600');
  });

  it('names the task a session was tracked against', () => {
    const csv = sessionsToCsv(contentsOf([sessionWith({ linkedTaskId: 'task-1' })]), NOW);

    expect(csv).toContain('Ship the timer');
  });

  it('keeps the category id when the category itself is gone', () => {
    const orphan = sessionWith({ categoryId: 'deleted-category' });
    expect(onlyRow(sessionsToCsv(contentsOf([orphan]), NOW))[1]).toBe('deleted-category');
  });
});

describe('what a note can contain without breaking the file', () => {
  it('quotes a note containing a comma', () => {
    const csv = sessionsToCsv(contentsOf([sessionWith({ note: 'Fixed it, finally' })]), NOW);

    expect(csv).toContain('"Fixed it, finally"');
    expect(csvRows(csv)[1]).toHaveLength(10);
  });

  it('doubles a quote rather than ending the field early', () => {
    const csv = sessionsToCsv(contentsOf([sessionWith({ note: 'Called it "done"' })]), NOW);

    expect(csv).toContain('"Called it ""done"""');
  });

  it('quotes a note spanning lines, so the row is still one row', () => {
    const csv = sessionsToCsv(contentsOf([sessionWith({ note: 'One\nTwo' })]), NOW);

    expect(csv).toContain('"One\nTwo"');
  });

  it('leaves an ordinary note unquoted', () => {
    expect(sessionsToCsv(contentsOf([sessionWith({ note: 'Plain' })]), NOW)).toContain(',Plain');
  });
});

describe('the JSON', () => {
  it('records when it was taken, and carries the categories and tasks with it', () => {
    const parsed = JSON.parse(sessionsToJson(contentsOf([sessionWith()]), NOW)) as {
      exportedAt: string;
      sessions: unknown[];
      categories: unknown[];
      tasks: unknown[];
    };

    expect(parsed.exportedAt).toBe(new Date(NOW).toISOString());
    expect(parsed.sessions).toHaveLength(1);
    expect(parsed.categories).toEqual(CATEGORIES);
    expect(parsed.tasks).toEqual(TASKS);
  });

  it('needs no escaping rules of its own for a note that would break a CSV', () => {
    const awkward = 'Comma, "quote" and\na line';
    const parsed = JSON.parse(
      sessionsToJson(contentsOf([sessionWith({ note: awkward })]), NOW),
    ) as {
      sessions: { note: string }[];
    };

    expect(parsed.sessions[0]!.note).toBe(awkward);
  });
});

describe('the file it lands in', () => {
  it('is named for the day it was taken and the format asked for', () => {
    expect(exportFileName('csv', NOW)).toBe('tocky-2026-08-19.csv');
    expect(exportFileName('json', NOW)).toBe('tocky-2026-08-19.json');
  });

  it('picks the writer the format asks for', () => {
    const contents = contentsOf([sessionWith()]);

    expect(exportContents(contents, 'csv', NOW)).toBe(sessionsToCsv(contents, NOW));
    expect(exportContents(contents, 'json', NOW)).toBe(sessionsToJson(contents, NOW));
  });
});
