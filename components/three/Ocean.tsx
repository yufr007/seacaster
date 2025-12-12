import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, ShaderMaterial } from 'three';
import { waterVertexShader, waterFragmentShader } from '../../shaders/water';
import { GamePhase } from '../../types';

interface OceanProps {
  phase: GamePhase;
}

export const Ocean: React.FC<OceanProps> = ({ phase }) => {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  // 30fps throttled animation for battery optimization
  useFrame((state, delta) => {
    if (!materialRef.current) return;

    // Slow wave animation (0.3x speed for calm ocean)
    materialRef.current.uniforms.time.value += delta * 0.3;
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]} // Rotate to horizontal
      position={[0, 0, 0]}
      receiveShadow
    >
      {/* Large plane for ocean surface */}
      <planeGeometry args={[30, 30, 64, 64]} />

      {/* Custom shader material */}
      <shaderMaterial
        ref={materialRef}
        vertexShader={waterVertexShader}
        fragmentShader={waterFragmentShader}
        uniforms={{
          time: { value: 0 },
          waveHeight: { value: 0.15 }, // Subtle waves
          color1: { value: [0.05, 0.3, 0.6] }, // Deep blue (RGB)
          color2: { value: [0.1, 0.5, 0.8] }, // Light blue (RGB)
        }}
        transparent
      />
    </mesh>
  );
};
