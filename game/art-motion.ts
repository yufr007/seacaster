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

/** GLB attributes may share an interleaved buffer. Read the accessor, not its raw array. */
export function snapshotVec3(attribute: { count: number; getX(index: number): number; getY(index: number): number; getZ(index: number): number }): Float32Array {
  const values = new Float32Array(attribute.count * 3);
  for (let i = 0; i < attribute.count; i++) {
    values[i * 3] = attribute.getX(i);
    values[i * 3 + 1] = attribute.getY(i);
    values[i * 3 + 2] = attribute.getZ(i);
  }
  return values;
}

/** Shadows add contact on the working deck, not on distant foliage or underwater wildlife. */
export function artCastsShadow(name: string): boolean {
  return ['Pier', 'Skiff', 'Yacht', 'BaitChest', 'Rod'].includes(name);
}
/** Matte wood, foliage and cloth use direct/hemisphere lighting instead of cube-map filtering. */
export function needsArtReflection(roughness: number, metalness: number): boolean {
  return roughness < .5 || metalness > .1;
}
