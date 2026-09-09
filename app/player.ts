import { create } from 'zustand';
import { newProfile, validateProfile } from '../game/engine.ts';
import type { Profile } from '../game/engine.ts';
const KEY = 'seacaster:guest:v2';
function guest(): Profile {
  try { return validateProfile(JSON.parse(localStorage.getItem(KEY) ?? 'null')); }
  catch { return newProfile(); }
}
type PlayerState = {
  profile: Profile; address: string | null; connected: string | null; revision: number;
  notice: string; passActive: boolean; goldSkin: boolean; night: boolean; sound: boolean; lowPower: boolean;
  setProfile: (profile: Profile) => void;
  authenticate: (address: string, profile: Profile) => void;
  walletChanged: (address: string | null) => void;
  guestMode: () => void;
  notify: (message: string) => void;
  settings: (value: Partial<Pick<PlayerState, 'night' | 'sound' | 'lowPower' | 'passActive' | 'goldSkin'>>) => void;
};
export const usePlayer = create<PlayerState>((set, get) => ({
  profile: guest(), address: null, connected: null, revision: 0,
  notice: '', passActive: false, goldSkin: false, night: false, sound: false, lowPower: false,
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
  settings: value => set(value),
}));
