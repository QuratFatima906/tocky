const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((safeSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);

  if (hours === 0 && minutes === 0) return `${safeSeconds % SECONDS_PER_MINUTE}s`;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function formatElapsed(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((safeSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const remainder = safeSeconds % SECONDS_PER_MINUTE;
  const pad = (value: number) => String(value).padStart(2, '0');

  return hours === 0
    ? `${pad(minutes)}:${pad(remainder)}`
    : `${hours}:${pad(minutes)}:${pad(remainder)}`;
}

export function formatDelta(seconds: number): string {
  if (seconds === 0) return 'same as yesterday';
  const direction = seconds > 0 ? '+' : '−';
  return `${direction}${formatDuration(Math.abs(seconds))} vs yesterday`;
}

export function formatClockTime(timestamp: number, locale?: string): string {
  return new Date(timestamp).toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatSessionRange(startedAt: number, endedAt: number | null): string {
  const start = formatClockTime(startedAt);
  return endedAt === null ? `${start} – now` : `${start} – ${formatClockTime(endedAt)}`;
}

export function formatFullDate(timestamp: number, locale?: string): string {
  return new Date(timestamp).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return 'Late night';
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}
