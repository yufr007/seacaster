import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group } from 'three';
import type { Bait } from '../../game/engine';
export type Pos = [number, number, number];
export function Block({ at = [0, 0, 0], size = [1, 1, 1], color = '#ffc980', rotation = [0, 0, 0] }: { at?: Pos; size?: Pos; color?: string; rotation?: Pos }) {
  return <RoundedBox args={size} radius={Math.min(...size) * .15} smoothness={2} position={at} rotation={rotation}><meshStandardMaterial color={color} roughness={.8} /></RoundedBox>;
}
export function Pebble({ at, size, color }: { at: Pos; size: Pos; color: string }) {
  return <mesh position={at} scale={size}><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color={color} flatShading roughness={1} /></mesh>;
}
export function Palm({ at, scale = 1 }: { at: Pos; scale?: number }) {
  return <group position={at} scale={scale} rotation={[0, at[0], .12]}>
    <mesh position={[0, 1.05, 0]} rotation={[0, 0, -.12]}><cylinderGeometry args={[.12, .2, 2.1, 7]} /><meshStandardMaterial color="#b9824c" /></mesh>
    {Array.from({ length: 5 }, (_, i) => <group key={i} position={[.12, 2.1, 0]} rotation={[.2, i * Math.PI * .4, .28]}><mesh position={[.55, .05, 0]} scale={[.85, .13, .32]} rotation={[0, 0, -.15]}><sphereGeometry args={[1, 8, 5]} /><meshStandardMaterial color={i % 2 ? '#54ac58' : '#86c85c'} flatShading /></mesh></group>)}
    <Pebble at={[.1, 1.9, .1]} size={[.22, .23, .22]} color="#96704a" />
  </group>;
}
export function BoatModel({ yacht = false }: { yacht?: boolean }) {
  return <group>
    <mesh position={[0, -.03, 0]} scale={[1.3, .5, 2.4]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color={yacht ? '#f3efe2' : '#e8795a'} flatShading /></mesh>
    <Block at={[0, .16, .15]} size={[2.08, .18, 3.5]} color={yacht ? '#f2cf8d' : '#ffc78a'} />
    <Block at={[-1.02, .35, .1]} size={[.14, .4, 3.5]} color={yacht ? '#f4eee1' : '#d55f47'} />
    <Block at={[1.02, .35, .1]} size={[.14, .4, 3.5]} color={yacht ? '#f4eee1' : '#d55f47'} />
    <Block at={[0, .32, 1.72]} size={[2.05, .38, .18]} color={yacht ? '#f5f2e2' : '#d55f47'} />
    <Block at={[0, .4, .8]} size={[1.85, .15, .48]} color={yacht ? '#4ca6ad' : '#964e35'} />
    {yacht && <><Block at={[0, .6, 1]} size={[1.5, .8, 1.1]} color="#fff4db" /><Block at={[0, 1.07, .94]} size={[1.3, .32, .9]} color="#366878" /><Block at={[0, 1.3, .94]} size={[1.55, .15, 1.3]} color="#f8f0db" /></>}
    {!yacht && <Block at={[-1.32, .35, .35]} size={[.1, .09, 2.9]} color="#ffe1a1" rotation={[0, .22, .13]} />}
    <mesh position={[1.08, .38, .7]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.24, .065, 6, 16]} /><meshStandardMaterial color="#ffe9bb" /></mesh>
  </group>;
}
export function BaitModel({ bait, scale = 1 }: { bait: Bait; scale?: number }) {
  return <group scale={scale}>
    {bait === 'worm' ? <><mesh rotation={[.8, 0, .4]}><torusGeometry args={[.14, .045, 6, 12, 4.9]} /><meshStandardMaterial color="#f6a69b" /></mesh><mesh position={[.06, .08, .03]}><sphereGeometry args={[.048, 7, 6]} /><meshStandardMaterial color="#ffc3ad" /></mesh></> : bait === 'shrimp' ? <><mesh rotation={[.6, 0, 0]}><torusGeometry args={[.12, .065, 6, 12, 4.4]} /><meshStandardMaterial color="#ff916c" /></mesh><mesh position={[-.12, .06, 0]} rotation={[0, 0, .7]}><coneGeometry args={[.1, .13, 3]} /><meshStandardMaterial color="#f96557" /></mesh></> : <><mesh scale={[.11, .23, .1]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#bd94dd" /></mesh>{[-.08, 0, .08].map(x => <mesh key={x} position={[x, -.23, 0]} rotation={[0, 0, -x * 3]}><cylinderGeometry args={[.025, .014, .18, 5]} /><meshStandardMaterial color="#ceade7" /></mesh>)}</>}
  </group>;
}
export function FishModel({ color = '#ffa556', size = 1, reduced = false }: { color?: string; size?: number; reduced?: boolean }) {
  const tail = useRef<Group>(null);
  useFrame(({ clock }) => { if (tail.current && !reduced) tail.current.rotation.y = Math.sin(clock.elapsedTime * 9) * .55; });
  return <group scale={size}>
    <mesh scale={[.55, .3, .24]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color={color} roughness={.6} /></mesh>
    <mesh position={[0, -.06, .015]} scale={[.46, .21, .235]}><sphereGeometry args={[1, 10, 7]} /><meshStandardMaterial color="#ffe8b9" /></mesh>
    <group ref={tail} position={[-.48, 0, 0]}><mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 1, .4]}><coneGeometry args={[.3, .45, 3]} /><meshStandardMaterial color={color} /></mesh></group>
    <mesh position={[0, .26, 0]} rotation={[0, 0, -.35]} scale={[1, 1, .3]}><coneGeometry args={[.21, .27, 3]} /><meshStandardMaterial color={color} /></mesh>
    {[-1, 1].map(side => <group key={side} position={[.27, .08, .2 * side]}><mesh><sphereGeometry args={[.115, 10, 8]} /><meshStandardMaterial color="#fff9e1" /></mesh><mesh position={[.036, .002, .065 * side]}><sphereGeometry args={[.057, 8, 6]} /><meshStandardMaterial color="#223950" /></mesh><mesh position={[.015, .04, .092 * side]}><sphereGeometry args={[.017, 6, 5]} /><meshBasicMaterial color="white" /></mesh></group>)}
  </group>;
}

export function RopeCoil({ at = [0, 0, 0], scale = 1 }: { at?: Pos; scale?: number }) {
  return <group position={at} scale={scale}>{[.16, .24, .32].map((r, i) => <mesh key={r} position={[0, i * .035, 0]} rotation={[-Math.PI / 2, 0, .15 * i]}><torusGeometry args={[r, .035, 6, 18]} /><meshStandardMaterial color={i % 2 ? '#e5c889' : '#d5b675'} roughness={1} /></mesh>)}</group>;
}
export function MooringCleat({ at = [0, 0, 0], color = '#5c7980' }: { at?: Pos; color?: string }) {
  return <group position={at}><Block at={[0, .08, 0]} size={[.12, .16, .24]} color={color} /><Block at={[0, .18, 0]} size={[.42, .09, .1]} color={color} /></group>;
}
export function Pennant({ at = [0, 0, 0], reduced = false }: { at?: Pos; reduced?: boolean }) {
  const flag = useRef<Group>(null);
  useFrame(({ clock }) => { if (flag.current) flag.current.rotation.y = reduced ? 0 : Math.sin(clock.elapsedTime * 3.4) * .08; });
  return <group position={at}><mesh position={[0, .75, 0]}><cylinderGeometry args={[.018, .025, 1.5, 6]} /><meshStandardMaterial color="#5d5b58" /></mesh><group ref={flag} position={[.27, 1.28, 0]}><mesh rotation={[0, 0, -Math.PI / 2]} scale={[.55, .8, .12]}><coneGeometry args={[.28, .65, 3]} /><meshStandardMaterial color="#fff1b6" side={2} /></mesh></group></group>;
}
export function Cushion({ at, size = [.7, .14, .8], color = '#65c5c0', rotation = [0, 0, 0] }: { at: Pos; size?: Pos; color?: string; rotation?: Pos }) {
  return <RoundedBox args={size} radius={.12} smoothness={3} position={at} rotation={rotation}><meshStandardMaterial color={color} roughness={.78} /></RoundedBox>;
}
export function DeckRail({ at, length = 2, rotation = [0, 0, 0] }: { at: Pos; length?: number; rotation?: Pos }) {
  return <group position={at} rotation={rotation}>{[-length / 2, 0, length / 2].map((x, i) => <mesh key={i} position={[x, .43, 0]}><cylinderGeometry args={[.025, .03, .86, 7]} /><meshStandardMaterial color="#e9eee9" metalness={.25} roughness={.35} /></mesh>)}<mesh position={[0, .83, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.025, .03, length, 7]} /><meshStandardMaterial color="#eef3ee" metalness={.3} roughness={.3} /></mesh></group>;
}
