import React from 'react';

/**
 * Sky Background - Simple gradient skybox
 * Uses a large sphere with inverted normals for efficient sky rendering
 */
export const Sky: React.FC = () => {
  return (
    <>
      {/* Ambient light for overall scene illumination */}
      <ambientLight intensity={0.6} />

      {/* Directional light for sun */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Sky dome with gradient */}
      <mesh scale={[-1, 1, 1]} position={[0, 0, 0]}>
        {' '}
        {/* Negative scale to invert */}
        <sphereGeometry args={[50, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color="#87CEEB" // Sky blue
          fog={false}
        />
      </mesh>
    </>
  );
};
