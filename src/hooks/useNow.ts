import { useEffect, useState } from 'react';

export function useNow(tickIntervalMs: number | null): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (tickIntervalMs === null) return;

    // Catch up before the first interval fires, or the clock shows the time it
    // stopped ticking at for a whole tick after it starts again.
    const catchUp = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), tickIntervalMs);

    return () => {
      clearTimeout(catchUp);
      clearInterval(timer);
    };
  }, [tickIntervalMs]);

  return now;
}
