import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

/**
 * Frame Rate Limiter Hook
 * Throttles animations to target FPS for battery optimization
 * Default: 30fps (mobile battery-friendly)
 *
 * Usage:
 * ```tsx
 * useFrameLimit(() => {
 *   // Your animation logic here
 * }, 30);
 * ```
 */
export const useFrameLimit = (callback: (delta: number) => void, fps: number = 30) => {
  const lastFrameTime = useRef(performance.now());
  const frameInterval = 1000 / fps;

  useFrame((state, delta) => {
    const now = performance.now();
    const timeSinceLastFrame = now - lastFrameTime.current;

    if (timeSinceLastFrame >= frameInterval) {
      callback(delta);
      // Subtract remainder to avoid drift
      lastFrameTime.current = now - (timeSinceLastFrame % frameInterval);
    }
  });
};
