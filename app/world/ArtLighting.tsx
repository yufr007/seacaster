import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { ACESFilmicToneMapping, MeshStandardMaterial, PMREMGenerator, SRGBColorSpace } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ART_URL } from './ArtModels';
import { needsArtReflection } from '../../game/art-motion';
import type { WorldProps } from './types';

/** One key shadow plus soft reflection fill; no external HDR download or postprocess stack. */
export function ArtLighting({ sky }: Pick<WorldProps, 'sky'>) {
  const { gl } = useThree();
  const { materials } = useGLTF(ART_URL, false);
  useEffect(() => {
    const environment = new RoomEnvironment();
    const generator = new PMREMGenerator(gl);
    const map = generator.fromScene(environment, .04);
    const changes = Object.values(materials).filter((m): m is MeshStandardMaterial => m instanceof MeshStandardMaterial)
      .map(material => ({ material, previous: material.envMap }));
    for (const { material } of changes) {
      material.envMap = needsArtReflection(material.roughness, material.metalness) ? map.texture : null;
      material.needsUpdate = true;
    }
    gl.outputColorSpace = SRGBColorSpace;
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    environment.dispose(); generator.dispose();
    return () => {
      for (const { material, previous } of changes) { material.envMap = previous; material.needsUpdate = true; }
      map.dispose();
    };
  }, [gl, materials]);
  useEffect(() => {
    for (const material of Object.values(materials)) {
      if (material instanceof MeshStandardMaterial) material.envMapIntensity = .18 + sky.daylight * .36;
    }
  }, [materials, sky.daylight]);
  return <>
    <hemisphereLight args={[sky.daylight > .5 ? '#e3f5ff' : '#87b9e7', '#627a66', .65 + sky.daylight * .3]} />
    <directionalLight position={[-7, 12, 8]} intensity={.65 + sky.daylight * 2.0} color={sky.daylight > .5 ? '#fff0cb' : '#99bde4'} castShadow
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9}
      shadow-camera-top={10} shadow-camera-bottom={-8} shadow-camera-near={.5} shadow-camera-far={35}
      shadow-bias={-.00015} shadow-normalBias={.035} />
  </>;
}
