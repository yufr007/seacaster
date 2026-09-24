import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { PackageOpen } from 'lucide-react';
import type { Group } from 'three';
import type { WorldProps } from './types';
import { BaitModel } from './Props';
import { ArtChest, ArtObject } from './ArtModels';
import { platformAtmosphere } from '../../game/world';
export function Platform({ platform, reduced, baitOpen, onBait, home, sky }: Pick<WorldProps, 'platform' | 'reduced' | 'baitOpen' | 'onBait' | 'home' | 'sky'>) {
  const portrait = useThree(s => s.size.width < s.size.height);
  const deck = useRef<Group>(null);
  const mood = platformAtmosphere(platform);
  useFrame(({ clock }) => {
    if (!deck.current) return;
    deck.current.position.y = reduced ? 0 : Math.sin(clock.elapsedTime * 1.2) * mood.rock;
    deck.current.rotation.z = reduced ? 0 : Math.sin(clock.elapsedTime * .9) * mood.rock * .2;
  });
  return <group ref={deck} position={[0, 0, portrait ? -3 : -1]}>
    <ArtObject name={platform === 'boat' ? 'Skiff' : platform === 'yacht' ? 'Yacht' : 'Pier'} />
    <group position={[-1.15, .43, 4.02]} rotation={[0, .16, 0]}>
      <ArtChest open={baitOpen} reduced={reduced}>
        {baitOpen && <group position={[0, .36, 0]}>{[-.3, 0, .3].map((x, i) => <group key={x} position={[x, 0, 0]}><BaitModel bait={(['worm', 'shrimp', 'squid'] as const)[i]} scale={.7} /></group>)}</group>}
        {!home && <Html position={[0, .85, .2]} center zIndexRange={[9, 1]}><button className="world-bait-button" aria-label="Open bait box" onClick={e => { e.stopPropagation(); onBait(); }}><PackageOpen size={16} /><span>Bait box</span></button></Html>}
      </ArtChest>
    </group>
    {sky.daylight < .5 && <pointLight position={[-1.8, 1.2, 5]} color="#ffc382" intensity={1.2} distance={4} />}
  </group>;
}
