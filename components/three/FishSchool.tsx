
import React, { useRef, useMemo } from 'react';
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
}

/**
 * Fish School - Boids Algorithm Implementation
 * - Separation: Avoid crowding local flockmates
 * - Alignment: Steer towards the average heading of local flockmates
 * - Cohesion: Steer to move towards the average position (center of mass) of local flockmates
 */
export const FishSchool: React.FC<FishSchoolProps> = ({ phase, quality = 'high' }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);

  // Fish count based on quality
  const fishCount = quality === 'low' ? 30 : quality === 'medium' ? 60 : 100;

  // Initialize fish data
  const fishData = useMemo<FishData[]>(() => {
    return Array.from({ length: fishCount }, () => ({
      position: new Vector3(
        (Math.random() - 0.5) * 20,
        -2 - Math.random() * 3,
        (Math.random() - 0.5) * 20
      ),
      velocity: new Vector3(
        (Math.random() - 0.5) * 0.05,
        0,
        (Math.random() - 0.5) * 0.05
      ).normalize().multiplyScalar(0.02)
    }));
  }, [fishCount]);

  // Parameters
  const perceptionRadius = 2.5;
  const maxSpeed = 0.04;
  const maxForce = 0.001;

  useFrame(() => {
    if (phase !== GamePhase.WAITING || !meshRef.current) return;

    // Center of the "pond" to attract fish back
    const center = new Vector3(0, -3, 0);

    for (let i = 0; i < fishCount; i++) {
      const fish = fishData[i];
      const position = fish.position;
      const velocity = fish.velocity;

      const alignment = new Vector3();
      const cohesion = new Vector3();
      const separation = new Vector3();
      let total = 0;

      // 1. Perception Loop
      for (let j = 0; j < fishCount; j++) {
        if (i === j) continue;

        const other = fishData[j];
        const dist = position.distanceTo(other.position);

        if (dist < perceptionRadius) {
          // Alignment
          alignment.add(other.velocity);

          // Cohesion
          cohesion.add(other.position);

          // Separation relative to distance
          const diff = new Vector3().subVectors(position, other.position);
          diff.divideScalar(dist * dist); // Weight by inverse square distance
          separation.add(diff);

          total++;
        }
      }

      if (total > 0) {
        // Average out
        alignment.divideScalar(total).normalize().multiplyScalar(maxSpeed).sub(velocity).clampLength(0, maxForce);
        cohesion.divideScalar(total).sub(position).normalize().multiplyScalar(maxSpeed).sub(velocity).clampLength(0, maxForce);
        separation.divideScalar(total).normalize().multiplyScalar(maxSpeed).sub(velocity).clampLength(0, maxForce);
      }

      // 2. Apply Forces (Weights)
      velocity.add(alignment.multiplyScalar(1.0));
      velocity.add(cohesion.multiplyScalar(0.8));
      velocity.add(separation.multiplyScalar(1.2));

      // 3. Boundary / Center Attraction (Soft Bounds)
      // Gently steer back if getting too far
      if (position.length() > 12) {
        const toCenter = new Vector3().subVectors(center, position).normalize().multiplyScalar(0.002);
        velocity.add(toCenter);
      }

      // Vertical Bounds
      if (position.y > -1) velocity.y -= 0.002;
      if (position.y < -6) velocity.y += 0.002;

      // 4. Update Physics
      velocity.clampLength(0.01, maxSpeed); // Min/Max speed
      position.add(velocity);

      // 5. Update Matrix
      tempObject.position.copy(position);

      // Look in direction of movement
      const lookTarget = position.clone().add(velocity);
      tempObject.lookAt(lookTarget);
      // Rotate to align cone correctly (cone defaults to pointing up Y, we need it to point Z typically or match lookAt)
      // Three.js LookAt points +Z axis towards target. 
      // Cone geometry points up +Y. 
      // Start: Up (+Y). Target: Forward (+Z). Rotation X: -90 deg.
      tempObject.rotateX(-Math.PI / 2);

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (phase !== GamePhase.WAITING) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, fishCount]} castShadow>
      {/* Sleek fish shape */}
      <coneGeometry args={[0.06, 0.25, 8]} />
      <meshStandardMaterial color="#4A90E2" roughness={0.4} metalness={0.6} />
    </instancedMesh>
  );
};
