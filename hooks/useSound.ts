import { useCallback } from 'react';

// Using a free sound pack placeholder or data URIs for production
// In a real app, these would be local assets
const SOUNDS = {
  cast: 'https://assets.mixkit.co/active_storage/sfx/2060/2060-preview.m4a', // Swoosh
  splash: 'https://assets.mixkit.co/active_storage/sfx/1113/1113-preview.m4a', // Water splash
  reel: 'https://assets.mixkit.co/active_storage/sfx/2059/2059-preview.m4a', // Mechanical clicking
  reelSpin: 'https://assets.mixkit.co/active_storage/sfx/2635/2635-preview.m4a', // Fast reel winding
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.m4a', // Win chime
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.m4a', // Fanfare
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.m4a', // UI Click
};

export const useSound = () => {
  const play = useCallback((soundName: keyof typeof SOUNDS) => {
    try {
      const audio = new Audio(SOUNDS[soundName]);
      audio.volume = 0.5;
      audio.play().catch(e => console.warn("Audio play failed (interaction needed)", e));
    } catch (e) {
      console.error("Audio error", e);
    }
  }, []);

  return { play };
};