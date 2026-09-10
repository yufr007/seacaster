/** Presentation-only deformation. No catch outcomes or economy state live here. */
const GRIP = .73;
const TIP = 3.55;
export function bendRodVertex(x: number, y: number, z: number, bend: number): [number, number, number] {
  const u = Math.max(0, Math.min(1, (y - GRIP) / (TIP - GRIP)));
  return [x - bend * u * u, y, z];
}
export function bendRodNormal(x: number, y: number, z: number, height: number, bend: number): [number, number, number] {
  const u = Math.max(0, Math.min(1, (height - GRIP) / (TIP - GRIP)));
  const adjustedY = y + 2 * bend * u / (TIP - GRIP) * x;
  const length = Math.hypot(x, adjustedY, z) || 1;
  return [x / length, adjustedY / length, z / length];
}
/** Shared with shaders/water.ts: world-space Y, including the surface offset. */
export function waveHeight(x: number, z: number, time: number): number {
  return -.05 + Math.sin(x * .6 + time * .85) * .075 + Math.cos(z * .43 + time * .6) * .055;
}
