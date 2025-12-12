import React from 'react';

/**
 * Pier Platform - Wooden dock where the player stands
 * Simple box geometry with wood texture color
 */
export const Pier: React.FC = () => {
  return (
    <group position={[0, -0.5, 6]}>
      {/* Main pier platform */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[8, 0.4, 4]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Left support post */}
      <mesh position={[-3, -2, 1]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
        <meshStandardMaterial color="#3E2723" roughness={0.8} />
      </mesh>

      {/* Right support post */}
      <mesh position={[3, -2, 1]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
        <meshStandardMaterial color="#3E2723" roughness={0.8} />
      </mesh>

      {/* Front left post */}
      <mesh position={[-3, -2, -1]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
        <meshStandardMaterial color="#3E2723" roughness={0.8} />
      </mesh>

      {/* Front right post */}
      <mesh position={[3, -2, -1]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
        <meshStandardMaterial color="#3E2723" roughness={0.8} />
      </mesh>
    </group>
  );
};
