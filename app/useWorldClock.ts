import { useEffect, useMemo, useState } from 'react';
import { skyAtHour } from '../game/world';
export function useWorldClock(moonlit: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  const sky = useMemo(() => skyAtHour(moonlit ? 23 : now.getHours() + now.getMinutes() / 60), [now, moonlit]);
  return {
    sky,
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
