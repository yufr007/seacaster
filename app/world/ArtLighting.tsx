import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { ACESFilmicToneMapping, Color, Fog, MeshStandardMaterial, PCFSoftShadowMap, PMREMGenerator, SRGBColorSpace } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ART_URL } from './ArtModels';
import { needsArtReflection } from '../../game/art-motion';
import type { WorldProps } from './types';

/**
 * Mobile-first art lighting: one bounded soft key, a cheap hemispheric fill and a tiny rim.
 * Materials receive a PMREM reflection only when their roughness/metalness warrants it.
 * Atmospheric perspective is scene fog, not a post-process pass, keeping the Base web build light.
 */
export function ArtLighting({ sky }: Pick<WorldProps, 'sky'>) {
  const { gl, scene } = useThree();
  const { materials } = useGLTF(ART_URL, false);

  useEffect(() => {
    const environment = new RoomEnvironment();
    const generator = new PMREMGenerator(gl);
    const map = generator.fromScene(environment, .04);
    const changes = Object.values(materials).filter((m): m is MeshStandardMaterial => m instanceof MeshStandardMaterial)
      .map(material => ({ material, previous: material.envMap }));
    const previousFog = scene.fog;

    for (const { material } of changes) {
      material.envMap = needsArtReflection(material.roughness, material.metalness) ? map.texture : null;
      material.needsUpdate = true;
    }

    gl.outputColorSpace = SRGBColorSpace;
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = .96;
    gl.shadowMap.type = PCFSoftShadowMap;
    scene.fog = new Fog('#bce8dc', 52, 132);

    environment.dispose();
    generator.dispose();
    return () => {
      for (const { material, previous } of changes) {
        material.envMap = previous;
        material.needsUpdate = true;
      }
      scene.fog = previousFog;
      map.dispose();
    };
  }, [gl, materials, scene]);

  useEffect(() => {
    for (const material of Object.values(materials)) {
      if (material instanceof MeshStandardMaterial) {
        material.envMapIntensity = .16 + sky.daylight * .34;
      }
    }
    if (scene.fog instanceof Fog) {
      const night = new Color('#243e59');
      const day = new Color('#c5eee0');
      const warm = new Color('#e7bfaa');
      scene.fog.color.copy(night).lerp(day, sky.daylight).lerp(warm, sky.warmth * .22);
      scene.fog.near = 48 - sky.warmth * 4;
      scene.fog.far = 130;
    }
  }, [materials, scene, sky.daylight, sky.warmth]);

  const keyColor = sky.daylight > .5 ? '#ffe8bd' : '#91afe0';
  const rimColor = sky.daylight > .45 ? '#90e3d3' : '#6687ba';

  return <>
    <hemisphereLight args={[sky.daylight > .5 ? '#dff5ff' : '#789bc8', '#536d62', .72 + sky.daylight * .26]} />
    <directionalLight
      position={[-7, 12, 8]}
      intensity={.82 + sky.daylight * 1.62}
      color={keyColor}
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-9}
      shadow-camera-right={9}
      shadow-camera-top={10}
      shadow-camera-bottom={-8}
      shadow-camera-near={.5}
      shadow-camera-far={35}
      shadow-bias={-.00012}
      shadow-normalBias={.04}
    />
    <directionalLight position={[8, 5, -10]} intensity={.16 + sky.daylight * .14} color={rimColor} />
  </>;
}
