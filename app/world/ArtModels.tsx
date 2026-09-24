import { useEffect, useMemo } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { AnimationMixer, Mesh, MeshStandardMaterial } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { bendRodNormal, bendRodVertex, snapshotVec3, artCastsShadow } from '../../game/art-motion';

export const ART_URL = '/models/sculpted/harbour-kit.glb';
type FishIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
export type SpeciesArtName = `Fish_f${FishIndex}`;
export type ArtName = 'Pier' | 'Skiff' | 'Yacht' | 'BaitChest' | 'Island' | 'LighthouseIsland' | 'InletBanks' | 'ReefFish' | 'Rod' | 'Bobber' | 'Gull' | 'AnglerHands' | SpeciesArtName;

function speciesArtName(speciesId: string): SpeciesArtName {
  if (!/^f(?:[1-9]|1[0-5])$/.test(speciesId)) throw new Error(`Unknown SeaCaster species art: ${speciesId}`);
  return `Fish_${speciesId}` as SpeciesArtName;
}

/** GLB is fetched once. Instances own transforms/morph weights, never cached mesh state. */
export function useArt(name: ArtName) {
  const gltf = useGLTF(ART_URL, false);
  const object = useMemo(() => {
    const source = gltf.scene.getObjectByName(name);
    if (!source) throw new Error(`SeaCaster art interface is missing: ${name}`);
    const instance = clone(source);
    instance.traverse(node => {
      if (node instanceof Mesh) {
        node.castShadow = artCastsShadow(name); node.receiveShadow = artCastsShadow(name);
      }
    });
    return instance;
  }, [gltf.scene, name]);
  return { object, animations: gltf.animations };
}
export function ArtObject({ name }: { name: ArtName }) {
  const { object } = useArt(name);
  return <primitive object={object} dispose={null} />;
}
export function ArtReady({ onReady }: { onReady: () => void }) {
  useGLTF(ART_URL, false);
  useEffect(onReady, [onReady]);
  return null;
}

export function ArtFish({ reduced, size = 1, variant = 0 }: { reduced: boolean; size?: number; variant?: number }) {
  const { object, animations } = useArt('ReefFish');
  const mixer = useMemo(() => new AnimationMixer(object), [object]);
  const fins = useMemo(() => [object.getObjectByName('FinLeft'), object.getObjectByName('FinRight')], [object]);
  useEffect(() => {
    const names = new Set<string>(); object.traverse(node => names.add(node.name));
    for (const clip of animations) {
      const tracks = clip.tracks.filter(track => names.has(track.name.split('.')[0]));
      if (!tracks.length) continue;
      const localClip = clip.clone(); localClip.tracks = tracks;
      mixer.clipAction(localClip).play();
    }
    mixer.setTime(variant * .19);
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(object); };
  }, [mixer, object, animations, variant]);
  useFrame(({ clock }, delta) => {
    if (reduced) return;
    mixer.update(Math.min(delta, .08));
    fins.forEach((fin, i) => { if (fin) fin.rotation.x = Math.sin(clock.elapsedTime * 7 + variant) * .2 * (i ? 1 : -1); });
  });
  return <group scale={size}><primitive object={object} dispose={null} /></group>;
}

/** The landed catch resolves into its real catalogue model only after the server awards it. */
export function ArtSpeciesFish({ speciesId, reduced, size = 1 }: { speciesId: string; reduced: boolean; size?: number }) {
  const name = speciesArtName(speciesId);
  const { object } = useArt(name);
  const tail = useMemo(() => object.getObjectByName(`Tail_${speciesId}`), [object, speciesId]);
  const fins = useMemo(() => [object.getObjectByName('FinLeft'), object.getObjectByName('FinRight')], [object]);
  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    if (tail) tail.rotation.y = Math.sin(t * 7.4) * (speciesId === 'f14' ? .48 : .34);
    fins.forEach((fin, i) => { if (fin) fin.rotation.x = Math.sin(t * 6.1 + i * .8) * .16 * (i ? 1 : -1); });
  });
  return <group scale={size} data-species-art={speciesId}><primitive object={object} dispose={null} /></group>;
}

export function ArtBird({ reduced, offset = 0 }: { reduced: boolean; offset?: number }) {
  const { object } = useArt('Gull');
  const wings = useMemo(() => [object.getObjectByName('WingLeft'), object.getObjectByName('WingRight')], [object]);
  useFrame(({ clock }) => {
    const angle = reduced ? .08 : Math.sin(clock.elapsedTime * 5 + offset) * .4;
    wings.forEach((wing, i) => { if (wing) wing.rotation.x = angle * (i ? 1 : -1); });
  });
  return <primitive object={object} dispose={null} />;
}

export function ArtRod({ bend, holding, reduced, golden }: { bend: MutableRefObject<number>; holding: MutableRefObject<boolean>; reduced: boolean; golden: boolean }) {
  const { object } = useArt('Rod');
  const blank = useMemo(() => object.getObjectByName('RodBlank') as Mesh, [object]);
  const crank = useMemo(() => object.getObjectByName('ReelCrank'), [object]);
  const tip = useMemo(() => object.getObjectByName('RodTip'), [object]);
  const resources = useMemo(() => {
    if (!blank?.geometry) throw new Error('Authored rod blank is missing.');
    const geometry = blank.geometry.clone();
    const source = blank.geometry;
    const position = source.getAttribute('position'), normal = source.getAttribute('normal');
    const material = (blank.material as MeshStandardMaterial).clone();
    return { geometry, source, positions: snapshotVec3(position), normals: snapshotVec3(normal), material, sourceMaterial: blank.material };
  }, [blank]);
  useEffect(() => {
    resources.material.envMap = (resources.sourceMaterial as MeshStandardMaterial).envMap;
    resources.material.envMapIntensity = (resources.sourceMaterial as MeshStandardMaterial).envMapIntensity;
    resources.material.needsUpdate = true;
    blank.geometry = resources.geometry; blank.material = resources.material;
    return () => {
      blank.geometry = resources.source; blank.material = resources.sourceMaterial;
      resources.geometry.dispose(); resources.material.dispose();
    };
  }, [blank, resources]);
  useEffect(() => { resources.material.color.set(golden ? '#ddb86b' : '#314951'); resources.material.metalness = golden ? .55 : .24; }, [resources, golden]);
  useFrame((_state, delta) => {
    const positions = resources.geometry.getAttribute('position'), normals = resources.geometry.getAttribute('normal');
    for (let i = 0; i < positions.count; i++) {
      const k = i * 3, a = resources.positions, n = resources.normals;
      positions.setXYZ(i, ...bendRodVertex(a[k], a[k + 1], a[k + 2], bend.current));
      normals.setXYZ(i, ...bendRodNormal(n[k], n[k + 1], n[k + 2], a[k + 1], bend.current));
    }
    positions.needsUpdate = true; normals.needsUpdate = true;
    if (!resources.geometry.boundingSphere) resources.geometry.computeBoundingSphere();
    if (resources.geometry.boundingSphere) resources.geometry.boundingSphere.radius = 4;
    if (tip) tip.position.x = -bend.current;
    if (crank && holding.current && !reduced) crank.rotation.x += Math.min(delta, .1) * 18;
  });
  return <><primitive object={object} dispose={null} /><ArtObject name="AnglerHands" /></>;
}

export function ArtChest({ open, reduced, children }: { open: boolean; reduced: boolean; children?: React.ReactNode }) {
  const { object } = useArt('BaitChest');
  const lid = useMemo(() => object.getObjectByName('LidPivot'), [object]);
  useFrame((_state, dt) => {
    if (!lid) return;
    const target = open ? -1.8 : 0;
    lid.rotation.x += (target - lid.rotation.x) * (reduced ? 1 : 1 - Math.exp(-12 * Math.min(dt, .1)));
  });
  return <><primitive object={object} dispose={null} />{children}</>;
}
