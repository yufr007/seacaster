import { useEffect, useRef } from 'react';
import type { PointerEvent, MutableRefObject } from 'react';
import { castDrag } from '../game/world';
import type { WorldMotion } from './world/types';

/** One captured pointer. Cancellation never consumes bait or creates a cast. */
export function useCastGesture(enabled: boolean, motion: MutableRefObject<WorldMotion>, onCast: () => void) {
  const drag = useRef<{ id: number; x: number; y: number; width: number; height: number; target: HTMLElement } | null>(null);
  const clear = (target: HTMLElement) => {
    drag.current = null; motion.current.charge = 0; motion.current.preview = null;
    target.style.setProperty('--cast-charge', '0'); target.removeAttribute('data-dragging'); target.removeAttribute('data-cast-ready');
  };
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
      motion.current.preview = null;
      e.currentTarget.setAttribute('data-dragging', 'true');
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current; if (!d || d.id !== e.pointerId) return;
      const projection = castDrag(e.clientX - d.x, e.clientY - d.y, d.width, d.height);
      motion.current.charge = projection.charge;
      motion.current.preview = projection.preview;
      if (projection.preview) { motion.current.power = projection.preview.power; motion.current.aim = projection.preview.aim; }
      else motion.current.aim = Math.max(-1, Math.min(1, (e.clientX - d.x) / (d.width * .3)));
      e.currentTarget.style.setProperty('--cast-charge', String(projection.charge));
      if (projection.preview) e.currentTarget.setAttribute('data-cast-ready', 'true'); else e.currentTarget.removeAttribute('data-cast-ready');
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current; if (!d || d.id !== e.pointerId) return;
      const result = enabled ? castDrag(e.clientX - d.x, e.clientY - d.y, d.width, d.height).preview : null;
      clear(e.currentTarget);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      if (result) { motion.current.power = result.power; motion.current.aim = result.aim; onCast(); }
    },
    onPointerCancel: (e: PointerEvent<HTMLElement>) => { if (drag.current?.id === e.pointerId) clear(e.currentTarget); },
    onLostPointerCapture: (e: PointerEvent<HTMLElement>) => { if (drag.current?.id === e.pointerId) clear(e.currentTarget); },
  };
}
