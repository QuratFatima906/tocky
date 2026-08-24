import {
  formatClockTime,
  formatComparedToYesterday,
  formatDayHeading,
  formatDuration,
  formatDurationForSpeech,
  formatElapsed,
  formatSessionRange,
  greetingForHour,
  relativeDayLabel,
} from '../format';

describe('formatDuration', () => {
  it.each([
    [0, '0m'],
    [1, '1s'],
    [59, '59s'],
    [60, '1m'],
    [3599, '59m'],
    [3600, '1h 00m'],
    [15_480, '4h 18m'],
    [-90, '0m'],
    [90.9, '1m'],
  ])('renders %i seconds as %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe('formatElapsed', () => {
  it.each([
    [0, '00:00'],
    [61, '01:01'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [6138, '1:42:18'],
    [-5, '00:00'],
  ])('renders %i seconds as %s', (seconds, expected) => {
    expect(formatElapsed(seconds)).toBe(expected);
  });
});

describe('formatDurationForSpeech', () => {
  it.each([
    [0, '0 minutes'],
    [1, '1 second'],
    [45, '45 seconds'],
    [60, '1 minute'],
    [3600, '1 hour'],
    [15_480, '4 hours 18 minutes'],
    [7200, '2 hours'],
  ])('reads %i seconds as "%s"', (seconds, expected) => {
    expect(formatDurationForSpeech(seconds)).toBe(expected);
  });
});

describe('formatComparedToYesterday', () => {
  it.each([
    [1320, '+22m vs yesterday'],
    [-1320, '−22m vs yesterday'],
    [0, 'same as yesterday'],
    [59, 'same as yesterday'],
    [-59, 'same as yesterday'],
    [7380, '+2h 03m vs yesterday'],
  ])('renders a delta of %i seconds as "%s"', (seconds, expected) => {
    expect(formatComparedToYesterday(seconds)).toBe(expected);
  });
});

describe('clock and date formatting', () => {
  const MORNING = new Date(2026, 7, 19, 9, 12).getTime();
  const LATER = new Date(2026, 7, 19, 10, 36).getTime();

  it('renders a clock time in the given locale', () => {
    expect(formatClockTime(MORNING, 'en-US')).toBe('9:12 AM');
    expect(formatClockTime(MORNING, 'en-GB')).toBe('9:12');
  });

  it('renders a finished session as a start-to-end range', () => {
    expect(formatSessionRange(MORNING, LATER, 'en-GB')).toBe('9:12 – 10:36');
  });

  it('renders a running session as running until now', () => {
    expect(formatSessionRange(MORNING, null, 'en-GB')).toBe('9:12 – now');
  });

  it('renders a day heading with weekday, day and short month', () => {
    expect(formatDayHeading(MORNING, 'en-GB')).toBe('Wednesday, 19 Aug');
  });
});

describe('greetingForHour', () => {
  it.each([
    [0, 'Late night'],
    [4, 'Late night'],
    [5, 'Morning'],
    [11, 'Morning'],
    [12, 'Afternoon'],
    [17, 'Afternoon'],
    [18, 'Evening'],
    [23, 'Evening'],
  ])('greets hour %i with "%s"', (hour, expected) => {
    expect(greetingForHour(hour)).toBe(expected);
  });
});

describe('relativeDayLabel', () => {
  const NOW = new Date(2026, 7, 19, 12, 0).getTime();

  it('leaves today unlabelled', () => {
    expect(relativeDayLabel(new Date(2026, 7, 19, 0, 5).getTime(), NOW)).toBeNull();
  });

  it('names yesterday', () => {
    expect(relativeDayLabel(new Date(2026, 7, 18, 23, 55).getTime(), NOW)).toBe('Yesterday');
  });

  it('dates anything older', () => {
    expect(relativeDayLabel(new Date(2026, 7, 15, 9, 0).getTime(), NOW, 'en-GB')).toBe('15 Aug');
  });
});
