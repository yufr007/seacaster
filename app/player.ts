import { create } from 'zustand';
import { newProfile, validateProfile } from '../game/engine.ts';
import type { Profile } from '../game/engine.ts';
const KEY = 'seacaster:guest:v2';
const SETTINGS = 'seacaster:comfort:v1';
function comfort() {
  try { const s = JSON.parse(localStorage.getItem(SETTINGS) ?? '{}'); return { sound: s.sound === true, lowPower: s.lowPower === true, ambience: typeof s.ambience === 'number' ? Math.max(0, Math.min(1, s.ambience)) : .55, effects: typeof s.effects === 'number' ? Math.max(0, Math.min(1, s.effects)) : .7, haptics: s.haptics !== false }; }
  catch { return { sound: false, lowPower: false, ambience: .55, effects: .7, haptics: true }; }
}
function guest(): Profile {
  try { return validateProfile(JSON.parse(localStorage.getItem(KEY) ?? 'null')); }
  catch { return newProfile(); }
}
type PlayerState = {
  profile: Profile; address: string | null; connected: string | null; revision: number;
  notice: string; passActive: boolean; goldSkin: boolean; night: boolean; sound: boolean; lowPower: boolean; ambience: number; effects: number; haptics: boolean;
  setProfile: (profile: Profile) => void;
  authenticate: (address: string, profile: Profile) => void;
  walletChanged: (address: string | null) => void;
  guestMode: () => void;
  notify: (message: string) => void;
  settings: (value: Partial<Pick<PlayerState, 'night' | 'sound' | 'lowPower' | 'passActive' | 'goldSkin' | 'ambience' | 'effects' | 'haptics'>>) => void;
};
export const usePlayer = create<PlayerState>((set, get) => ({
  profile: guest(), address: null, connected: null, revision: 0,
  notice: '', passActive: false, goldSkin: false, night: false, ...comfort(),
  setProfile: profile => {
    if (!get().address) {
      try { localStorage.setItem(KEY, JSON.stringify(profile)); }
      catch { set({ notice: 'Storage is unavailable. This guest session will not survive a reload.' }); }
    }
    set({ profile });
  },
  authenticate: (address, profile) => set(s => ({ address: address.toLowerCase(), profile, revision: s.revision + 1 })),
  walletChanged: address => {
    const normalized = address?.toLowerCase() ?? null;
    if (normalized === get().connected) return;
    set(s => ({ connected: normalized, address: null, profile: guest(), revision: s.revision + 1, night: false, passActive: false, goldSkin: false }));
  },
  guestMode: () => set(s => ({ address: null, profile: guest(), revision: s.revision + 1, night: false, passActive: false, goldSkin: false })),
  notify: notice => set({ notice }),
  settings: value => {
    set(value); const { sound, lowPower, ambience, effects, haptics } = get();
    try { localStorage.setItem(SETTINGS, JSON.stringify({ sound, lowPower, ambience, effects, haptics })); } catch { /* Settings are optional; never persist economic flags. */ }
  },
}));
