import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { Points, PointsMaterial, BufferGeometry, Vector3, Color } from 'three';

/**
 * Prestige Ship - Level 50 Animation
 * 3D pirate ship slides in, fires cannon, fish flies into basket
 * Uses primitive shapes as fallback (no GLTF required)
 */
export const PrestigeShip: React.FC = () => {
  const particlesRef = useRef<Points>(null);
  const [cannonFired, setCannonFired] = useState(false);
  const [particlePositions, setParticlePositions] = useState<Float32Array>();

  // Ship animation: Slides in from right
  const { position } = useSpring({
    from: { position: [25, 0, -8] },
    to: { position: [8, 0, -8] },
    config: { duration: 1000, easing: (t: number) => 1 - Math.pow(1 - t, 3) }, // Ease out cubic
  });

  // Create particle system for cannon explosion
  const particleCount = 100;
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Orange/red fire colors
      const color = new Color(Math.random() > 0.5 ? 0xff6600 : 0xff3300);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, colors };
  }, []);

  // Fire cannon after ship arrives
  useEffect(() => {
    const timer = setTimeout(() => {
      setCannonFired(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Animate particles after cannon fires
  useFrame((state, delta) => {
    if (!cannonFired || !particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      // Spread outward from cannon position
      positions[i * 3] += Math.sin(i * 0.1) * 0.15; // X
      positions[i * 3 + 1] += Math.cos(i * 0.05) * 0.1 - 0.05; // Y (gravity)
      positions[i * 3 + 2] += Math.cos(i * 0.1) * 0.15; // Z

      // Fade out over time
      if (positions[i * 3 + 1] < -5) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <animated.group position={position as any}>
      {/* Ship Hull (Brown box) */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[4, 1.5, 2]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>

      {/* Ship Deck (Lighter brown) */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[4.2, 0.2, 2.2]} />
        <meshStandardMaterial color="#8B6F47" roughness={0.8} />
      </mesh>

      {/* Main Mast */}
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 4, 12]} />
        <meshStandardMaterial color="#3E2723" />
      </mesh>

      {/* Sail (White cloth) */}
      <mesh position={[0, 3, 0]} castShadow>
        <planeGeometry args={[2.5, 3]} />
        <meshStandardMaterial color="#FFFFFF" side={2} />
      </mesh>

      {/* Crow's Nest */}
      <mesh position={[0, 4.8, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.25, 0.3, 12]} />
        <meshStandardMaterial color="#3E2723" />
      </mesh>

      {/* Pirate Flag (Black with skull emoji texture) */}
      <mesh position={[0, 5.8, 0]} castShadow>
        <planeGeometry args={[0.8, 0.6]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Cannon (Gold) */}
      <group position={[-1.5, 1, 1]} rotation={[0, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.12, 1.2, 12]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.8} />
        </mesh>

        {/* Cannon wheels */}
        <mesh position={[0, -0.2, -0.3]}>
          <cylinderGeometry args={[0.15, 0.15, 0.05, 12]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#3E2723" />
        </mesh>
        <mesh position={[0, -0.2, 0.3]}>
          <cylinderGeometry args={[0.15, 0.15, 0.05, 12]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#3E2723" />
        </mesh>
      </group>

      {/* Particle explosion (cannon fire) */}
      {cannonFired && (
        <points ref={particlesRef} position={[-2, 1, 1]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particleCount}
              array={particles.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={particleCount}
              array={particles.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial size={0.15} vertexColors transparent opacity={0.8} />
        </points>
      )}

      {/* Fish projectile (flies toward basket after cannon fires) */}
      {cannonFired && <FishProjectile />}
    </animated.group>
  );
};

/**
 * Fish Projectile - Ballistic trajectory from cannon to basket
 */
const FishProjectile: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [progress, setProgress] = useState(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const newProgress = Math.min(progress + delta * 0.4, 1);
    setProgress(newProgress);

    // Ballistic trajectory (parabola)
    const startPos = new Vector3(-2, 1, 1); // Cannon mouth
    const endPos = new Vector3(4, 0.5, 6); // Landing basket
    const height = 5; // Arc height

    const x = startPos.x + (endPos.x - startPos.x) * newProgress;
    const z = startPos.z + (endPos.z - startPos.z) * newProgress;
    const y = startPos.y + (endPos.y - startPos.y) * newProgress + Math.sin(newProgress * Math.PI) * height;

    meshRef.current.position.set(x, y, z);
    meshRef.current.rotation.y += delta * 10; // Spin
    meshRef.current.rotation.x += delta * 5;
  });

  return (
    <mesh ref={meshRef}>
      <coneGeometry args={[0.15, 0.4, 6]} />
      <meshStandardMaterial color="#FF6B35" emissive="#FF3300" emissiveIntensity={0.3} />
    </mesh>
  );
};
