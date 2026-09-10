import { useEffect } from 'react';
import { oceanAudio } from './audio';
import { usePlayer } from './player';
import type { Phase } from './useFishing';
import type { PlatformId } from '../game/world';
export function enableSound(enabled: boolean) {
  usePlayer.getState().settings({ sound: enabled });
  oceanAudio.configure(usePlayer.getState()); oceanAudio.unlock();
}
export function useSoundscape(phase: Phase, holding: boolean, night: boolean, platform: PlatformId, castAt: number) {
  const sound = usePlayer(s => s.sound), ambience = usePlayer(s => s.ambience), effects = usePlayer(s => s.effects);
  useEffect(() => { oceanAudio.configure({ sound, ambience, effects }); }, [sound, ambience, effects]);
  useEffect(() => { oceanAudio.environment(night, platform); }, [night, platform]);
  useEffect(() => { oceanAudio.reeling(phase === 'reeling' && holding); }, [phase, holding]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (phase === 'waiting') timer = setTimeout(() => oceanAudio.cue('splash'), Math.max(0, 820 - (performance.now() - castAt)));
    if (phase === 'bite') oceanAudio.cue('hook');
    if (phase === 'caught') { oceanAudio.cue('splash'); timer = setTimeout(() => oceanAudio.cue('catch'), 500); }
    if (phase === 'lost') oceanAudio.cue('lost');
    return () => clearTimeout(timer);
  }, [phase, castAt]);
  useEffect(() => {
    const unlock = () => oceanAudio.unlock();
    const visibility = () => { if (document.hidden) oceanAudio.suspend(); else oceanAudio.unlock(); };
    window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); document.removeEventListener('visibilitychange', visibility); oceanAudio.dispose(); };
  }, []);
}
