import type { MutableRefObject } from 'react';
import type { Bait } from '../../game/engine';
import type { CastGesture, skyAtHour, PlatformId } from '../../game/world';
import type { Phase } from '../useFishing';
export type WorldMotion = {
  charge: number; aim: number; power: number; preview: CastGesture | null; castAt: number;
  bait: Bait; tension: number; progress: number; holding: boolean;
};
export const newMotion = (): WorldMotion => ({ charge: 0, aim: 0, power: .6, preview: null, castAt: -10000, bait: 'worm', tension: .35, progress: 0, holding: false });
export type WorldProps = {
  phase: Phase; platform: PlatformId; motion: MutableRefObject<WorldMotion>;
  sky: ReturnType<typeof skyAtHour>; home: boolean; reduced: boolean;
  baitOpen: boolean; onBait: () => void; species?: string;
};
