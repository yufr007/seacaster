/**
 * Performance Monitor
 * Tracks FPS and adjusts quality dynamically
 * for battery optimization on low-end devices
 */

export type QualityLevel = 'low' | 'medium' | 'high';

export class PerformanceMonitor {
  private fps: number = 60;
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private fpsHistory: number[] = [];
  private readonly historySize = 60; // 1 second of history at 60fps

  /**
   * Update FPS counter
   * Call this every frame in useFrame
   */
  update(): number {
    this.frameCount++;
    const now = performance.now();

    if (now >= this.lastTime + 1000) {
      this.fps = this.frameCount;
      this.fpsHistory.push(this.fps);

      // Keep only recent history
      if (this.fpsHistory.length > this.historySize) {
        this.fpsHistory.shift();
      }

      this.frameCount = 0;
      this.lastTime = now;
    }

    return this.fps;
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get average FPS from history
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return this.fps;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * Determine quality level based on performance
   * Low: < 25fps avg
   * Medium: 25-45fps avg
   * High: > 45fps avg
   */
  getQualityLevel(): QualityLevel {
    const avgFps = this.getAverageFPS();

    if (avgFps < 25) return 'low';
    if (avgFps < 45) return 'medium';
    return 'high';
  }

  /**
   * Get recommended pixel ratio based on quality
   */
  getPixelRatio(): number {
    const quality = this.getQualityLevel();
    switch (quality) {
      case 'low':
        return 0.5;
      case 'medium':
        return 0.75;
      case 'high':
        return Math.min(window.devicePixelRatio, 1.5);
      default:
        return 1.0;
    }
  }

  /**
   * Check if performance is degraded
   */
  isPerformanceDegraded(): boolean {
    return this.getAverageFPS() < 20;
  }

  /**
   * Reset monitoring
   */
  reset(): void {
    this.fps = 60;
    this.frameCount = 0;
    this.fpsHistory = [];
    this.lastTime = performance.now();
  }
}
