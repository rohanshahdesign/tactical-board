import React, { Suspense, useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Line, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useTacticalStore } from '../../store/tacticalStore';
import { PITCH } from '../../types';
import {
  DEBUG_3D_BORDER_VISIBLE,
  SCENE_SCALE,
  STADIUM_DEBUG_Y,
  STADIUM_INTERACTION_Y,
  STADIUM_PLAYABLE_LENGTH,
  STADIUM_PLAYABLE_WIDTH,
} from './pitch3dConstants';

const STADIUM_PATH = '/assets/models/football-field/soccer_stadium.glb';

// After Z-up→Y-up rotation the model's playing field spans roughly
// x: ±28.6 (touchline) and z: ±17.5 (goal-line).
// We scale it so the pitch maps to PITCH.LENGTH × PITCH.WIDTH in world coords,
// then apply SCENE_SCALE to shrink everything to a viewable size.
const S = SCENE_SCALE;
const MODEL_HALF_X = 28.6;
const MODEL_HALF_Z = 17.5;
const STADIUM_VISUAL_SCALE = 0.03;
const SCALE_X = (PITCH.HALF_LENGTH / MODEL_HALF_X) * S * STADIUM_VISUAL_SCALE;
const SCALE_Z = (PITCH.HALF_WIDTH / MODEL_HALF_Z) * S * STADIUM_VISUAL_SCALE;
const SCALE_Y = ((SCALE_X + SCALE_Z) / 2); // uniform-ish for height
const STADIUM_PLAYABLE_HALF_LENGTH = STADIUM_PLAYABLE_LENGTH / 2;
const STADIUM_PLAYABLE_HALF_WIDTH = STADIUM_PLAYABLE_WIDTH / 2;

const BoundaryDebug: React.FC = () => {
  const debugPoints = useMemo<Array<[number, number, number]>>(
    () => [
      [-STADIUM_PLAYABLE_HALF_LENGTH * S, STADIUM_DEBUG_Y, -STADIUM_PLAYABLE_HALF_WIDTH * S],
      [STADIUM_PLAYABLE_HALF_LENGTH * S, STADIUM_DEBUG_Y, -STADIUM_PLAYABLE_HALF_WIDTH * S],
      [STADIUM_PLAYABLE_HALF_LENGTH * S, STADIUM_DEBUG_Y, STADIUM_PLAYABLE_HALF_WIDTH * S],
      [-STADIUM_PLAYABLE_HALF_LENGTH * S, STADIUM_DEBUG_Y, STADIUM_PLAYABLE_HALF_WIDTH * S],
      [-STADIUM_PLAYABLE_HALF_LENGTH * S, STADIUM_DEBUG_Y, -STADIUM_PLAYABLE_HALF_WIDTH * S],
    ],
    []
  );

  const corners = useMemo(
    () => [
      [-STADIUM_PLAYABLE_HALF_LENGTH * S, STADIUM_DEBUG_Y, -STADIUM_PLAYABLE_HALF_WIDTH * S],
      [STADIUM_PLAYABLE_HALF_LENGTH * S, STADIUM_DEBUG_Y, -STADIUM_PLAYABLE_HALF_WIDTH * S],
      [STADIUM_PLAYABLE_HALF_LENGTH * S, STADIUM_DEBUG_Y, STADIUM_PLAYABLE_HALF_WIDTH * S],
      [-STADIUM_PLAYABLE_HALF_LENGTH * S, STADIUM_DEBUG_Y, STADIUM_PLAYABLE_HALF_WIDTH * S],
    ],
    []
  );

  return (
    <group>
      <Line points={debugPoints} color="#ff2da6" lineWidth={2} transparent opacity={0.95} />

      {corners.map((position, index) => (
        <mesh key={index} position={position as [number, number, number]} renderOrder={5}>
          <sphereGeometry args={[0.38 * S, 10, 10]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.95} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

const StadiumModel: React.FC = () => {
  const { scene } = useGLTF(STADIUM_PATH);

  const cloned = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });

    const box = new THREE.Box3().setFromObject(s);
    const center = box.getCenter(new THREE.Vector3());
    s.position.x -= center.x;
    s.position.z -= center.z;
    s.position.y -= box.min.y;

    return s;
  }, [scene]);

  return (
    <primitive
      object={cloned}
      scale={[SCALE_X, SCALE_Y, SCALE_Z]}
      position={[0, 0, 0]}
    />
  );
};

useGLTF.preload(STADIUM_PATH);

const InteractionPlane: React.FC<Pitch3DProps> = ({ onPitchPointerDown }) => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, STADIUM_INTERACTION_Y, 0]}
      onPointerDown={onPitchPointerDown}
      receiveShadow={false}
      renderOrder={1}
    >
      <planeGeometry args={[STADIUM_PLAYABLE_HALF_LENGTH * 2 * S, STADIUM_PLAYABLE_HALF_WIDTH * 2 * S]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
};

interface Pitch3DProps {
  onPitchPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

export const Pitch3D: React.FC<Pitch3DProps> = ({ onPitchPointerDown }) => {
  const showField = useTacticalStore((s) => s.sceneVisibility.field);

  return (
    <group>
      <InteractionPlane onPitchPointerDown={onPitchPointerDown} />
      {DEBUG_3D_BORDER_VISIBLE ? <BoundaryDebug /> : null}

      {/* Stadium GLB */}
      {showField ? (
        <Suspense fallback={null}>
          <StadiumModel />
        </Suspense>
      ) : null}
    </group>
  );
};
