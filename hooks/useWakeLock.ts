import { useEffect, useRef } from 'react';

/**
 * Wake Lock Hook
 * Prevents screen from dimming/sleeping during active gameplay
 * Battery-friendly: Only locks when actively needed
 *
 * Usage:
 * ```tsx
 * useWakeLock(activeTab === 'fish'); // Keep screen on during fishing
 * ```
 */
export const useWakeLock = (active: boolean) => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Check if Wake Lock API is supported
    if (!active || !('wakeLock' in navigator)) {
      return;
    }

    const requestWakeLock = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('[WakeLock] Screen wake lock enabled');

        // Re-acquire wake lock when page becomes visible again
        const handleVisibilityChange = async () => {
          if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            console.log('[WakeLock] Screen wake lock re-acquired');
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup listener
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      } catch (err) {
        console.warn('[WakeLock] Failed to acquire:', err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('[WakeLock] Screen wake lock released');
      }
    };
  }, [active]);
};
