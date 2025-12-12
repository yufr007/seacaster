import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { Group } from 'three';
import { GamePhase } from '../../types';
import { useGameStore } from '../../store/gameStore';

interface FishingRodProps {
  phase: GamePhase;
}

/**
 * 3D Fishing Rod with Progressive Upgrades
 * - Bamboo (L1): Basic brown rod
 * - Handle (L10): Grip texture
 * - Carbon (L20): Sleek black carbon fiber
 * - Hook (L30): Gold fishing hook
 * - Reel (L40): Gold reel mechanism
 */
export const FishingRod: React.FC<FishingRodProps> = ({ phase }) => {
  const { userStats } = useGameStore();
  const groupRef = useRef<Group>(null);

  // Upgrades based on level
  const hasHandle = userStats.level >= 10;
  const hasCarbon = userStats.level >= 20;
  const hasHook = userStats.level >= 30;
  const hasReel = userStats.level >= 40;

  // Spring animation for casting
  const { rotation } = useSpring({
    rotation:
      phase === GamePhase.CASTING
        ? [-Math.PI / 3, 0, 0.1] // Cast backward
        : phase === GamePhase.HOOKED
          ? [-0.1, 0, 0] // Slight bend when hooked
          : [0, 0, 0], // Idle
    config: { tension: 120, friction: 14 },
  });

  // Rod colors
  const rodColor = hasCarbon ? '#1a1a1a' : '#8B4513'; // Carbon black or bamboo brown
  const handleColor = hasHandle ? '#4A2511' : rodColor;

  return (
    <animated.group
      ref={groupRef}
      position={[4, 1, 5]} // Position on right side of pier
      rotation={rotation as any}
    >
      {/* Main rod body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.02, 3, 12]} />
        <meshStandardMaterial
          color={rodColor}
          roughness={hasCarbon ? 0.3 : 0.7}
          metalness={hasCarbon ? 0.6 : 0.1}
        />
      </mesh>

      {/* Handle grip (L10+) */}
      {hasHandle && (
        <mesh position={[0, -1.2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.4, 12]} />
          <meshStandardMaterial color={handleColor} roughness={0.9} />
        </mesh>
      )}

      {/* Reel mechanism (L40+) */}
      {hasReel && (
        <group position={[0, -0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
          {/* Reel body */}
          <mesh castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
            <meshStandardMaterial color="#FFD700" roughness={0.2} metalness={0.9} />
          </mesh>

          {/* Reel handle */}
          <mesh position={[0.15, 0, 0]} castShadow>
            <torusGeometry args={[0.04, 0.01, 8, 16]} />
            <meshStandardMaterial color="#FFD700" metalness={0.9} />
          </mesh>
        </group>
      )}

      {/* Fishing line guides */}
      {[0.8, 0.4, 0, -0.4].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.05, 0.005, 8, 12]} />
          <meshStandardMaterial color="#333333" metalness={0.8} />
        </mesh>
      ))}

      {/* Hook at tip (L30+) */}
      {hasHook && (
        <mesh position={[0, 1.6, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <torusGeometry args={[0.08, 0.015, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#FFD700" roughness={0.2} metalness={0.9} />
        </mesh>
      )}

      {/* Fishing line (simple line geometry) */}
      {(phase === GamePhase.CASTING ||
        phase === GamePhase.WAITING ||
        phase === GamePhase.HOOKED) && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([0, 1.5, 0, 0, -5, -3])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" linewidth={2} opacity={0.6} transparent />
        </line>
      )}
    </animated.group>
  );
};
