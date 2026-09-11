import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BackSide, CanvasTexture, Color, Group, LinearFilter, type Texture } from 'three';
import type { WorldProps } from './types';
import { Block } from './Props';
import { ArtObject, ArtFish, ArtBird } from './ArtModels';
import { platformAtmosphere } from '../../game/world';

function makeCloudTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384; canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new CanvasTexture(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const puffs = [
    [92, 119, 67], [150, 91, 83], [221, 105, 74], [286, 126, 57], [190, 130, 88],
  ] as const;
  for (const [x, y, radius] of puffs) {
    const gradient = ctx.createRadialGradient(x, y - radius * .18, radius * .08, x, y, radius);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(.58, 'rgba(255,255,255,.96)');
    gradient.addColorStop(.86, 'rgba(255,255,255,.58)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const haze = ctx.createLinearGradient(0, 118, 0, 184);
  haze.addColorStop(0, 'rgba(255,255,255,.38)'); haze.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = haze; ctx.beginPath(); ctx.ellipse(194, 139, 158, 34, 0, 0, Math.PI * 2); ctx.fill();
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter; texture.magFilter = LinearFilter; texture.generateMipmaps = false;
  return texture;
}

function SoftCloud({ texture, position, scale, daylight }: { texture: Texture; position: [number, number, number]; scale: number; daylight: number }) {
  const face = new Color('#7f97ad').lerp(new Color('#fffbed'), daylight);
  const shade = new Color('#233955').lerp(new Color('#a8bbb7'), daylight);
  return <group position={position} scale={scale}>
    <sprite position={[0, -.22, .08]} scale={[7.6, 3.05, 1]}><spriteMaterial map={texture} color={shade} transparent opacity={.34} depthWrite={false} /></sprite>
    <sprite position={[0, .08, 0]} scale={[7.35, 2.85, 1]}><spriteMaterial map={texture} color={face} transparent opacity={.94} depthWrite={false} /></sprite>
  </group>;
}

function Sky({ sky, reduced }: Pick<WorldProps, 'sky' | 'reduced'>) {
  const uniforms = useMemo(() => ({ top: { value: new Color('#61bbef') }, bottom: { value: new Color('#c5efef') } }), []);
  const cloudTexture = useMemo(makeCloudTexture, []);
  useEffect(() => () => cloudTexture.dispose(), [cloudTexture]);
  const day = sky.daylight;
  uniforms.top.value.set('#15284c').lerp(new Color('#67c5ed'), day).lerp(new Color('#d790ac'), sky.warmth * .25);
  uniforms.bottom.value.set('#426b84').lerp(new Color('#dcf6e7'), day).lerp(new Color('#ffcba0'), sky.warmth * .45);
  const clouds = useRef<Group>(null);
  useFrame(({ clock }) => { if (clouds.current && !reduced) clouds.current.position.x = Math.sin(clock.elapsedTime * .017) * 1.8; });
  return <>
    <mesh><sphereGeometry args={[150, 20, 14]} /><shaderMaterial side={BackSide} depthWrite={false} uniforms={uniforms} vertexShader={'varying vec3 v; void main(){v=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }'} fragmentShader={'varying vec3 v; uniform vec3 top; uniform vec3 bottom; void main(){float h=clamp(normalize(v).y*2.,0.,1.); gl_FragColor=vec4(mix(bottom,top,h),1.); #include <colorspace_fragment> }'.replace('#include <colorspace_fragment>', '\n#include <colorspace_fragment>\n')} /></mesh>
    <group position={[sky.sun ? -5.5 : 5.5, 4.6 + day * .4, -34]}>
      <mesh><sphereGeometry args={[1.55, 32, 20]} /><meshBasicMaterial color={sky.sun ? '#ffdc72' : '#f2edca'} /></mesh>
      <mesh scale={1.55}><sphereGeometry args={[1.55, 20, 14]} /><meshBasicMaterial color={sky.sun ? '#ffe9a8' : '#cfe5ff'} transparent opacity={sky.sun ? .11 : .08} depthWrite={false} /></mesh>
      {!sky.sun && <>{[[.35, .55, 1.42], [-.6, -.3, 1.36], [.52, -.55, 1.37]].map((p, i) => <mesh key={i} position={p as [number, number, number]}><sphereGeometry args={[.20 + i * .045, 12, 8]} /><meshBasicMaterial color="#d2d5b9" /></mesh>)}</>}
    </group>
    <group ref={clouds}>
      {([[-13, 4.8, -31, .78], [8, 6.5, -39, .92], [17, 3.7, -29, .68], [-2, 8.1, -52, .78]] as const).map(([x, y, z, s], i) => <SoftCloud key={i} texture={cloudTexture} position={[x, y, z]} scale={s} daylight={day} />)}
    </group>
    {day < .5 && <group>{Array.from({ length: 28 }, (_, i) => <mesh key={i} position={[Math.sin(i * 31.3) * 28, 8 + ((i * 7) % 16), -36 - (i % 5) * 4]}><sphereGeometry args={[.035 + (i % 3) * .025, 5, 4]} /><meshBasicMaterial color="#ffedb5" /></mesh>)}</group>}
  </>;
}
function Gull({ index, reduced }: { index: number; reduced: boolean }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return; const t = reduced ? index * 2 : clock.elapsedTime;
    const travel = ((t * .75 + index * 14) % 54) - 27;
    group.current.position.set(travel, 5.5 + index * .7 + Math.sin(t * .8 + index) * .3, -18 - index * 4);
  });
  return <group ref={group} scale={.65} rotation={[0, -.35, .05]}><ArtBird reduced={reduced} offset={index} /></group>;
}
function PassingBoat({ reduced }: { reduced: boolean }) {
  const ship = useRef<Group>(null);
  useFrame(({ clock }) => { if (ship.current) { const t = reduced ? 0 : clock.elapsedTime; ship.current.position.x = -4 + Math.sin(t * .014) * 13; ship.current.position.y = Math.sin(t * 1.1) * .07; ship.current.rotation.z = Math.sin(t) * .025; } });
  return <group ref={ship} position={[-4, 0, -25]} rotation={[0, Math.PI / 2, 0]} scale={.9}><group scale={.38}><group position={[0, 0, -5.5]}><ArtObject name="Skiff" /></group></group><mesh position={[0, 2, 0]}><cylinderGeometry args={[.055, .065, 3.6, 12]} /><meshStandardMaterial color="#825b46" roughness={.72} /></mesh><mesh position={[.5, 2.2, 0]} rotation={[0, Math.PI / 2, -.1]} scale={[1, 1.6, .1]}><coneGeometry args={[.9, 1.9, 3]} /><meshStandardMaterial color="#ffeac0" roughness={.8} /></mesh><Block at={[0, 3.7, 0]} size={[.08, .3, .7]} color="#ef8367" /><group position={[0, .025, 3.1]} rotation={[-Math.PI / 2, 0, 0]}>{[0, 1].map(i => <mesh key={i} position={[0, 0, i * 1.05]} scale={[1 + i * .55, 1 + i * .9, 1]}><ringGeometry args={[.35, .42, 24, 1, 0, Math.PI]} /><meshBasicMaterial color="#d8fff0" transparent opacity={.28 - i * .07} depthWrite={false} /></mesh>)}</group></group>;
}
function LighthouseLamp({ sky, reduced }: Pick<WorldProps, 'sky' | 'reduced'>) {
  const lamp = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!lamp.current) return;
    const pulse = reduced ? 1 : .86 + Math.sin(clock.elapsedTime * 2.2) * .14;
    lamp.current.visible = sky.daylight < .62; lamp.current.scale.setScalar(pulse);
  });
  return <group ref={lamp} position={[-.65, 4.3, .5]}><mesh><sphereGeometry args={[.18, 16, 10]} /><meshBasicMaterial color="#ffe59a" /></mesh><pointLight color="#ffd97c" intensity={2.6} distance={7} /></group>;
}
function Island({ right = false, sky, reduced }: { right?: boolean } & Pick<WorldProps, 'sky' | 'reduced'>) {
  const portrait = useThree(s => s.size.width < s.size.height);
  return <group position={[right ? (portrait ? 5.3 : 11) : (portrait ? -4.8 : -10), -.2, right ? -20 : -18]} scale={portrait ? .72 : 1}>
    <ArtObject name={right ? 'Island' : 'LighthouseIsland'} />
    {!right && <LighthouseLamp sky={sky} reduced={reduced} />}
  </group>;
}
function Fireflies({ reduced }: { reduced: boolean }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = reduced ? 0 : clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      child.position.x = Math.sin(t * (.25 + i * .011) + i * 2.3) * (2.5 + (i % 3));
      child.position.y = .75 + (i % 4) * .35 + Math.sin(t * 1.1 + i) * .18;
      child.position.z = -5 - (i % 5) * 1.35 + Math.cos(t * .4 + i * .7) * .45;
      child.scale.setScalar(.65 + Math.sin(t * 2.1 + i) * .25);
    });
  });
  return <group ref={group}>{Array.from({ length: 9 }, (_, i) => <mesh key={i}><sphereGeometry args={[.045, 6, 5]} /><meshBasicMaterial color={i % 2 ? '#eaff9d' : '#fff1a4'} transparent opacity={.82} depthWrite={false} /></mesh>)}</group>;
}
function DistantBreach({ reduced }: { reduced: boolean }) {
  const breach = useRef<Group>(null), rings = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!breach.current || !rings.current) return;
    const cycle = reduced ? 4 : (clock.elapsedTime + 3.2) % 11;
    const active = cycle < 1.6, t = Math.min(1, cycle / 1.6);
    breach.current.visible = active; rings.current.visible = active;
    if (!active) return;
    breach.current.position.set(-4.6 + t * 1.2, -.08 + Math.sin(Math.PI * t) * 1.15, -13.5);
    breach.current.rotation.z = -.8 + t * 1.6;
    rings.current.position.set(-4.1, .03, -13.5); rings.current.scale.setScalar(.35 + t * 1.8);
  });
  return <><group ref={breach} scale={.65}><ArtFish size={1} reduced={reduced} /></group><group ref={rings} rotation={[-Math.PI / 2, 0, 0]}>{[0, 1].map(i => <mesh key={i} scale={1 + i * .45}><torusGeometry args={[.45, .025, 5, 28]} /><meshBasicMaterial color="#d8fff0" transparent opacity={.32 - i * .08} depthWrite={false} /></mesh>)}</group></>;
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
  return <group ref={school}>{[0, 1, 2, 3].map(i => <group key={i}><ArtFish variant={i} size={.55} reduced={reduced} /></group>)}</group>;
}
export function Environment({ sky, reduced, platform, phase, motion }: Pick<WorldProps, 'sky' | 'reduced' | 'platform' | 'phase' | 'motion'>) {
  const mood = platformAtmosphere(platform), river = platform === 'river';
  return <><Sky sky={sky} reduced={reduced} /><Island sky={sky} reduced={reduced} /><Island right sky={sky} reduced={reduced} />{!river && <PassingBoat reduced={reduced} />}{Array.from({ length: river ? 1 : 3 }, (_, i) => <Gull key={i} index={i} reduced={reduced} />)}<SwimmingSchool reduced={reduced} phase={phase} motion={motion} />{!river && mood.water > .6 && <DistantBreach reduced={reduced} />}{river && <group><ArtObject name="InletBanks" />{sky.daylight < .58 && <Fireflies reduced={reduced} />}</group>}</>;
}
