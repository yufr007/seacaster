import { Component, Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Color, PerspectiveCamera, ShaderMaterial, Vector3 } from 'three';
import { waterVertexShader, waterFragmentShader } from '../shaders/water';
import type { WorldProps } from './world/types';
import { ArtLighting } from './world/ArtLighting';
import { ArtReady, ART_URL } from './world/ArtModels';
import { Environment } from './world/Environment';
import { Platform } from './world/Platform';
import { FishingRig } from './world/FishingRig';
import { usePlayer } from './player';
import { cameraFrame } from '../game/world';
class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}
function View({ onFailure, platform, home, reduced }: { onFailure: () => void } & Pick<WorldProps, 'platform' | 'home' | 'reduced'>) {
  const { camera, gl, size } = useThree();
  const look = useRef(new Vector3(0, 1, -6.5)), initialized = useRef(false);
  const vectors = useMemo(() => ({ position: new Vector3(), look: new Vector3() }), []);
  useFrame((_state, dt) => {
    const frame = cameraFrame(platform, size.width < size.height, home);
    const perspective = camera as PerspectiveCamera;
    vectors.position.set(...frame.position); vectors.look.set(...frame.lookAt);
    const blend = reduced || !initialized.current ? 1 : 1 - Math.exp(-4.8 * Math.min(dt, .1));
    camera.position.lerp(vectors.position, blend); look.current.lerp(vectors.look, blend); camera.lookAt(look.current);
    if (Math.abs(perspective.fov - frame.fov) > .01) { perspective.fov += (frame.fov - perspective.fov) * blend; perspective.updateProjectionMatrix(); }
    initialized.current = true;
  });
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onFailure]);
  return null;
}
function Water({ sky, reduced, platform }: Pick<WorldProps, 'sky' | 'reduced' | 'platform'>) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ time: { value: 0 }, daylight: { value: sky.daylight }, deep: { value: new Color('#168bab') }, shallow: { value: new Color('#58d0b2') } }), []);
  useEffect(() => {
    uniforms.daylight.value = sky.daylight;
    uniforms.deep.value.set('#164966').lerp(new Color(platform === 'river' ? '#389e96' : '#168bab'), sky.daylight);
    uniforms.shallow.value.set('#348e96').lerp(new Color(platform === 'river' ? '#98d3a1' : '#58d0b2'), sky.daylight);
  }, [sky.daylight, platform, uniforms]);
  useFrame(({ clock }) => { if (material.current) material.current.uniforms.time.value = reduced ? 0 : clock.elapsedTime; });
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.05, -26]} renderOrder={2}><planeGeometry args={[180, 180, 88, 88]} /><shaderMaterial ref={material} uniforms={uniforms} vertexShader={waterVertexShader} fragmentShader={waterFragmentShader} transparent depthWrite={false} /></mesh>;
}
function Scene(props: WorldProps) {
  const lowPower = usePlayer(s => s.lowPower);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => { setFailed(true); setReady(false); }, []);
  const [failed, setFailed] = useState(false), [visible, setVisible] = useState(!document.hidden);
  useEffect(() => { const change = () => setVisible(!document.hidden); document.addEventListener('visibilitychange', change); return () => document.removeEventListener('visibilitychange', change); }, []);
  const fallback = lowPower || failed;
  return <div className={`scene-layer sky-${props.sky.period} platform-${props.platform} ${fallback ? 'is-illustrated' : ''}`} data-art="sculpted-v3" data-art-ready={ready && !fallback} data-testid="living-world" data-platform={props.platform} data-period={props.sky.period}>
    <div className="illustrated-water" />
    {!fallback && <SceneBoundary onFailure={onFailure}><Suspense fallback={null}><Canvas shadows="soft" camera={{ fov: 48, near: .1, far: 190 }} dpr={[1, 1.5]} frameloop={!visible ? 'never' : props.reduced && ['idle', 'lost'].includes(props.phase) ? 'demand' : 'always'} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} fallback={<div className="illustrated-water" />}>
      <ArtReady onReady={onReady} /><ArtLighting sky={props.sky} /><View onFailure={onFailure} platform={props.platform} home={props.home} reduced={props.reduced} /><Environment sky={props.sky} reduced={props.reduced} platform={props.platform} phase={props.phase} motion={props.motion} /><Water sky={props.sky} reduced={props.reduced} platform={props.platform} /><Platform {...props} /><FishingRig {...props} />
    </Canvas></Suspense></SceneBoundary>}
    {fallback && !props.home && <><div className={`illustrated-float float-${props.phase}`} aria-hidden="true"><i /></div><button className="fallback-bait world-bait-button" aria-label="Open bait box" onClick={props.onBait}>Bait box</button></>}
    {failed && <button className="restore-3d" onClick={() => { useGLTF.clear(ART_URL); setFailed(false); }}>Illustrated mode · retry 3D</button>}
  </div>;
}
export default memo(Scene);
