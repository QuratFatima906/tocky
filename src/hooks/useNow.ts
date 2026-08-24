import { useEffect, useState } from 'react';

export function useNow(tickIntervalMs: number): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), tickIntervalMs);
    return () => clearInterval(timer);
  }, [tickIntervalMs]);

  return now;
}
