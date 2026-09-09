import { Component, Suspense, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { Color, Group, Mesh, ShaderMaterial } from 'three';
import type { Phase } from './useFishing';
import { usePlayer } from './player';
import { waterVertexShader, waterFragmentShader } from '../shaders/water';
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}
function View() {
  const { camera } = useThree();
  useEffect(() => { camera.lookAt(0, 0, -6); }, [camera]);
  return null;
}
function Ocean({ night }: { night: boolean }) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ time: { value: 0 }, waveHeight: { value: .22 }, color1: { value: new Color(night ? '#041928' : '#08495c') }, color2: { value: new Color(night ? '#164b62' : '#44bbc0') } }), [night]);
  useFrame((_state, delta) => { if (material.current) material.current.uniforms.time.value += Math.min(delta, .1) * .7; });
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.05, -15]}><planeGeometry args={[100, 100, 96, 96]} /><shaderMaterial ref={material} vertexShader={waterVertexShader} fragmentShader={waterFragmentShader} uniforms={uniforms} /></mesh>;
}
/** Retains the original SeaCaster pier/rod geometry, now driven only by presentation props. */
function Pier() {
  return <group position={[0, -.45, 6]}>
    {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[-3.3 + i * .6, 0, 0]} receiveShadow><boxGeometry args={[.56, .35, 4]} /><meshStandardMaterial color={i % 2 ? '#75553e' : '#846247'} roughness={.9} /></mesh>)}
    {[-3.3, 3.3].flatMap(x => [-1.3, 1.3].map(z => <mesh key={`${x}:${z}`} position={[x, -.45, z]}><cylinderGeometry args={[.12, .16, 2.8, 10]} /><meshStandardMaterial color="#57412d" roughness={.95} /></mesh>))}
  </group>;
}
function Rod({ phase, gold }: { phase: Phase; gold: boolean }) {
  const group = useRef<Group>(null), bobber = useRef<Mesh>(null);
  const deployed = ['waiting', 'bite', 'reeling', 'saving'].includes(phase);
  useFrame(({ clock }, delta) => {
    if (group.current) {
      const target = phase === 'casting' ? -.8 : phase === 'reeling' || phase === 'bite' ? -.22 : .2;
      group.current.rotation.x += (target - group.current.rotation.x) * Math.min(1, delta * 8);
      group.current.rotation.z = -.55 + Math.sin(clock.elapsedTime * 1.3) * .018;
    }
    if (bobber.current) bobber.current.position.y = .16 + Math.sin(clock.elapsedTime * (phase === 'bite' ? 15 : 2)) * .055;
  });
  return <>
    <group ref={group} position={[2, .6, 4.1]} rotation={[.2, 0, -.55]}>
      <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[.016, .045, 4, 12]} /><meshStandardMaterial color={gold ? '#e9b84e' : '#514130'} roughness={.48} metalness={gold ? .65 : .15} /></mesh>
      <mesh position={[0, -.35, 0]}><cylinderGeometry args={[.075, .075, .65, 12]} /><meshStandardMaterial color="#282c2c" roughness={.9} /></mesh>
      <mesh position={[.13, -.15, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.15, .15, .09, 16]} /><meshStandardMaterial color={gold ? '#dcae48' : '#8e9c9b'} metalness={.8} roughness={.28} /></mesh>
      {[.4, 1.3, 2.2, 3.3].map(y => <mesh key={y} position={[0, y, -.03]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.048, .008, 8, 12]} /><meshStandardMaterial color="#d8dedb" metalness={.8} /></mesh>)}
    </group>
    {deployed && <><Line points={[[3.85, 3.3, 3.4], [.3, .16, -3]]} color="#e9f4e5" lineWidth={1} transparent opacity={.65} /><mesh ref={bobber} position={[.3, .16, -3]}><sphereGeometry args={[.1, 16, 10]} /><meshStandardMaterial color={phase === 'bite' ? '#ffba59' : '#e85645'} emissive={phase === 'bite' ? '#a33f14' : '#000000'} /></mesh></>}
  </>;
}
export default function Scene({ phase }: { phase: Phase }) {
  const night = usePlayer(s => s.night), lowPower = usePlayer(s => s.lowPower);
  const rod = usePlayer(s => s.profile.rod), goldSkin = usePlayer(s => s.goldSkin);
  return <div className={`seascape ${night ? 'is-night' : ''}`} aria-hidden="true">
    {!lowPower && <SceneBoundary><Suspense fallback={null}><Canvas camera={{ position: [0, 4.2, 9], fov: 49, near: .1, far: 130 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'low-power' }}>
      <color attach="background" args={[night ? '#071b2d' : '#bbd8d7']} /><fog attach="fog" args={[night ? '#071b2d' : '#bbd8d7', 22, 65]} />
      <View /><ambientLight intensity={night ? .65 : 1.3} /><directionalLight position={[-8, 14, -10]} intensity={night ? 1.5 : 3} color={night ? '#99cddd' : '#ffdc9b'} />
      <mesh position={[-13, 8, -45]}><sphereGeometry args={[3, 32, 24]} /><meshBasicMaterial color={night ? '#dfebdf' : '#ffe5a5'} /></mesh>
      <Ocean night={night} /><Pier /><Rod phase={phase} gold={rod === 'gold' || goldSkin} />
    </Canvas></Suspense></SceneBoundary>}
    <div className="scene-vignette" />
  </div>;
}
