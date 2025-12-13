import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, WebGLRenderer } from 'three';
import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../types';
import { PerformanceMonitor, QualityLevel } from '../utils/performanceMonitor';
import SwipeCasting from './SwipeCasting';

// Three.js components
import { Ocean } from './three/Ocean';
import { Sky } from './three/Sky';
import { Pier } from './three/Pier';
import { FishingRod } from './three/FishingRod';
import { FishSchool } from './three/FishSchool';
import { PrestigeShip } from './three/PrestigeShip';

/**
 * Responsive handler for R3F Canvas
 * Ensure Three.js canvas resizes correctly on mobile landscape/portrait changes
 */
const ResponsiveHandler = () => {
  const { gl, camera } = useThree();

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Explicitly control size and pixel ratio
      gl.setPixelRatio(window.devicePixelRatio);
      gl.setSize(width, height);

      // Update camera
      if ((camera as PerspectiveCamera).isPerspectiveCamera) {
        (camera as PerspectiveCamera).aspect = width / height;
        (camera as PerspectiveCamera).updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Initial setup
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [gl, camera]);

  return null;
};

/**
 * Three.js 3D Fishing Scene
 * Mobile-optimized with 30fps target and adaptive quality
 * Replaces 2D Framer Motion with full WebGL 3D rendering
 */
const ThreeFishingScene: React.FC = () => {
  const { phase, castLine, attemptCatch, userStats, finishCatchAnimation } = useGameStore();
  const [quality, setQuality] = useState<QualityLevel>('high');
  const perfMonitor = useRef(new PerformanceMonitor());
  // Initialize with correct DPR
  const [pixelRatio, setPixelRatio] = useState<number>(typeof window !== 'undefined' ? window.devicePixelRatio : 1);

  // Monitor performance and adjust quality
  useEffect(() => {
    const interval = setInterval(() => {
      const newQuality = perfMonitor.current.getQualityLevel();
      const newPixelRatio = perfMonitor.current.getPixelRatio();

      if (newQuality !== quality) {
        console.log(`[Performance] Quality adjusted: ${quality} → ${newQuality}`);
        setQuality(newQuality);
      }

      // Only update if significantly different to avoid jitter, but allow initial fetch
      if (Math.abs(newPixelRatio - pixelRatio) > 0.1) {
        setPixelRatio(newPixelRatio);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [quality, pixelRatio]);

  // Handle tap for catching fish
  const handleTap = () => {
    if (phase === GamePhase.HOOKED) {
      attemptCatch();
      if (navigator.vibrate) {
        navigator.vibrate([100, 30, 80]);
      }
    }
  };

  // Auto-finish prestige animation
  useEffect(() => {
    if (phase === GamePhase.ANIMATING_CATCH) {
      const timer = setTimeout(() => {
        finishCatchAnimation();
      }, 3000); // 3 second animation
      return () => clearTimeout(timer);
    }
  }, [phase, finishCatchAnimation]);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-sky-300 to-sky-600"
      onClick={handleTap}
    >
      {/* FPS Counter (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 z-50 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
          FPS: {perfMonitor.current.getFPS()} | Quality: {quality.toUpperCase()}
        </div>
      )}

      {/* Three.js Canvas */}
      <Canvas
        camera={{
          position: [0, 5, 12],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        dpr={pixelRatio} // Adaptive pixel ratio
        performance={{ min: 0.5 }} // Allow degradation
        gl={{
          powerPreference: 'low-power', // Battery optimization
          antialias: quality === 'high', // Disable AA on low quality
          alpha: false,
        }}
        shadows={quality !== 'low'} // Disable shadows on low quality
        onCreated={({ gl }) => {
          // Enable physically correct lighting
          // @ts-ignore - Legacy property support for older three.js versions or R3F wrapper quirks
          gl.physicallyCorrectLights = true;
        }}
      >
        <Suspense fallback={null}>
          <ResponsiveHandler />
          {/* Scene components */}
          <Sky />
          <Ocean phase={phase} />
          <Pier />
          <FishingRod phase={phase} />
          <FishSchool phase={phase} quality={quality} />

          {/* Prestige animation (L50+ Premium Only) */}
          {phase === GamePhase.ANIMATING_CATCH && userStats.level >= 50 && userStats.premium && <PrestigeShip />}

          {/* Performance monitoring */}
          <PerformanceTracker monitor={perfMonitor.current} />
        </Suspense>
      </Canvas>

      {/* UI Overlays (identical to 2D version) */}
      {/* SwipeCasting Overlay - Premium physics-based casting UI */}
      <SwipeCasting onCast={castLine} disabled={phase !== GamePhase.IDLE} />

      {phase === GamePhase.HOOKED && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-red-500 text-white text-4xl font-bold px-8 py-4 rounded-full shadow-2xl animate-pulse">
            TAP TO CATCH!
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Performance Tracker Component
 * Updates performance monitor every frame
 */

/**
 * Performance Tracker Component
 * Updates performance monitor every frame
 */
const PerformanceTracker: React.FC<{ monitor: PerformanceMonitor }> = ({ monitor }) => {
  useFrame(() => {
    monitor.update();
  });

  return null;
};

export default ThreeFishingScene;
