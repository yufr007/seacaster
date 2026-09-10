import { useEffect, useRef } from 'react';
import type { PointerEvent, MutableRefObject } from 'react';
import { swipeCast } from '../game/world';
import type { WorldMotion } from './world/types';

/** One captured pointer. Cancellation never consumes bait or creates a cast. */
export function useCastGesture(enabled: boolean, motion: MutableRefObject<WorldMotion>, onCast: () => void) {
  const drag = useRef<{ id: number; x: number; y: number; width: number; height: number; target: HTMLElement } | null>(null);
  const clear = (target: HTMLElement) => { drag.current = null; motion.current.charge = 0; target.style.setProperty('--cast-charge', '0'); target.removeAttribute('data-dragging'); };
  useEffect(() => {
    const cancel = () => { if (drag.current) clear(drag.current.target); };
    const visibility = () => { if (document.hidden) cancel(); };
    if (!enabled) cancel();
    window.addEventListener('blur', cancel); document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', visibility); cancel(); };
  }, [enabled]);
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (!enabled || !e.isPrimary || e.button !== 0 || drag.current || (e.target as HTMLElement).closest('button,input,a,select')) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, width: innerWidth, height: innerHeight, target: e.currentTarget };
      e.currentTarget.setAttribute('data-dragging', 'true');
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current; if (!d || d.id !== e.pointerId) return;
      const charge = Math.min(1, Math.max(0, (d.y - e.clientY) / (d.height * .25)));
      motion.current.charge = charge;
      motion.current.aim = Math.max(-1, Math.min(1, (e.clientX - d.x) / (d.width * .3)));
      e.currentTarget.style.setProperty('--cast-charge', String(charge));
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current; if (!d || d.id !== e.pointerId) return;
      const result = enabled ? swipeCast(e.clientX - d.x, e.clientY - d.y, d.width, d.height) : null;
      clear(e.currentTarget);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      if (result) { motion.current.power = result.power; motion.current.aim = result.aim; onCast(); }
    },
    onPointerCancel: (e: PointerEvent<HTMLElement>) => { if (drag.current?.id === e.pointerId) clear(e.currentTarget); },
    onLostPointerCapture: (e: PointerEvent<HTMLElement>) => { if (drag.current?.id === e.pointerId) clear(e.currentTarget); },
  };
}
