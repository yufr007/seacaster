import { useCallback } from 'react';

// Mixkit free sound effects - royalty-free for commercial use
const SOUNDS: Record<string, string> = {
  // Fishing
  cast: 'https://assets.mixkit.co/active_storage/sfx/2060/2060-preview.m4a', // Swoosh
  splash: 'https://assets.mixkit.co/active_storage/sfx/1113/1113-preview.m4a', // Water splash
  reel: 'https://assets.mixkit.co/active_storage/sfx/2059/2059-preview.m4a', // Mechanical clicking
  reelSpin: 'https://assets.mixkit.co/active_storage/sfx/2635/2635-preview.m4a', // Fast reel winding

  // Catches by rarity
  catch_common: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.m4a', // Simple pop
  catch_rare: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.m4a', // Nice reward
  catch_epic: 'https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.m4a', // Magic sparkle
  catch_legendary: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.m4a', // Magical reveal
  catch_mythic: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.m4a', // Epic fanfare

  // Progress
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.m4a', // Win chime
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.m4a', // Fanfare
  xpGain: 'https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.m4a', // Coin/XP
  coinCollect: 'https://assets.mixkit.co/active_storage/sfx/888/888-preview.m4a', // Coin

  // UI
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.m4a', // UI Click
  buttonTap: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.m4a', // Soft tap

  // Battle
  bossRoar: 'https://assets.mixkit.co/active_storage/sfx/1056/1056-preview.m4a', // Monster growl
  victory: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.m4a', // Victory fanfare
  defeat: 'https://assets.mixkit.co/active_storage/sfx/2039/2039-preview.m4a', // Sad trombone

  // Tournament
  countdown: 'https://assets.mixkit.co/active_storage/sfx/918/918-preview.m4a', // Countdown tick
  tournamentStart: 'https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.m4a', // Start horn
};

// Volume by category
const VOLUME_MAP: Record<string, number> = {
  catch_mythic: 0.8,
  catch_legendary: 0.7,
  levelUp: 0.7,
  victory: 0.7,
  bossRoar: 0.6,
  default: 0.5,
};

export const useSound = () => {
  const play = useCallback((soundName: string, volumeOverride?: number) => {
    const url = SOUNDS[soundName];
    if (!url) return;

    try {
      const audio = new Audio(url);
      audio.volume = volumeOverride ?? VOLUME_MAP[soundName] ?? VOLUME_MAP.default;
      audio.play().catch(() => { }); // Ignore autoplay errors
    } catch (e) {
      // Fail silently
    }
  }, []);

  const playCatch = useCallback((rarity: string) => {
    const r = rarity.toLowerCase();
    if (r === 'mythic') play('catch_mythic');
    else if (r === 'legendary') play('catch_legendary');
    else if (r === 'epic') play('catch_epic');
    else if (r === 'rare') play('catch_rare');
    else play('catch_common');
  }, [play]);

  return { play, playCatch };
};