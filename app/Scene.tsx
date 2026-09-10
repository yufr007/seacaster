import { Component, Suspense, memo, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Color, ShaderMaterial } from 'three';
import { waterVertexShader, waterFragmentShader } from '../shaders/water';
import type { WorldProps } from './world/types';
import { Environment } from './world/Environment';
import { Platform } from './world/Platform';
import { FishingRig } from './world/FishingRig';
import { usePlayer } from './player';
class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}
function View({ onFailure }: { onFailure: () => void }) {
  const { camera, gl, size } = useThree();
  useEffect(() => { camera.position.set(0, 7.3, 12); camera.lookAt(0, 1, -6.5); camera.updateProjectionMatrix(); }, [camera, size.width, size.height]);
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
  useFrame((_s, dt) => { if (material.current && !reduced) material.current.uniforms.time.value += Math.min(dt, .1); });
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.05, -26]} renderOrder={2}><planeGeometry args={[180, 180, 96, 96]} /><shaderMaterial ref={material} uniforms={uniforms} vertexShader={waterVertexShader} fragmentShader={waterFragmentShader} transparent depthWrite={false} /></mesh>;
}
function Scene(props: WorldProps) {
  const lowPower = usePlayer(s => s.lowPower);
  const [failed, setFailed] = useState(false), [visible, setVisible] = useState(!document.hidden);
  useEffect(() => { const change = () => setVisible(!document.hidden); document.addEventListener('visibilitychange', change); return () => document.removeEventListener('visibilitychange', change); }, []);
  const fallback = lowPower || failed;
  return <div className={`scene-layer sky-${props.sky.period} platform-${props.platform} ${fallback ? 'is-illustrated' : ''}`} data-testid="living-world" data-platform={props.platform} data-period={props.sky.period}>
    <div className="illustrated-water" />
    {!fallback && <SceneBoundary onFailure={() => setFailed(true)}><Suspense fallback={null}><Canvas camera={{ fov: 48, near: .1, far: 190 }} dpr={[1, 1.5]} frameloop={!visible ? 'never' : props.reduced ? 'demand' : 'always'} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }} fallback={<div className="illustrated-water" />}>
      <View onFailure={() => setFailed(true)} /><Environment sky={props.sky} reduced={props.reduced} platform={props.platform} phase={props.phase} motion={props.motion} /><Water sky={props.sky} reduced={props.reduced} platform={props.platform} /><Platform {...props} /><FishingRig {...props} />
    </Canvas></Suspense></SceneBoundary>}
    {fallback && !props.home && <><div className={`illustrated-float float-${props.phase}`} aria-hidden="true"><i /></div><button className="fallback-bait world-bait-button" aria-label="Open bait box" onClick={props.onBait}>Bait box</button></>}
    {failed && <button className="restore-3d" onClick={() => setFailed(false)}>Illustrated mode · retry 3D</button>}
  </div>;
}
export default memo(Scene);
