import { useCallback, useEffect, useRef, useState } from 'react';
import { createCast, hookCast, finishCast } from '../game/cast.ts';
import type { Cast, CastView } from '../game/cast.ts';
import { newReel, stepReel } from '../game/engine.ts';
import type { Catch, Profile, Reel, ReelInput } from '../game/engine.ts';
import { usePlayer } from './player';
import { api } from './api';
export type Phase = 'idle' | 'casting' | 'waiting' | 'bite' | 'reeling' | 'saving' | 'caught' | 'lost';
const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000;
/** Transient fishing state never becomes the persisted player profile. */
export function useFishing() {
  const revision = usePlayer(s => s.revision);
  const [phase, setPhase] = useState<Phase>('idle');
  const [reel, setReel] = useState<Reel>(newReel);
  const [caught, setCaught] = useState<Catch | null>(null);
  const [holding, setHolding] = useState(false);
  const state = useRef<{ cast: Cast | CastView | null; seed: number; reel: Reel; inputs: ReelInput[]; hold: boolean; start: number; offset: number }>({ cast: null, seed: 0, reel: newReel(), inputs: [], hold: false, start: 0, offset: 0 });
  const generation = useRef(0);
  const pendingCancel = useRef<Promise<unknown>>(Promise.resolve());
  const phaseRef = useRef<Phase>('idle');
  const change = useCallback((value: Phase) => { phaseRef.current = value; setPhase(value); }, []);
  const release = useCallback(() => { state.current.hold = false; setHolding(false); }, []);
  const reset = useCallback(() => {
    generation.current++;
    const { address } = usePlayer.getState(), current = state.current.cast;
    if (address && current) pendingCancel.current = pendingCancel.current.then(() => api(`/casts/${current.id}/cancel`, {}, address)).catch(() => {});
    state.current.cast = null; release(); setCaught(null); setReel(newReel()); change('idle');
  }, [change, release]);
  useEffect(() => { reset(); }, [revision, reset]);
  useEffect(() => {
    const blur = () => { release(); if (['casting', 'waiting', 'bite', 'reeling'].includes(phaseRef.current)) { generation.current++; change('lost'); usePlayer.getState().notify('Cast paused when you left the game. Cast again when ready.'); } };
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
    return () => { generation.current++; window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); };
  }, [change, release]);
  const cast = useCallback(async () => {
    if (!['idle', 'lost', 'caught'].includes(phaseRef.current)) return;
    reset(); const ticket = generation.current;
    change('casting'); 
    const { profile, address } = usePlayer.getState();
    try {
      if (address) {
        await pendingCancel.current;
        if (ticket !== generation.current) return;
        const before = Date.now();
        const result = await api<{ cast: CastView; profile: Profile; serverTime: number }>('/casts', {}, address);
        if (ticket !== generation.current) return;
        state.current.offset = result.serverTime - (before + Date.now()) / 2;
        state.current.cast = result.cast; usePlayer.getState().setProfile(result.profile);
      } else {
        const result = createCast(profile, Date.now(), [random(), random(), random()], crypto.randomUUID());
        state.current.offset = 0; state.current.cast = result.cast; usePlayer.getState().setProfile(result.profile);
      }
      change('waiting');
    } catch (error) { if (ticket === generation.current) { change('idle'); usePlayer.getState().notify(error instanceof Error ? error.message : 'Could not cast.'); } }
  }, [change, reset]);
  const hook = useCallback(async () => {
    if (phaseRef.current !== 'bite' || !state.current.cast) return;
    change('casting'); const ticket = generation.current;
    const { address } = usePlayer.getState();
    try {
      if (address) {
        const result = await api<{ seed: number }>(`/casts/${state.current.cast.id}/hook`, {}, address);
        if (ticket !== generation.current) return;
        state.current.seed = result.seed;
      } else {
        const hooked = hookCast(state.current.cast as Cast, Date.now(), Math.floor(random() * 0x100000000));
        state.current.cast = hooked; state.current.seed = hooked.seed!;
      }
      state.current.reel = newReel(); state.current.inputs = [{ at: 0, hold: false }];
      state.current.hold = false; state.current.start = performance.now();
      setHolding(false); setReel(newReel()); change('reeling');
    } catch (error) { if (ticket === generation.current) { change('lost'); usePlayer.getState().notify(error instanceof Error ? error.message : 'Missed the bite.'); } }
  }, [change]);
  useEffect(() => {
    let raf = 0, lastPaint = 0;
    const tick = (now: number) => {
      const current = state.current, currentPhase = phaseRef.current;
      if (current.cast && (currentPhase === 'waiting' || currentPhase === 'bite')) {
        const time = Date.now() + current.offset;
        if (time > current.cast.expiresAt) change('lost');
        else if (time >= current.cast.biteAt && currentPhase === 'waiting') { change('bite'); usePlayer.getState().haptics && navigator.vibrate?.(80); }
      }
      if (currentPhase === 'reeling') {
        const target = Math.min(30000, now - current.start);
        while (current.reel.elapsed + 20 <= target && current.reel.status === 'playing') {
          const last = current.inputs[current.inputs.length - 1];
          if (last.hold !== current.hold) {
            if (last.at === current.reel.elapsed) last.hold = current.hold;
            else current.inputs.push({ at: current.reel.elapsed, hold: current.hold });
          }
          current.reel = stepReel(current.reel, current.hold, current.seed);
        }
        if (now - lastPaint > 32 || current.reel.status !== 'playing') { setReel(current.reel); lastPaint = now; }
        if (current.reel.status === 'lost') { release(); change('lost'); }
        if (current.reel.status === 'won' && current.cast) {
          release(); change('saving'); const ticket = generation.current;
          const { address, profile } = usePlayer.getState();
          const finish = async () => {
            try {
              const result = address
                ? await api<{ profile: Profile; catch: Catch }>(`/casts/${current.cast!.id}/finish`, { inputs: current.inputs, duration: current.reel.elapsed }, address)
                : finishCast(profile, current.cast as Cast, current.inputs, current.reel.elapsed, Date.now());
              if (ticket !== generation.current) return;
              usePlayer.getState().setProfile(result.profile); setCaught(result.catch); change('caught'); usePlayer.getState().haptics && navigator.vibrate?.([40, 30, 80]);
            } catch (error) { if (ticket === generation.current) { change('lost'); usePlayer.getState().notify(error instanceof Error ? error.message : 'Catch could not be saved.'); } }
          };
          void finish();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [change, release]);
  const hold = useCallback((value: boolean) => {
    if (phaseRef.current !== 'reeling') return;
    state.current.hold = value; setHolding(value);
  }, []);
  return { phase, reel, caught, holding, cast, hook, hold, reset };
}
