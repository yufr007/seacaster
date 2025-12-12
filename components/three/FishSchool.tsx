import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { GamePhase } from '../../types';

interface FishSchoolProps {
  phase: GamePhase;
  quality?: 'low' | 'medium' | 'high';
}

interface FishData {
  position: Vector3;
  velocity: Vector3;
  targetPosition: Vector3;
  speed: number;
}

/**
 * Fish School - Instanced rendering for performance
 * Uses simplified boid algorithm (battery-optimized)
 * Only renders during WAITING phase
 */
export const FishSchool: React.FC<FishSchoolProps> = ({ phase, quality = 'high' }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);

  // Adjust fish count based on quality
  const fishCount = quality === 'low' ? 20 : quality === 'medium' ? 35 : 50;

  // Initialize fish data
  const fishData = useMemo<FishData[]>(() => {
    return Array.from({ length: fishCount }, () => ({
      position: new Vector3(
        Math.random() * 16 - 8, // X: -8 to 8
        Math.random() * 2 - 3, // Y: -3 to -1 (underwater)
        Math.random() * 16 - 8 // Z: -8 to 8
      ),
      velocity: new Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.02
      ),
      targetPosition: new Vector3(0, -2, 0),
      speed: 0.01 + Math.random() * 0.02,
    }));
  }, [fishCount]);

  // Only animate when phase is WAITING
  useFrame(() => {
    if (phase !== GamePhase.WAITING || !meshRef.current) return;

    fishData.forEach((fish, i) => {
      // Simple flocking behavior
      // 1. Separation: Avoid crowding neighbors
      const separationForce = new Vector3();
      fishData.forEach((other, j) => {
        if (i !== j) {
          const distance = fish.position.distanceTo(other.position);
          if (distance < 1.0 && distance > 0) {
            const diff = fish.position.clone().sub(other.position);
            diff.normalize().divideScalar(distance);
            separationForce.add(diff);
          }
        }
      });

      // 2. Cohesion: Move towards average position of neighbors
      if (Math.random() > 0.95) {
        // Occasionally update target
        fish.targetPosition.set(
          Math.random() * 12 - 6,
          -2 + Math.random() * 1,
          Math.random() * 12 - 6
        );
      }

      // Update velocity
      const toTarget = fish.targetPosition.clone().sub(fish.position).normalize();
      fish.velocity.add(toTarget.multiplyScalar(0.001));
      fish.velocity.add(separationForce.multiplyScalar(0.002));

      // Limit speed
      const speed = fish.velocity.length();
      if (speed > fish.speed) {
        fish.velocity.normalize().multiplyScalar(fish.speed);
      }

      // Update position
      fish.position.add(fish.velocity);

      // Boundary wrapping
      if (Math.abs(fish.position.x) > 10) fish.position.x *= -0.9;
      if (Math.abs(fish.position.z) > 10) fish.position.z *= -0.9;
      if (fish.position.y < -4) fish.position.y = -1;
      if (fish.position.y > -1) fish.position.y = -4;

      // Set instance matrix
      tempObject.position.copy(fish.position);

      // Rotation to face movement direction
      const direction = fish.velocity.clone().normalize();
      tempObject.lookAt(fish.position.clone().add(direction));
      tempObject.rotateY(Math.PI / 2); // Adjust for cone orientation

      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Don't render if not in WAITING phase
  if (phase !== GamePhase.WAITING) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, fishCount]} castShadow>
      {/* Simple cone shape for fish */}
      <coneGeometry args={[0.08, 0.25, 6]} />
      <meshStandardMaterial color="#334455" opacity={0.5} transparent roughness={0.6} />
    </instancedMesh>
  );
};
