import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, Group, ShaderMaterial, BackSide } from 'three';
import type { WorldProps } from './types';
import { Block, Pebble, Palm, BoatModel, FishModel } from './Props';

function Sky({ sky, reduced }: Pick<WorldProps, 'sky' | 'reduced'>) {
  const uniforms = useMemo(() => ({ top: { value: new Color('#61bbef') }, bottom: { value: new Color('#c5efef') } }), []);
  const day = sky.daylight;
  uniforms.top.value.set('#15284c').lerp(new Color('#67c5ed'), day).lerp(new Color('#d790ac'), sky.warmth * .25);
  uniforms.bottom.value.set('#426b84').lerp(new Color('#dcf6e7'), day).lerp(new Color('#ffcba0'), sky.warmth * .45);
  const clouds = useRef<Group>(null);
  useFrame(({ clock }) => { if (clouds.current && !reduced) clouds.current.position.x = Math.sin(clock.elapsedTime * .017) * 1.8; });
  return <>
    <mesh><sphereGeometry args={[150, 16, 12]} /><shaderMaterial side={BackSide} depthWrite={false} uniforms={uniforms} vertexShader={'varying vec3 v; void main(){v=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }'} fragmentShader={'varying vec3 v; uniform vec3 top; uniform vec3 bottom; void main(){float h=clamp(normalize(v).y*2.,0.,1.); gl_FragColor=vec4(mix(bottom,top,h),1.); #include <colorspace_fragment> }'.replace('#include <colorspace_fragment>', '\n#include <colorspace_fragment>\n')} /></mesh>
    <group position={[sky.sun ? -5.5 : 5.5, 4.6 + day * .4, -34]}>
      <mesh><sphereGeometry args={[1.65, 24, 16]} /><meshBasicMaterial color={sky.sun ? '#ffdf79' : '#f1edc7'} /></mesh>
      <mesh scale={1.3}><sphereGeometry args={[1.65, 16, 12]} /><meshBasicMaterial color={sky.sun ? '#ffebaf' : '#d9ecff'} transparent opacity={.1} depthWrite={false} /></mesh>
      {!sky.sun && <>{[[.35, .55, 1.42], [-.6, -.3, 1.36], [.52, -.55, 1.37]].map((p, i) => <mesh key={i} position={p as [number, number, number]}><sphereGeometry args={[.22 + i * .05, 8, 6]} /><meshBasicMaterial color="#d5d9bc" /></mesh>)}</>}
    </group>
    <group ref={clouds}>
      {[[-13, 4, -28, 1.1], [7, 6, -32, 1.2], [16, 3, -26, .9], [-2, 7, -43, 1]].map(([x, y, z, s], i) => <group key={i} position={[x, y, z]} scale={s}>
        {[-1, 0, 1].map((a, j) => <mesh key={j} position={[a * 1.25, j === 1 ? .3 : 0, 0]} scale={[1.7, .75 + (j === 1 ? .3 : 0), .9]}><sphereGeometry args={[1, 10, 7]} /><meshStandardMaterial color={day > .4 ? '#f1f9ef' : '#547793'} roughness={1} /></mesh>)}
      </group>)}
    </group>
    {day < .5 && <group>{Array.from({ length: 28 }, (_, i) => <mesh key={i} position={[Math.sin(i * 31.3) * 28, 8 + ((i * 7) % 16), -36 - (i % 5) * 4]}><sphereGeometry args={[.035 + (i % 3) * .025, 5, 4]} /><meshBasicMaterial color="#ffedb5" /></mesh>)}</group>}
    <hemisphereLight args={[day > .5 ? '#eefadf' : '#95c9f3', '#528083', 2.0]} />
    <directionalLight position={[-8, 15, 9]} intensity={1.8 + day * 1.2} color={day > .5 ? '#fff0c9' : '#a2c5f5'} />
  </>;
}
function Gull({ index, reduced }: { index: number; reduced: boolean }) {
  const group = useRef<Group>(null), left = useRef<Group>(null), right = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return; const t = reduced ? index * 2 : clock.elapsedTime;
    const travel = ((t * .75 + index * 14) % 54) - 27;
    group.current.position.set(travel, 5.5 + index * .7 + Math.sin(t * .8 + index) * .3, -18 - index * 4);
    if (left.current && right.current) { left.current.rotation.x = Math.sin(t * 5 + index) * .4; right.current.rotation.x = -left.current.rotation.x; }
  });
  return <group ref={group} scale={.65} rotation={[0, -.35, .05]}><mesh scale={[.45, .15, .16]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#fff8dd" /></mesh><mesh position={[.43, .01, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[.07, .2, 5]} /><meshStandardMaterial color="#ffc06a" /></mesh><group ref={left}><Block at={[0, .06, .43]} size={[.38, .055, .85]} color="#f6f3e3" rotation={[.15, -.3, 0]} /></group><group ref={right}><Block at={[0, .06, -.43]} size={[.38, .055, .85]} color="#f6f3e3" rotation={[-.15, .3, 0]} /></group></group>;
}
function PassingBoat({ reduced }: { reduced: boolean }) {
  const ship = useRef<Group>(null);
  useFrame(({ clock }) => { if (ship.current) { const t = reduced ? 0 : clock.elapsedTime; ship.current.position.x = -4 + Math.sin(t * .014) * 13; ship.current.position.y = Math.sin(t * 1.1) * .07; ship.current.rotation.z = Math.sin(t) * .025; } });
  return <group ref={ship} position={[-4, 0, -25]} rotation={[0, Math.PI / 2, 0]} scale={.9}><BoatModel /><mesh position={[0, 2, 0]}><cylinderGeometry args={[.055, .065, 3.6, 6]} /><meshStandardMaterial color="#825b46" /></mesh><mesh position={[.5, 2.2, 0]} rotation={[0, Math.PI / 2, -.1]} scale={[1, 1.6, .1]}><coneGeometry args={[.9, 1.9, 3]} /><meshStandardMaterial color="#ffeac0" flatShading /></mesh><Block at={[0, 3.7, 0]} size={[.08, .3, .7]} color="#ef8367" /></group>;
}
function Island({ right = false }: { right?: boolean }) {
  const portrait = useThree(s => s.size.width < s.size.height);
  return <group position={[right ? (portrait ? 5.3 : 11) : (portrait ? -4.8 : -10), -.2, right ? -20 : -18]} scale={portrait ? .72 : 1}>
    <Pebble at={[0, -.2, 0]} size={[5, .8, 3.8]} color="#e8c98e" />
    <Pebble at={[0, .2, -.4]} size={[4.3, .6, 3]} color="#84bd60" />
    <Pebble at={[2.5, .35, 1]} size={[1, .7, .9]} color="#82a496" />
    <Palm at={[1.2, .6, 0]} scale={1.4} /><Palm at={[-1.3, .55, -1]} scale={.95} />
    {!right && <group position={[-.7, .65, .4]}><mesh position={[0, 1.5, 0]}><cylinderGeometry args={[.48, .68, 3, 10]} /><meshStandardMaterial color="#fff1ce" /></mesh><mesh position={[0, 1.8, 0]}><cylinderGeometry args={[.54, .59, .55, 10]} /><meshStandardMaterial color="#ef8463" /></mesh><mesh position={[0, 3.25, 0]}><cylinderGeometry args={[.62, .62, .5, 8]} /><meshStandardMaterial color="#497f8d" /></mesh><mesh position={[0, 3.8, 0]}><coneGeometry args={[.84, .6, 8]} /><meshStandardMaterial color="#e87258" /></mesh></group>}
  </group>;
}
function SwimmingSchool({ reduced, phase, motion }: Pick<WorldProps, 'reduced' | 'phase' | 'motion'>) {
  const school = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!school.current) return;
    const t = reduced ? 2 : clock.elapsedTime;
    school.current.children.forEach((child, i) => {
      const curious = phase === 'waiting' || phase === 'bite';
      const x = curious ? motion.current.aim * 2.8 + Math.sin(t * .6 + i * 1.6) * (1.1 + i * .15) : Math.sin(t * .2 + i * 1.6) * 3.6;
      const z = curious ? -2.8 - motion.current.power * 6.4 + Math.cos(t * .6 + i * 1.6) * 1.3 : -3 - i * 1.5 + Math.cos(t * .23 + i) * .8;
      child.position.x += (x - child.position.x) * .035; child.position.z += (z - child.position.z) * .035; child.position.y = -.38;
      child.rotation.y = Math.cos(t * (curious ? .6 : .2) + i * 1.6) > 0 ? 0 : Math.PI;
    });
  });
  return <group ref={school}>{['#ffc064', '#93dbc4', '#ff9f8b', '#acd5f2'].map((color, i) => <group key={i}><FishModel color={color} size={.55} reduced={reduced} /></group>)}</group>;
}
export function Environment({ sky, reduced, platform, phase, motion }: Pick<WorldProps, 'sky' | 'reduced' | 'platform' | 'phase' | 'motion'>) {
  return <><Sky sky={sky} reduced={reduced} /><Island /><Island right /><PassingBoat reduced={reduced} />{[0, 1, 2].map(i => <Gull key={i} index={i} reduced={reduced} />)}<SwimmingSchool reduced={reduced} phase={phase} motion={motion} />{platform === 'river' && <group>{[-1, 1].map(side => <group key={side} position={[side * 6, -.12, -6]}><Pebble at={[0, 0, 0]} size={[3.7, .45, 11]} color="#7cc48a" /><Pebble at={[-side * 2.2, .1, 4]} size={[1.2, .5, 1.8]} color="#b3c5a6" /><Palm at={[0, .3, -1]} scale={1.35} />{Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[-side * 2.7, .45, i * 1.4 - 3]} rotation={[0, i, side * .13]}><coneGeometry args={[.13, 1.25, 5]} /><meshStandardMaterial color={i % 2 ? '#429d70' : '#a9d676'} /></mesh>)}</group>)}{[[-2, .03, -3], [2.5, .03, -5], [-3, .03, -8]].map((p, i) => <mesh key={i} position={p as [number, number, number]} rotation={[-Math.PI / 2, 0, i]}><circleGeometry args={[.45, 18, .2, Math.PI * 1.8]} /><meshStandardMaterial color="#a4d974" side={2} /></mesh>)}</group>}</>;
}
