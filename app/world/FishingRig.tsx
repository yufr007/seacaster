import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import { BufferGeometry, Float32BufferAttribute, Group, Line as ThreeLine, LineBasicMaterial, Vector3, TextureLoader, SRGBColorSpace, Mesh } from 'three';
import type { WorldProps } from './types';
import { FishModel, BaitModel, Block } from './Props';
import { FISH } from '../../game/engine';
import { castArc } from '../../game/world';
import { usePlayer } from '../player';

function FishPortrait({ species }: { species: string }) {
  const fish = FISH.find(f => f.id === species)!;
  const texture = useLoader(TextureLoader, fish.image); texture.colorSpace = SRGBColorSpace;
  return <Billboard><mesh><planeGeometry args={[2.6, 2]} /><meshBasicMaterial map={texture} transparent depthWrite={false} alphaTest={.02} /></mesh></Billboard>;
}
export function FishingRig({ phase, motion, reduced, home, platform, species }: Pick<WorldProps, 'phase' | 'motion' | 'reduced' | 'home' | 'platform' | 'species'>) {
  const rod = useRef<Group>(null), shaft = useRef<Group>(null), float = useRef<Group>(null), splash = useRef<Group>(null), fish = useRef<Group>(null), prize = useRef<Group>(null), crank = useRef<Group>(null);
  
  const portrait = useThree(s => s.size.width < s.size.height);
  const gold = usePlayer(s => s.goldSkin), rodId = usePlayer(s => s.profile.rod);
  const memory = useRef({ castAt: -10000, splashAt: -10000, phase, phaseAt: 0 });
  const vectors = useMemo(() => ({ tip: new Vector3(), from: new Vector3(), to: new Vector3(), bob: new Vector3(), up: new Vector3(0, 1, 0), dir: new Vector3(), a: new Vector3(), b: new Vector3() }), []);
  const line = useMemo(() => { const geometry = new BufferGeometry(); geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(36 * 3), 3)); return new ThreeLine(geometry, new LineBasicMaterial({ color: '#ffefb4', transparent: true, opacity: .85 })); }, []);
  useEffect(() => () => { line.geometry.dispose(); (line.material as LineBasicMaterial).dispose(); }, [line]);
  useFrame(({ clock }, dt) => {
    if (!rod.current || !shaft.current || !float.current) return;
    const now = performance.now(), m = motion.current, mem = memory.current;
    const time = reduced ? 0 : clock.elapsedTime;
    if (mem.phase !== phase) { mem.phase = phase; mem.phaseAt = now; if (phase === 'bite' || phase === 'caught') mem.splashAt = now; }
    const castTime = reduced ? 1 : (now - m.castAt) / 820;
    const active = !home && ['casting', 'waiting', 'bite', 'reeling', 'saving', 'caught'].includes(phase);
    const flying = active && castTime < 1;
    const rodSwing = flying ? (castTime < .16 ? .9 * (1 - castTime / .16) : -Math.sin((castTime - .16) / .84 * Math.PI) * .45) : 0;
    rod.current.visible = !home;
    rod.current.position.set(.95, .45 + ((platform === 'boat' || platform === 'yacht') ? Math.sin(time * 1.2) * .04 : 0), portrait ? 1.3 : 3.3);
    rod.current.rotation.set(-.35 + m.charge * .95 + rodSwing + (phase === 'reeling' ? .16 : 0), m.aim * .25, .18);
    const bend = m.charge * .5 + (phase === 'reeling' ? m.tension * .5 : phase === 'bite' ? .35 : .06 + Math.sin(time * 1.6) * .025);
    for (let i = 0; i < shaft.current.children.length; i++) {
      const child = shaft.current.children[i], a = i / 10, b = (i + 1) / 10;
      vectors.a.set(-bend * a * a, a * 3.55, 0); vectors.b.set(-bend * b * b, b * 3.55, 0);
      child.position.copy(vectors.a).add(vectors.b).multiplyScalar(.5);
      vectors.dir.copy(vectors.b).sub(vectors.a); child.quaternion.setFromUnitVectors(vectors.up, vectors.dir.normalize());
    }
    rod.current.updateMatrixWorld(true); vectors.tip.set(-bend, 3.55, 0); rod.current.localToWorld(vectors.tip);
    if (mem.castAt !== m.castAt) { mem.castAt = m.castAt; vectors.from.copy(vectors.tip); mem.splashAt = m.castAt + 820; }
    vectors.to.set(m.aim * 2.8, .16, -2.8 - m.power * 6.4);
    if (phase === 'reeling' || phase === 'saving' || phase === 'caught') { vectors.to.z += m.progress * 4; vectors.to.x += Math.sin(time * 3.5) * .18 * (1 - m.progress); }
    if (flying) {
      const t = Math.max(0, Math.min(1, (castTime - .16) / .84));
      if (castTime < .16) vectors.from.copy(vectors.tip);
      const arc = castArc(vectors.from.toArray(), vectors.to.toArray(), t); vectors.bob.set(...arc);
    } else {
      vectors.bob.copy(vectors.to);
      vectors.bob.y += Math.sin(time * 2.2) * .075 + Math.cos(time * 1.7) * .035;
      if (phase === 'bite') vectors.bob.y -= .12 + Math.sin(time * 17) * .11;
    }
    float.current.visible = active && phase !== 'caught'; float.current.position.copy(vectors.bob); float.current.rotation.set(Math.sin(time * 1.6) * .12, 0, Math.sin(time * 2) * (phase === 'bite' ? .32 : .07));
    const attr = line.geometry.attributes.position;
    for (let i = 0; i < 36; i++) { const t = i / 35; vectors.a.copy(vectors.tip).lerp(vectors.bob, t); vectors.a.y -= Math.sin(t * Math.PI) * (phase === 'reeling' ? .07 : .3); attr.setXYZ(i, vectors.a.x, vectors.a.y, vectors.a.z); }
    attr.needsUpdate = true; line.geometry.computeBoundingSphere(); line.visible = active && phase !== 'caught';
    if (crank.current && m.holding && !reduced) crank.current.rotation.x += Math.min(dt, .1) * 18;
    if (splash.current) {
      const elapsed = (now - mem.splashAt) / 850;
      splash.current.position.set(vectors.to.x, .08, vectors.to.z); splash.current.visible = active && !home && elapsed > 0 && elapsed < 1;
      splash.current.children.forEach((child, i) => {
        if (i < 3) { child.scale.setScalar(.2 + elapsed * (1 + i * .4)); (child as Mesh).material && ((child as Mesh).material as { opacity: number }).opacity !== undefined && (((child as Mesh).material as { opacity: number }).opacity = (1 - elapsed) * .7); }
        else { const angle = i * 2.4; child.position.set(Math.cos(angle) * elapsed * 1.1, Math.sin(elapsed * Math.PI) * (.4 + (i % 3) * .23), Math.sin(angle) * elapsed * 1.1); child.scale.setScalar(1 - elapsed); }
      });
    }
    if (fish.current) {
      fish.current.visible = phase === 'reeling' && !home;
      const leap = reduced ? 0 : Math.max(0, Math.sin((time % 4) / 4 * Math.PI * 2));
      fish.current.position.copy(vectors.to); fish.current.position.y = -.25 + leap * .9;
      fish.current.rotation.set(0, Math.sin(time * 2) * .4, Math.sin(time * 2) * .18);
    }
    if (prize.current) {
      const t = reduced ? 1 : Math.min(1, (now - mem.phaseAt) / 1150);
      prize.current.visible = phase === 'caught' && !home;
      prize.current.position.copy(vectors.to).lerp(vectors.a.set(-.2, 1.15, portrait ? 1.4 : 3.4), t);
      prize.current.position.y += Math.sin(Math.PI * t) * 3.3;
      prize.current.rotation.z = reduced ? 0 : Math.sin(t * Math.PI * 2) * .25;
    }
  });
  return <>
    <group ref={rod}>
      <group ref={shaft}>{Array.from({ length: 10 }, (_, i) => <mesh key={i}><cylinderGeometry args={[.035 - i * .0025, .04 - i * .0025, .365, 7]} /><meshStandardMaterial color={gold || rodId === 'gold' ? '#f1b34b' : rodId === 'carbon' ? '#394960' : '#cc7b42'} roughness={.55} /></mesh>)}</group>
      <Block at={[0, .28, 0]} size={[.16, .72, .16]} color="#534241" />
      <mesh position={[.08, .45, .07]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.19, .19, .17, 12]} /><meshStandardMaterial color="#67adb0" metalness={.2} /></mesh>
      <group ref={crank} position={[.22, .45, .07]}><Block at={[0, .13, 0]} size={[.04, .25, .045]} color="#fbd395" /><mesh position={[.06, .26, .07]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.04, .04, .14, 8]} /><meshStandardMaterial color="#493e3a" /></mesh></group>
    </group>
    <primitive object={line} dispose={null} />
    <group ref={float}><mesh position={[0, .04, 0]} scale={[1, 1.25, 1]}><sphereGeometry args={[.14, 12, 8]} /><meshStandardMaterial color="#fff2be" /></mesh><mesh position={[0, .12, 0]}><sphereGeometry args={[.135, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#ff7359" /></mesh><mesh position={[0, .32, 0]}><cylinderGeometry args={[.023, .023, .3, 6]} /><meshStandardMaterial color="#ff7255" /></mesh><group position={[0, -.18, 0]}><BaitModel bait={motion.current.bait} scale={.58} /></group></group>
    <group ref={splash}>{Array.from({ length: 3 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, .01 * i, 0]}><torusGeometry args={[.4, .025, 4, 32]} /><meshBasicMaterial color="#dcffed" transparent opacity={.7} depthWrite={false} /></mesh>)}{Array.from({ length: 9 }, (_, i) => <mesh key={`d${i}`}><sphereGeometry args={[.065, 6, 5]} /><meshStandardMaterial color="#b2f1e8" transparent /></mesh>)}</group>
    <group ref={fish}><FishModel reduced={reduced} size={.9} /></group>
    <group ref={prize}><Suspense fallback={<FishModel reduced={reduced} size={1.5} />}>{species ? <FishPortrait species={species} /> : <FishModel reduced={reduced} size={1.5} />}</Suspense></group>
  </>;
}
