import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useThree, ThreeEvent } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Player, Position2D, PITCH } from '../../types';
import { useTacticalStore } from '../../store/tacticalStore';
import {
  fromStadiumSpace,
  SCENE_SCALE,
  STADIUM_INTERACTION_Y,
  STADIUM_PITCH_Y,
  toStadiumSpace,
} from './pitch3dConstants';

const IDLE_MODEL_PATH = '/assets/models/players/model4.glb';
const RUN_MODEL_PATH = '/assets/models/players/slow_run.glb';

const S = SCENE_SCALE;
const IDLE_PLAYER_VISUAL_SCALE = 7;
const IDLE_PLAYER_Y_OFFSET = 1;

// Target height in world units at player.height = 1.0
const BASE_HEIGHT = 1.8;
// slow_run.glb is ~1.25 units from feet to head (Y-up)
const RUN_MODEL_HEIGHT = 1.25;
// model4.glb is Z-up, ~1625 units tall along Z
const IDLE_MODEL_Z_HEIGHT = 1625;

interface Player3DProps {
  player: Player;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (pos: Position2D) => void;
}

const createKitMaterial = (
  sourceMaterial: THREE.Material | THREE.Material[] | undefined,
  kitColor: string,
  isSelected: boolean
) => {
  const source = Array.isArray(sourceMaterial) ? sourceMaterial[0] : sourceMaterial;
  const meshMaterial = source as THREE.MeshStandardMaterial | undefined;
  const hasTextureMaps = Boolean(
    meshMaterial?.map || meshMaterial?.normalMap || meshMaterial?.roughnessMap || meshMaterial?.metalnessMap
  );
  const baseColor = hasTextureMaps
    ? (meshMaterial?.color?.clone() ?? new THREE.Color('#ffffff'))
    : new THREE.Color(kitColor);

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    map: meshMaterial?.map ?? null,
    normalMap: meshMaterial?.normalMap ?? null,
    roughnessMap: meshMaterial?.roughnessMap ?? null,
    metalnessMap: meshMaterial?.metalnessMap ?? null,
    alphaMap: meshMaterial?.alphaMap ?? null,
    transparent: source?.transparent ?? false,
    opacity: source?.opacity ?? 1,
    side: source?.side ?? THREE.FrontSide,
    roughness: meshMaterial?.roughness ?? 0.7,
    metalness: meshMaterial?.metalness ?? 0.05,
    emissive: isSelected ? new THREE.Color('#2563eb') : new THREE.Color('#000000'),
    emissiveIntensity: isSelected ? 0.3 : 0,
  });
};

/* ------------------------------------------------------------------ */
/*  Idle (still) model – static mesh, Z-up, needs rotation            */
/* ------------------------------------------------------------------ */
const IdleModel: React.FC<{ player: Player; isSelected: boolean }> = ({ player, isSelected }) => {
  const { scene } = useGLTF(IDLE_MODEL_PATH);

  const clonedScene = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = false;
        mesh.material = createKitMaterial(mesh.material, player.kitColor, isSelected);
      }
    });

    // model4.glb appears to import in an already-upright pose here,
    // so only apply a facing rotation instead of tipping it onto the turf.
    s.rotation.set(0, Math.PI / 2, 0);
    s.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(s);
    const center = box.getCenter(new THREE.Vector3());
    s.position.x -= center.x;
    s.position.z -= center.z;
    s.position.y -= box.min.y;
    s.updateMatrixWorld(true);

    return s;
  }, [scene, player.kitColor, isSelected]);

  const idleScale = (BASE_HEIGHT / IDLE_MODEL_Z_HEIGHT) * player.height * S * IDLE_PLAYER_VISUAL_SCALE;

  return (
    <primitive
      object={clonedScene}
      position={[0, IDLE_PLAYER_Y_OFFSET, 0]}
      scale={[idleScale, idleScale, idleScale]}
    />
  );
};

/* ------------------------------------------------------------------ */
/*  Run model – skinned mesh with Mixamo animation                    */
/* ------------------------------------------------------------------ */
const RunModel: React.FC<{
  player: Player;
  isSelected: boolean;
  yaw: number;
  scaleMultiplier: number;
  yOffset: number;
}> = ({ player, isSelected, yaw, scaleMultiplier, yOffset }) => {
  const { scene, animations } = useGLTF(RUN_MODEL_PATH);

  const clonedScene = useMemo(() => {
    const s = SkeletonUtils.clone(scene);
    s.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = false;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else {
          mesh.material = mesh.material.clone();
        }
      }
    });

    const box = new THREE.Box3().setFromObject(s);
    const center = box.getCenter(new THREE.Vector3());
    s.position.x -= center.x;
    s.position.z -= center.z;
    s.position.y -= box.min.y;

    return s;
  }, [scene]);

  useEffect(() => {
    clonedScene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          if ((mat as THREE.MeshStandardMaterial).color) {
            (mat as THREE.MeshStandardMaterial).emissive = isSelected
              ? new THREE.Color('#2563eb')
              : new THREE.Color('#000000');
            (mat as THREE.MeshStandardMaterial).emissiveIntensity = isSelected ? 0.3 : 0;
          }
        });
      }
    });
  }, [clonedScene, isSelected]);

  const { actions } = useAnimations(animations, clonedScene);
  useEffect(() => {
    const actionName = Object.keys(actions)[0];
    if (actionName && actions[actionName]) {
      actions[actionName]!.reset().fadeIn(0.2).play();
      return () => { actions[actionName]?.fadeOut(0.2); };
    }
  }, [actions]);

  const runScale = (BASE_HEIGHT / RUN_MODEL_HEIGHT) * player.height * S * scaleMultiplier;

  return (
    <group rotation={[0, yaw, 0]} position={[0, yOffset, 0]}>
      <primitive
        object={clonedScene}
        scale={[runScale, runScale, runScale]}
      />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/*  Player3D – wrapper with drag, labels, model switching             */
/* ------------------------------------------------------------------ */
export const Player3D: React.FC<Player3DProps> = React.memo(({
  player,
  isSelected,
  onSelect,
  onMove,
}) => {
  const groupRef = useRef<THREE.Group>(null!);
  const [isDragging, setIsDragging] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);
  const { camera, raycaster, gl } = useThree();
  const pitchPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -STADIUM_INTERACTION_Y),
    []
  );
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);
  const stadiumPosition = useMemo(() => toStadiumSpace(player.position), [player.position]);

  const frames = useTacticalStore((s) => s.frames);
  const currentFrameIndex = useTacticalStore((s) => s.currentFrameIndex);
  const playbackState = useTacticalStore((s) => s.playbackState);
  const activeTool = useTacticalStore((s) => s.activeTool);
  const runModelScale = useTacticalStore((s) => s.runModelScale);
  const runModelYOffset = useTacticalStore((s) => s.runModelYOffset);
  const cameraMode = useTacticalStore((s) => s.camera.mode);

  const motion = useMemo(() => {
    if (playbackState !== 'playing') {
      return { isRunning: false, yaw: 0 };
    }

    const currentFrame = frames[currentFrameIndex];
    const nextFrame = frames[currentFrameIndex + 1];
    if (!currentFrame || !nextFrame) {
      return { isRunning: false, yaw: 0 };
    }

    const fromState = currentFrame.playerStates.find((ps) => ps.playerId === player.id);
    const toState = nextFrame.playerStates.find((ps) => ps.playerId === player.id);
    if (!fromState || !toState) {
      return { isRunning: false, yaw: 0 };
    }

    const dx = toState.position.x - fromState.position.x;
    const dz = toState.position.z - fromState.position.z;
    const distance = Math.hypot(dx, dz);
    const shouldRun = distance > 0.05 && toState.movementType === 'run';

    return {
      isRunning: shouldRun,
      yaw: shouldRun ? Math.atan2(dx, dz) : 0,
    };
  }, [playbackState, frames, currentFrameIndex, player.id]);

  const stopDragging = useCallback((pointerId?: number) => {
    if (pointerId !== undefined && activePointerIdRef.current !== pointerId) {
      return;
    }

    activePointerIdRef.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const handlePointerEnd = (event: PointerEvent) => {
      stopDragging(event.pointerId);
    };
    const handleWindowBlur = () => {
      stopDragging();
    };

    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [stopDragging]);

  useEffect(() => {
    if (!isSelected || playbackState === 'playing') {
      stopDragging();
    }
  }, [isSelected, playbackState, stopDragging]);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.button !== 0) return;
      if (cameraMode === 'free' && e.altKey) {
        return;
      }
      e.stopPropagation();
      onSelect();
      if (activeTool !== 'select') {
        return;
      }
      activePointerIdRef.current = e.pointerId;
      setIsDragging(true);
      const target = e.target as EventTarget & {
        setPointerCapture?: (pointerId: number) => void;
      };
      target.setPointerCapture?.(e.pointerId);
    },
    [activeTool, cameraMode, onSelect]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging || activePointerIdRef.current !== e.pointerId || (e.buttons & 1) !== 1) {
        return;
      }
      e.stopPropagation();

      const canvasRect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - canvasRect.left) / canvasRect.width) * 2 - 1,
        -(((e.clientY - canvasRect.top) / canvasRect.height) * 2 - 1)
      );
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(pitchPlane, intersectPoint)) {
        const mappedPosition = fromStadiumSpace({
          x: intersectPoint.x / S,
          z: intersectPoint.z / S,
        });
        onMove(mappedPosition);
      }
    },
    [isDragging, gl, camera, raycaster, pitchPlane, intersectPoint, onMove]
  );

  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const target = e.target as EventTarget & {
        releasePointerCapture?: (pointerId: number) => void;
      };
      target.releasePointerCapture?.(e.pointerId);
      stopDragging(e.pointerId);
    },
    [stopDragging]
  );

  const handlePointerCancel = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const target = e.target as EventTarget & {
        releasePointerCapture?: (pointerId: number) => void;
      };
      target.releasePointerCapture?.(e.pointerId);
      stopDragging(e.pointerId);
    },
    [stopDragging]
  );

  return (
    <group
      ref={groupRef}
      position={[stadiumPosition.x * S, STADIUM_PITCH_Y, stadiumPosition.z * S]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      userData={{ entityId: player.id, entityType: 'player' }}
    >
      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05 * S, 0]}>
          <ringGeometry args={[0.6 * S, 0.75 * S, 32]} />
          <meshBasicMaterial color="#2563eb" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Ground shadow blob */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03 * S, 0]}>
        <circleGeometry args={[0.85 * S, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      {/* Player model: idle when still, running during playback */}
      {motion.isRunning ? (
        <RunModel
          player={player}
          isSelected={isSelected}
          yaw={motion.yaw}
          scaleMultiplier={runModelScale}
          yOffset={runModelYOffset}
        />
      ) : (
        <IdleModel player={player} isSelected={isSelected} />
      )}
    </group>
  );
});

Player3D.displayName = 'Player3D';

useGLTF.preload(IDLE_MODEL_PATH);
useGLTF.preload(RUN_MODEL_PATH);
