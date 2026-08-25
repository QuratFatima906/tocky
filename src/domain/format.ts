import { daysBetween } from './calendar';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

function splitDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));

  return {
    hours: Math.floor(safeSeconds / SECONDS_PER_HOUR),
    minutes: Math.floor((safeSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    seconds: safeSeconds % SECONDS_PER_MINUTE,
  };
}

function padTwoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDuration(totalSeconds: number): string {
  const { hours, minutes, seconds } = splitDuration(totalSeconds);

  if (hours > 0) return `${hours}h ${padTwoDigits(minutes)}m`;
  if (minutes > 0) return `${minutes}m`;
  return seconds > 0 ? `${seconds}s` : '0m';
}

export function formatElapsed(totalSeconds: number): string {
  const { hours, minutes, seconds } = splitDuration(totalSeconds);

  return hours > 0
    ? `${hours}:${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`
    : `${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`;
}

export function formatDurationForSpeech(totalSeconds: number): string {
  const { hours, minutes, seconds } = splitDuration(totalSeconds);
  const parts = [
    hours > 0 && `${hours} ${hours === 1 ? 'hour' : 'hours'}`,
    minutes > 0 && `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`,
  ].filter((part): part is string => part !== false);

  if (parts.length > 0) return parts.join(' ');
  return seconds > 0 ? `${seconds} ${seconds === 1 ? 'second' : 'seconds'}` : '0 minutes';
}

export function formatComparedToYesterday(deltaSeconds: number): string {
  if (Math.abs(deltaSeconds) < SECONDS_PER_MINUTE) return 'same as yesterday';
  const sign = deltaSeconds > 0 ? '+' : '−';
  return `${sign}${formatDuration(Math.abs(deltaSeconds))} vs yesterday`;
}

export function formatComparedToLastWeek(deltaSeconds: number): string {
  if (Math.abs(deltaSeconds) < SECONDS_PER_MINUTE) return 'same as last week';

  return `${formatDuration(Math.abs(deltaSeconds))} ${deltaSeconds > 0 ? 'more' : 'less'} than last week`;
}

export function formatClockTime(timestamp: number, locale?: string): string {
  return new Date(timestamp).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

export function formatSessionRange(
  startedAt: number,
  endedAt: number | null,
  locale?: string,
): string {
  const start = formatClockTime(startedAt, locale);
  return endedAt === null ? `${start} – now` : `${start} – ${formatClockTime(endedAt, locale)}`;
}

const DAYS_NAMED_RELATIVELY = ['Today', 'Yesterday'] as const;

export function relativeDayLabel(timestamp: number, now: number, locale?: string): string | null {
  const daysBack = daysBetween(timestamp, now);
  if (daysBack === 0) return null;

  return DAYS_NAMED_RELATIVELY[daysBack] ?? formatDayAndMonth(timestamp, locale);
}

function formatDayAndMonth(timestamp: number, locale?: string): string {
  return new Date(timestamp).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export function dayGroupHeading(timestamp: number, now: number, locale?: string): string {
  return DAYS_NAMED_RELATIVELY[daysBetween(timestamp, now)] ?? formatDayHeading(timestamp, locale);
}

export function formatWeekday(timestamp: number, locale?: string): string {
  return new Date(timestamp).toLocaleDateString(locale, { weekday: 'long' });
}

export function formatDayHeading(timestamp: number, locale?: string): string {
  return `${formatWeekday(timestamp, locale)}, ${formatDayAndMonth(timestamp, locale)}`;
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return 'Late night';
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}
