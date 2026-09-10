import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { PackageOpen } from 'lucide-react';
import type { Group } from 'three';
import type { WorldProps } from './types';
import { Block, Pebble, BoatModel, BaitModel } from './Props';
export function Platform({ platform, reduced, baitOpen, onBait, home, sky }: Pick<WorldProps, 'platform' | 'reduced' | 'baitOpen' | 'onBait' | 'home' | 'sky'>) {
  const portrait = useThree(s => s.size.width < s.size.height);
  const deck = useRef<Group>(null), lid = useRef<Group>(null);
  useFrame(({ clock }, dt) => {
    if (deck.current && (platform === 'boat' || platform === 'yacht')) { deck.current.position.y = reduced ? 0 : Math.sin(clock.elapsedTime * 1.2) * .04; deck.current.rotation.z = reduced ? 0 : Math.sin(clock.elapsedTime * .9) * .008; }
    if (lid.current && reduced) lid.current.rotation.x = baitOpen ? -1.8 : -.18;
    else if (lid.current) lid.current.rotation.x += ((baitOpen ? -1.8 : -.18) - lid.current.rotation.x) * (1 - Math.exp(-12 * Math.min(dt, .1)));
  });
  return <group ref={deck} position={[0, 0, portrait ? -3 : -1]}>
    {platform === 'boat' || platform === 'yacht' ? <group position={[0, -.1, 5.2]} scale={[2.1, 1.8, 2.2]} rotation={[0, Math.PI, 0]}><BoatModel yacht={platform === 'yacht'} /></group> : <group position={[0, .02, 5.5]}>
      {Array.from({ length: 12 }, (_, i) => <Block key={i} at={[-2.2 + i * .4, .02, .4]} size={[.38, .22, 4.7]} color={i % 3 === 0 ? '#c78d50' : '#e7b16b'} />)}
      {[-2.4, 2.4].map(x => <group key={x} position={[x, 0, -1.8]}><mesh position={[0, .2, 0]}><cylinderGeometry args={[.19, .21, 1.8, 8]} /><meshStandardMaterial color="#a86b42" /></mesh><Block at={[0, 1.08, 0]} size={[.49, .14, .49]} color="#edc487" /><mesh position={[0, .7, 0]}><torusGeometry args={[.22, .045, 5, 12]} /><meshStandardMaterial color="#f3d79c" /></mesh></group>)}
      {platform === 'river' && <><Pebble at={[-3.2, -.12, 1.8]} size={[1.8, .6, 3]} color="#94c178" /><Pebble at={[3.5, -.1, 2]} size={[1.6, .6, 3]} color="#92bb80" /></>}
    </group>}
    <group position={[-1.15, .4, 3.5]} rotation={[0, .16, 0]}>
      <Block size={[1.08, .5, .74]} color="#377f7d" />
      <Block at={[0, .27, 0]} size={[.91, .045, .61]} color="#213e45" />
      {[-.3, 0, .3].map((x, i) => <group key={x} position={[x, .36, 0]}><BaitModel bait={(['worm', 'shrimp', 'squid'] as const)[i]} scale={.7} /></group>)}
      <group ref={lid} position={[0, .27, -.34]}><Block at={[0, .05, .32]} size={[1.13, .14, .79]} color="#52a498" /><Block at={[0, .135, .35]} size={[.35, .035, .18]} color="#ebcf8b" /></group>
      <Block at={[0, .05, .39]} size={[.15, .2, .05]} color="#edcb80" />
      {!home && <Html position={[0, .95, .2]} center zIndexRange={[9, 1]}><button className="world-bait-button" aria-label="Open bait box" onClick={e => { e.stopPropagation(); onBait(); }}><PackageOpen size={16} /><span>Bait box</span></button></Html>}
    </group>
    <group position={[1.85, .18, 3.7]}>
      <mesh position={[0, .28, 0]}><cylinderGeometry args={[.3, .23, .5, 12]} /><meshStandardMaterial color="#51959f" metalness={.2} roughness={.5} /></mesh>
      <mesh position={[0, .56, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.3, .045, 5, 16]} /><meshStandardMaterial color="#f6d89a" /></mesh>
    </group>
    <group position={[-2, .25, 5.1]}><mesh position={[0, .35, 0]}><cylinderGeometry args={[.18, .21, .7, 6]} /><meshStandardMaterial color="#394b55" /></mesh><Block at={[0, .48, 0]} size={[.31, .35, .3]} color={sky.daylight < .5 ? '#ffc567' : '#ffe2a0'} /><mesh position={[0, .76, 0]}><coneGeometry args={[.3, .2, 6]} /><meshStandardMaterial color="#33535d" /></mesh>{sky.daylight < .5 && <pointLight color="#ffb956" intensity={2} distance={3} />}</group>
  </group>;
}
