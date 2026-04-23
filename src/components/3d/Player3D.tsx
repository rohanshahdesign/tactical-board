import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useThree, ThreeEvent, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Player, Position2D } from '../../types';
import { useTacticalStore } from '../../store/tacticalStore';
import {
  getAnimationClipName,
  getMovementClipName,
  isProgressDrivenAnimation,
  PLAYER_ANIMATION_NAMES,
} from '../../utils/actions';
import {
  fromStadiumSpace,
  SCENE_SCALE,
  STADIUM_INTERACTION_Y,
  STADIUM_PITCH_Y,
  toStadiumSpace,
} from './pitch3dConstants';

const PLAYER_MODEL_PATH = '/assets/models/players/Player_1.glb';

const S = SCENE_SCALE;

// Target height in world units at player.height = 1.0
const BASE_HEIGHT = 1.8;
const PLAYER_MODEL_HEIGHT = BASE_HEIGHT;
const PLAYER_ANIMATION_FADE_SECONDS = 0.25;
const PLAYER_BASE_Y_OFFSET = 0.26;
const PLAYER_MOVEMENT_YAW_CORRECTION = -Math.PI / 2;
const DEBUG_PLAYER_SPAWN = import.meta.env.DEV;
const reportedMissingMeshPlayers = new Set<string>();
const MOVEMENT_LOOP_CLIP_NAMES = new Set<string>([
  PLAYER_ANIMATION_NAMES.walk,
  PLAYER_ANIMATION_NAMES.jog,
  PLAYER_ANIMATION_NAMES.sprint,
]);
const ROOT_MOTION_BONE_CANDIDATES = ['mixamorig:Hips', 'Hips'];

const PLAYER_CLIP_ALIASES: Record<string, string[]> = {
  [PLAYER_ANIMATION_NAMES.idle]: [
    PLAYER_ANIMATION_NAMES.idle,
    'Armature|mixamo.com|Layer0',
  ],
  [PLAYER_ANIMATION_NAMES.walk]: [
    PLAYER_ANIMATION_NAMES.walk,
    'Armature|mixamo.com|Layer0.005',
  ],
  [PLAYER_ANIMATION_NAMES.jog]: [
    PLAYER_ANIMATION_NAMES.jog,
    'Armature|mixamo.com|Layer0.003',
  ],
  [PLAYER_ANIMATION_NAMES.sprint]: [
    PLAYER_ANIMATION_NAMES.sprint,
    'Armature.001|mixamo.com|Layer0',
  ],
  [PLAYER_ANIMATION_NAMES.turn]: [
    PLAYER_ANIMATION_NAMES.turn,
    'Armature.002|mixamo.com|Layer0',
  ],
  [PLAYER_ANIMATION_NAMES.header]: [
    PLAYER_ANIMATION_NAMES.header,
    'Armature|mixamo.com|Layer0.001',
  ],
  [PLAYER_ANIMATION_NAMES.pass]: [
    PLAYER_ANIMATION_NAMES.pass,
    'Armature|mixamo.com|Layer0.004',
  ],
  [PLAYER_ANIMATION_NAMES.tackle]: [
    PLAYER_ANIMATION_NAMES.tackle,
    'Armature|mixamo.com|Layer0.002',
  ],
};

const PASS_ACTIONS = new Set(['pass-inside', 'pass-outside']);

interface Player3DProps {
  player: Player;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (pos: Position2D) => void;
}

const MOVEMENT_EPSILON = 0.001;

function getMovementDelta(from: Position2D, to: Position2D) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;

  return {
    dx,
    dz,
    distance: Math.hypot(dx, dz),
  };
}

function getMovementYaw(from: Position2D, to: Position2D, yawOffset: number) {
  const fromStadiumPosition = toStadiumSpace(from);
  const toStadiumPosition = toStadiumSpace(to);
  const { dx, dz } = getMovementDelta(fromStadiumPosition, toStadiumPosition);
  return Math.atan2(dx, dz) + yawOffset + PLAYER_MOVEMENT_YAW_CORRECTION;
}

function getFrameSegmentYaw(
  frames: ReturnType<typeof useTacticalStore.getState>['frames'],
  frameIndex: number,
  playerId: string,
  yawOffset: number
) {
  const currentFrame = frames[frameIndex];
  if (!currentFrame) {
    return null;
  }

  const currentState = currentFrame.playerStates.find((ps) => ps.playerId === playerId);
  if (!currentState) {
    return null;
  }

  const nextState = frames[frameIndex + 1]?.playerStates.find((ps) => ps.playerId === playerId);
  if (nextState) {
    const nextMovement = getMovementDelta(currentState.position, nextState.position);
    if (nextMovement.distance > MOVEMENT_EPSILON) {
      return getMovementYaw(currentState.position, nextState.position, yawOffset);
    }
  }

  const previousState = frames[frameIndex - 1]?.playerStates.find((ps) => ps.playerId === playerId);
  if (previousState) {
    const previousMovement = getMovementDelta(previousState.position, currentState.position);
    if (previousMovement.distance > MOVEMENT_EPSILON) {
      return getMovementYaw(previousState.position, currentState.position, yawOffset);
    }
  }

  return null;
}

const createKitMaterial = (
  sourceMaterial: THREE.Material | THREE.Material[] | undefined,
  kitColor: string
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
    emissive: new THREE.Color('#000000'),
    emissiveIntensity: 0,
  });
};

const setSelectionHighlight = (root: THREE.Object3D, isSelected: boolean) => {
  root.traverse((child: THREE.Object3D) => {
    if (!(child as THREE.Mesh).isMesh) {
      return;
    }

    const mesh = child as THREE.Mesh;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    materials.forEach((material) => {
      if (!(material instanceof THREE.MeshStandardMaterial)) {
        return;
      }

      material.emissive.set(isSelected ? '#2563eb' : '#000000');
      material.emissiveIntensity = isSelected ? 0.3 : 0;
    });
  });
};

const findRootMotionBone = (root: THREE.Object3D) => {
  for (const candidate of ROOT_MOTION_BONE_CANDIDATES) {
    const directMatch = root.getObjectByName(candidate);
    if (directMatch instanceof THREE.Bone) {
      return directMatch;
    }
  }

  let fallbackBone: THREE.Bone | null = null;
  root.traverse((child: THREE.Object3D) => {
    if (fallbackBone || !(child instanceof THREE.Bone)) {
      return;
    }

    if (child.name.endsWith('Hips') || child.name === 'Hips') {
      fallbackBone = child;
    }
  });

  return fallbackBone;
};

function resolvePlayerClipName(requestedClipName: string, availableClipNames: string[]) {
  const candidates = PLAYER_CLIP_ALIASES[requestedClipName] ?? [requestedClipName];

  for (const candidate of candidates) {
    if (availableClipNames.includes(candidate)) {
      return candidate;
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Unified player model – skinned mesh with in-place animations       */
/* ------------------------------------------------------------------ */
const UnifiedPlayerModel: React.FC<{
  player: Player;
  isSelected: boolean;
  yaw: number;
  yOffset: number;
  scaleMultiplier: number;
  clipName: string;
  progress: number;
}> = ({
  player,
  isSelected,
  yaw,
  yOffset,
  scaleMultiplier,
  clipName,
  progress,
}) => {
  const { scene, animations } = useGLTF(PLAYER_MODEL_PATH);

  const clonedScene = useMemo(() => {
    const s = SkeletonUtils.clone(scene);
    s.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = false;
        mesh.material = createKitMaterial(mesh.material, player.kitColor);
      }
    });

    s.rotation.set(0, Math.PI / 2, 0);
    s.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(s);
    const center = box.getCenter(new THREE.Vector3());
    s.position.x -= center.x;
    s.position.z -= center.z;
    s.position.y -= box.min.y;
    s.updateMatrixWorld(true);

    return s;
  }, [scene, player.kitColor]);

  useEffect(() => {
    setSelectionHighlight(clonedScene, isSelected);
  }, [clonedScene, isSelected]);

  const { actions } = useAnimations(animations, clonedScene);
  const availableClipNames = useMemo(() => Object.keys(actions), [actions]);
  const resolvedIdleClipName = useMemo(
    () => resolvePlayerClipName(PLAYER_ANIMATION_NAMES.idle, availableClipNames),
    [availableClipNames]
  );
  const resolvedClipName = useMemo(
    () => resolvePlayerClipName(clipName, availableClipNames) ?? resolvedIdleClipName,
    [availableClipNames, clipName, resolvedIdleClipName]
  );
  const previousClipNameRef = useRef<string | null>(null);
  const isProgressDriven = isProgressDrivenAnimation(clipName);
  const rootMotionBone = useMemo(() => findRootMotionBone(clonedScene), [clonedScene]);
  const rootMotionBasePosition = useMemo(
    () => rootMotionBone?.position.clone() ?? null,
    [rootMotionBone]
  );
  const lockVerticalAxis = MOVEMENT_LOOP_CLIP_NAMES.has(clipName);

  useFrame(() => {
    if (!rootMotionBone || !rootMotionBasePosition) {
      return;
    }

    rootMotionBone.position.x = rootMotionBasePosition.x;
    rootMotionBone.position.z = rootMotionBasePosition.z;

    if (lockVerticalAxis) {
      rootMotionBone.position.y = rootMotionBasePosition.y;
    }
  });

  useEffect(() => {
    if (!resolvedClipName) {
      return;
    }

    const nextAction = actions[resolvedClipName];
    if (!nextAction) {
      return;
    }

    const previousClipName = previousClipNameRef.current;
    const previousAction = previousClipName ? actions[previousClipName] : undefined;

    if (previousAction && previousAction !== nextAction) {
      previousAction.fadeOut(PLAYER_ANIMATION_FADE_SECONDS);
    }

    nextAction.enabled = true;

    if (isProgressDriven) {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
      nextAction.reset();
      nextAction.play();
      nextAction.paused = true;
    } else if (previousAction !== nextAction || !nextAction.isRunning()) {
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
      nextAction.clampWhenFinished = false;
      nextAction.paused = false;
      nextAction.reset();
      nextAction.fadeIn(PLAYER_ANIMATION_FADE_SECONDS).play();
    }

    previousClipNameRef.current = resolvedClipName;
  }, [actions, isProgressDriven, resolvedClipName]);

  useEffect(() => {
    if (!isProgressDriven || !resolvedClipName) {
      return;
    }

    const clipAction = actions[resolvedClipName];
    if (!clipAction) {
      return;
    }

    const clipDuration = clipAction.getClip().duration || 1;
    clipAction.time = THREE.MathUtils.clamp(progress, 0, 0.9999) * clipDuration;
  }, [actions, isProgressDriven, progress, resolvedClipName]);

  useEffect(() => {
    return () => {
      Object.values(actions).forEach((action) => {
        action?.stop();
      });
    };
  }, [actions]);

  const playerScale = (BASE_HEIGHT / PLAYER_MODEL_HEIGHT) * player.height * S * scaleMultiplier;

  useEffect(() => {
    if (!DEBUG_PLAYER_SPAWN) {
      return;
    }

    const localBox = new THREE.Box3().setFromObject(clonedScene);
    const localSize = localBox.getSize(new THREE.Vector3());
    const approxScaledSize = localSize.clone().multiplyScalar(playerScale);
    let meshCount = 0;
    let skinnedMeshCount = 0;
    const nodeTypeCounts: Record<string, number> = {};
    const nodeNames: string[] = [];

    clonedScene.traverse((child: THREE.Object3D) => {
      nodeTypeCounts[child.type] = (nodeTypeCounts[child.type] ?? 0) + 1;

      if (nodeNames.length < 12 && child.name) {
        nodeNames.push(child.name);
      }

      if ((child as THREE.Mesh).isMesh) {
        meshCount += 1;
      }

      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        skinnedMeshCount += 1;
      }
    });

    console.info('[Tactical] Player.glb runtime mount', {
      playerId: player.id,
      playerName: player.name,
      meshCount,
      skinnedMeshCount,
      localBounds: {
        min: localBox.min.toArray(),
        max: localBox.max.toArray(),
        size: localSize.toArray(),
      },
      approxScaledSize: approxScaledSize.toArray(),
      playerScale,
      yOffset,
      yaw,
      requestedClipName: clipName,
      resolvedClipName,
      availableClipNames,
      animationsCount: animations.length,
    });

    if (meshCount === 0 && !reportedMissingMeshPlayers.has(player.id)) {
      reportedMissingMeshPlayers.add(player.id);
      console.error('[Tactical] Player.glb has no renderable meshes', {
        playerId: player.id,
        playerName: player.name,
        meshCount,
        skinnedMeshCount,
        nodeTypeCounts,
        sampleNodeNames: nodeNames,
        availableClipNames,
        hint: 'The GLB appears to contain animation/skeleton nodes but no mesh primitives. Re-export from Blender with both the skinned mesh object and armature included.',
      });
    }
  }, [animations.length, availableClipNames, clipName, clonedScene, player.id, player.name, playerScale, resolvedClipName, yOffset, yaw]);

  return (
    <group rotation={[0, yaw, 0]} position={[0, yOffset, 0]}>
      <primitive
        object={clonedScene}
        scale={[playerScale, playerScale, playerScale]}
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
  const playbackProgress = useTacticalStore((s) => s.playbackProgress);
  const animationEnabled = useTacticalStore((s) => s.animationEnabled);
  const ball = useTacticalStore((s) => s.ball);
  const activeTool = useTacticalStore((s) => s.activeTool);
  const runModelScale = useTacticalStore((s) => s.runModelScale);
  const runModelYOffset = useTacticalStore((s) => s.runModelYOffset);
  const runModelYawOffset = useTacticalStore((s) => s.runModelYawOffset);
  const cameraMode = useTacticalStore((s) => s.camera.mode);
  const previousPlaybackPositionRef = useRef<Position2D | null>(null);
  const lastRunYawRef = useRef(runModelYawOffset);
  const currentFrame = frames[currentFrameIndex];
  const frameState = currentFrame?.playerStates.find((ps) => ps.playerId === player.id);
  const playerHasBall = animationEnabled && currentFrame
    ? currentFrame.ballState.mode === 'attached' && currentFrame.ballState.ownerId === player.id
    : ball.mode === 'attached' && ball.ownerId === player.id;
  const actionProgress = playbackState === 'playing' ? playbackProgress : 0;

  const motion = useMemo(() => {
    if (playbackState !== 'playing') {
      return { isMoving: false, yaw: lastRunYawRef.current, movementType: null as null | 'walk' | 'jog' | 'run' };
    }

    const currentFrame = frames[currentFrameIndex];
    const nextFrame = frames[currentFrameIndex + 1];
    if (!currentFrame || !nextFrame) {
      return { isMoving: false, yaw: lastRunYawRef.current, movementType: null as null | 'walk' | 'jog' | 'run' };
    }

    const fromState = currentFrame.playerStates.find((ps) => ps.playerId === player.id);
    const toState = nextFrame.playerStates.find((ps) => ps.playerId === player.id);
    if (!fromState || !toState) {
      return { isMoving: false, yaw: lastRunYawRef.current, movementType: null as null | 'walk' | 'jog' | 'run' };
    }

    const previousPlaybackPosition = previousPlaybackPositionRef.current;
    const liveMovement = previousPlaybackPosition
      ? getMovementDelta(previousPlaybackPosition, player.position)
      : null;
    const segmentMovement = getMovementDelta(fromState.position, toState.position);
    const hasMovement =
      (liveMovement?.distance ?? 0) > MOVEMENT_EPSILON ||
      segmentMovement.distance > MOVEMENT_EPSILON;

    if (!hasMovement) {
      return { isMoving: false, yaw: lastRunYawRef.current, movementType: null as null | 'walk' | 'jog' | 'run' };
    }

    const yaw =
      liveMovement && liveMovement.distance > MOVEMENT_EPSILON
        ? getMovementYaw(previousPlaybackPosition!, player.position, runModelYawOffset)
        : getMovementYaw(fromState.position, toState.position, runModelYawOffset);

    lastRunYawRef.current = yaw;

    return {
      isMoving: true,
      yaw,
      movementType: toState.movementType,
    };
  }, [
    playbackState,
    frames,
    currentFrameIndex,
    player.id,
    player.position,
    runModelYawOffset,
  ]);

  const actionClipName = frameState ? getAnimationClipName(frameState.action) : PLAYER_ANIMATION_NAMES.idle;
  const shouldPlayActionClip = Boolean(
    playbackState === 'playing' &&
      frameState &&
      isProgressDrivenAnimation(actionClipName) &&
      (!PASS_ACTIONS.has(frameState.action) || playerHasBall)
  );
  const desiredClipName = shouldPlayActionClip
    ? actionClipName
    : motion.isMoving && motion.movementType
      ? getMovementClipName(motion.movementType)
      : PLAYER_ANIMATION_NAMES.idle;
  const modelYOffset = PLAYER_BASE_Y_OFFSET + runModelYOffset;

  const actionYaw = useMemo(() => {
    if (motion.isMoving) {
      return motion.yaw;
    }

    const frameSegmentYaw = getFrameSegmentYaw(frames, currentFrameIndex, player.id, runModelYawOffset);
    if (frameSegmentYaw !== null) {
      lastRunYawRef.current = frameSegmentYaw;
      return frameSegmentYaw;
    }

    return lastRunYawRef.current;
  }, [currentFrameIndex, frames, motion.isMoving, motion.yaw, player.id, runModelYawOffset]);

  useEffect(() => {
    if (playbackState !== 'playing') {
      previousPlaybackPositionRef.current = null;
      lastRunYawRef.current = runModelYawOffset;
      return;
    }

    previousPlaybackPositionRef.current = { ...player.position };
  }, [playbackState, player.position, runModelYawOffset]);

  useEffect(() => {
    if (!DEBUG_PLAYER_SPAWN) {
      return;
    }

    console.info('[Tactical] Player3D placed', {
      playerId: player.id,
      playerName: player.name,
      playerPosition: player.position,
      stadiumPosition,
      scenePosition: [stadiumPosition.x * S, STADIUM_PITCH_Y, stadiumPosition.z * S],
      modelYOffset,
      desiredClipName,
      playbackState,
      animationEnabled,
      hasBall: playerHasBall,
      frameAction: frameState?.action ?? null,
      frameMovementType: frameState?.movementType ?? null,
    });
  }, [animationEnabled, desiredClipName, frameState?.action, frameState?.movementType, modelYOffset, playbackState, player.id, player.name, player.position, playerHasBall, stadiumPosition]);

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

      <UnifiedPlayerModel
        player={player}
        isSelected={isSelected}
        yaw={actionYaw}
        yOffset={modelYOffset}
        scaleMultiplier={runModelScale}
        clipName={desiredClipName}
        progress={actionProgress}
      />
    </group>
  );
});

Player3D.displayName = 'Player3D';

useGLTF.preload(PLAYER_MODEL_PATH);
