import React, { useEffect, useRef, useState } from 'react';
import { Canvas, RootState, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTacticalStore } from '../../store/tacticalStore';
import { CameraViewAngle, PITCH, PitchObjectType, Position2D } from '../../types';
import { Pitch3D } from './Pitch3D';
import { Player3D } from './Player3D';
import { Ball3D } from './Ball3D';
import { Object3D } from './Object3D';
import { Annotation3D } from './Annotation3D';
import { ViewportOverlay } from './ViewportOverlay';
import {
  fromStadiumSpace,
  SCENE_SCALE,
  STADIUM_INTERACTION_Y,
  STADIUM_PITCH_Y,
  toStadiumSpace,
} from './pitch3dConstants';
import './ThreeScene.css';

export const ThreeScene: React.FC = () => {
  const camera = useTacticalStore((s) => s.camera);
  const theme = useTacticalStore((s) => s.theme);
  const clearSelection = useTacticalStore((s) => s.clearSelection);
  const addObject = useTacticalStore((s) => s.addObject);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasStateRef = useRef<RootState | null>(null);

  const getWorldFromClient = (clientX: number, clientY: number) => {
    const wrapper = wrapperRef.current;
    const canvasState = canvasStateRef.current;
    if (!wrapper || !canvasState) return null;

    const rect = wrapper.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -(((clientY - rect.top) / rect.height) * 2 - 1)
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, canvasState.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -STADIUM_INTERACTION_Y);
    const point = new THREE.Vector3();

    if (!raycaster.ray.intersectPlane(plane, point)) {
      return null;
    }

    return fromStadiumSpace({
      x: point.x / SCENE_SCALE,
      z: point.z / SCENE_SCALE,
    });
  };

  return (
    <div
      ref={wrapperRef}
      className="three-scene-wrapper"
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('application/x-tactical-object')) {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }
      }}
      onDrop={(event) => {
        const payload = event.dataTransfer.getData('application/x-tactical-object');
        if (!payload) return;
        event.preventDefault();
        const parsed = JSON.parse(payload) as { type: PitchObjectType };
        const worldPos = getWorldFromClient(event.clientX, event.clientY);
        if (worldPos) {
          addObject(parsed.type, worldPos);
        }
      }}
    >
      <Canvas
        shadows={false}
        camera={{ position: [0, 14, 12], fov: 50, near: 0.1, far: 250 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onPointerMissed={() => clearSelection()}
        onCreated={(state) => {
          const { gl } = state;
          canvasStateRef.current = state;
          gl.shadowMap.enabled = false;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.35;
        }}
      >
        <SceneContents theme={theme} />
      </Canvas>
      <ViewportOverlay />
    </div>
  );
};

interface SceneContentsProps {
  theme: 'dark' | 'light';
}

const CAMERA_WORLD_UP = new THREE.Vector3(0, 1, 0);
const DEFAULT_FREE_POSITION = new THREE.Vector3(0, 14, 12);
const DEFAULT_FREE_TARGET = new THREE.Vector3(0, 0, 0);
const TOP_CAMERA_POSITION = new THREE.Vector3(0, 18, 0.01);
const ANGLED_CAMERA_POSITION = new THREE.Vector3(0, 10.5, 14);
const BROADCAST_OFFSET = new THREE.Vector3(0, 9.5, 13.5);
const FREE_CAMERA_SPEED = 6;
const FREE_CAMERA_SHIFT_MULTIPLIER = 2.2;
const CAMERA_SMOOTHING = 6;

const CAMERA_VIEW_ANGLES: Record<CameraViewAngle, number> = {
  north: 0,
  'north-east': Math.PI / 4,
  east: Math.PI / 2,
  'south-east': (3 * Math.PI) / 4,
  south: Math.PI,
  'south-west': (5 * Math.PI) / 4,
  west: (3 * Math.PI) / 2,
  'north-west': (7 * Math.PI) / 4,
};

const isTypingInField = () => {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) {
    return false;
  }

  const tag = activeElement.tagName;
  return (
    activeElement.isContentEditable ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT'
  );
};

const toScenePosition = (position: Position2D) =>
  (() => {
    const stadiumPosition = toStadiumSpace(position);
    return new THREE.Vector3(stadiumPosition.x * SCENE_SCALE, STADIUM_PITCH_Y, stadiumPosition.z * SCENE_SCALE);
  })();

const getPresetAnglePosition = (
  target: THREE.Vector3,
  viewAngle: CameraViewAngle,
  currentPosition: THREE.Vector3
) => {
  const offset = currentPosition.clone().sub(target);
  const radius = THREE.MathUtils.clamp(
    Math.hypot(offset.x, offset.z) || 14,
    8,
    18
  );
  const height = THREE.MathUtils.clamp(Math.abs(offset.y) || 8, 6.5, 14);
  const angle = CAMERA_VIEW_ANGLES[viewAngle];

  return new THREE.Vector3(
    target.x + Math.sin(angle) * radius,
    height,
    target.z + Math.cos(angle) * radius
  );
};

const getPerspectivePlayer = (
  players: ReturnType<typeof useTacticalStore.getState>['players'],
  selection: ReturnType<typeof useTacticalStore.getState>['selection'],
  ball: ReturnType<typeof useTacticalStore.getState>['ball'],
  targetPlayerId?: string
) => {
  if (targetPlayerId) {
    const explicitPlayer = players.find((player) => player.id === targetPlayerId);
    if (explicitPlayer) {
      return explicitPlayer;
    }
  }

  if (selection.type === 'player' && selection.id) {
    const selectedPlayer = players.find((player) => player.id === selection.id);
    if (selectedPlayer) {
      return selectedPlayer;
    }
  }

  if (ball.ownerId) {
    return players.find((player) => player.id === ball.ownerId);
  }

  return undefined;
};

const getPlayerLookDirection = (team: 'home' | 'away') =>
  new THREE.Vector3(team === 'home' ? 1 : -1, 0, 0);

const SceneContents: React.FC<SceneContentsProps> = ({ theme }) => {
  const cameraState = useTacticalStore((s) => s.camera);
  const activeTool = useTacticalStore((s) => s.activeTool);
  const playerPlacement = useTacticalStore((s) => s.playerPlacement);
  const objectPlacementType = useTacticalStore((s) => s.objectPlacementType);
  const players = useTacticalStore((s) => s.players);
  const objects = useTacticalStore((s) => s.objects);
  const annotations = useTacticalStore((s) => s.annotations);
  const selection = useTacticalStore((s) => s.selection);
  const select = useTacticalStore((s) => s.select);
  const clearSelection = useTacticalStore((s) => s.clearSelection);
  const addPlayer = useTacticalStore((s) => s.addPlayer);
  const addObject = useTacticalStore((s) => s.addObject);
  const addAnnotation = useTacticalStore((s) => s.addAnnotation);
  const movePlayer = useTacticalStore((s) => s.movePlayer);
  const controlsRef = useRef<any>(null);
  const [optionDragEnabled, setOptionDragEnabled] = useState(false);

  const handlePitchPointerDown = (event: THREE.Event & { altKey?: boolean; stopPropagation: () => void; point: THREE.Vector3 }) => {
    if (cameraState.mode === 'free' && event.altKey) {
      return;
    }

    event.stopPropagation();

    const worldPos = {
      ...fromStadiumSpace({
        x: event.point.x / SCENE_SCALE,
        z: event.point.z / SCENE_SCALE,
      }),
    };

    if (activeTool === 'place-player') {
      addPlayer({
        ...playerPlacement,
        position: worldPos,
        kitColor: playerPlacement.team === 'home' ? '#3b82f6' : '#ef4444',
        name: playerPlacement.role === 'goalkeeper' ? 'GK' : undefined,
      });
      return;
    }

    if (activeTool === 'place-object') {
      addObject(objectPlacementType, worldPos);
      return;
    }

    if (activeTool === 'place-annotation') {
      addAnnotation('Note', worldPos);
      return;
    }

    clearSelection();
  };

  const scenePalette =
    theme === 'light'
      ? {
          ambient: '#d1def2',
          directional: '#fffef8',
          fill: '#b9d3f1',
          hemiSky: '#d6eaf9',
          hemiGround: '#c7d3e0',
          background: '#e9f0f6',
          fog: '#e9f0f6',
        }
      : {
          ambient: '#b0c4de',
          directional: '#ffffff',
          fill: '#87ceeb',
          hemiSky: '#87ceeb',
          hemiGround: '#0a1628',
          background: '#080b12',
          fog: '#080b12',
        };

  useEffect(() => {
    const updateOptionState = (event: KeyboardEvent | MouseEvent | PointerEvent) => {
      setOptionDragEnabled(event.altKey);
    };
    const clearOptionState = () => setOptionDragEnabled(false);

    window.addEventListener('keydown', updateOptionState);
    window.addEventListener('keyup', updateOptionState);
    window.addEventListener('pointerdown', updateOptionState);
    window.addEventListener('pointermove', updateOptionState);
    window.addEventListener('pointerup', updateOptionState);
    window.addEventListener('blur', clearOptionState);

    return () => {
      window.removeEventListener('keydown', updateOptionState);
      window.removeEventListener('keyup', updateOptionState);
      window.removeEventListener('pointerdown', updateOptionState);
      window.removeEventListener('pointermove', updateOptionState);
      window.removeEventListener('pointerup', updateOptionState);
      window.removeEventListener('blur', clearOptionState);
    };
  }, []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} color={scenePalette.ambient} />
      <directionalLight
        position={[10, 22, 8]}
        intensity={1.5}
        color={scenePalette.directional}
        castShadow={false}
      />
      <directionalLight
        position={[-8, 14, -6]}
        intensity={0.45}
        color={scenePalette.fill}
        castShadow={false}
      />
      <hemisphereLight args={[scenePalette.hemiSky, scenePalette.hemiGround, 0.4]} />

      {/* Sky color */}
      <color attach="background" args={[scenePalette.background]} />
      <fog attach="fog" args={[scenePalette.fog, 28, 70]} />

      {/* Pitch */}
      <Pitch3D onPitchPointerDown={handlePitchPointerDown} />

      {/* Players */}
      {players.map((player) => (
        <Player3D
          key={player.id}
          player={player}
          isSelected={selection.id === player.id}
          onSelect={() => select('player', player.id)}
          onMove={(pos: Position2D) => movePlayer(player.id, pos)}
        />
      ))}

      {/* Ball */}
      <Ball3D />

      {/* Objects */}
      {objects.map((obj) => (
        <Object3D
          key={obj.id}
          object={obj}
          isSelected={selection.id === obj.id}
          onSelect={() => select('object', obj.id)}
        />
      ))}

      {/* Annotations */}
      {annotations.map((anno) => (
        <Annotation3D key={anno.id} annotation={anno} />
      ))}

      <CameraController controlsRef={controlsRef} />

      {/* Camera Controls */}
      <OrbitControls
        ref={controlsRef}
        enablePan={cameraState.mode === 'free' && cameraState.preset !== 'player-perspective' && optionDragEnabled}
        enableRotate={cameraState.mode === 'free' && cameraState.preset !== 'player-perspective' && optionDragEnabled}
        enableZoom={true}
        maxPolarAngle={Math.PI / 2}
        minDistance={2}
        maxDistance={60}
        target={DEFAULT_FREE_TARGET}
      />
    </>
  );
};

interface CameraControllerProps {
  controlsRef: React.RefObject<any>;
}

const CameraController: React.FC<CameraControllerProps> = ({ controlsRef }) => {
  const cameraState = useTacticalStore((s) => s.camera);
  const players = useTacticalStore((s) => s.players);
  const selection = useTacticalStore((s) => s.selection);
  const ball = useTacticalStore((s) => s.ball);
  const playbackState = useTacticalStore((s) => s.playbackState);
  const { camera } = useThree();
  const freeCameraPositionRef = useRef(DEFAULT_FREE_POSITION.clone());
  const freeCameraTargetRef = useRef(DEFAULT_FREE_TARGET.clone());
  const initializedRef = useRef(false);
  const isApplyingProgrammaticChangeRef = useRef(false);
  const pressedKeysRef = useRef(new Set<string>());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingInField()) {
        return;
      }
      pressedKeysRef.current.add(event.key.toLowerCase());
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeysRef.current.delete(event.key.toLowerCase());
    };

    const clearPressedKeys = () => {
      pressedKeysRef.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearPressedKeys);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearPressedKeys);
    };
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    const syncFreeCameraFromControls = () => {
      if (isApplyingProgrammaticChangeRef.current) {
        return;
      }

      if (cameraState.mode !== 'free' || cameraState.preset === 'player-perspective') {
        return;
      }

      freeCameraPositionRef.current.copy(camera.position);
      freeCameraTargetRef.current.copy(controls.target);
    };

    controls.addEventListener('change', syncFreeCameraFromControls);

    return () => {
      controls.removeEventListener('change', syncFreeCameraFromControls);
    };
  }, [camera, cameraState.mode, cameraState.preset, controlsRef]);

  useEffect(() => {
    if (cameraState.mode !== 'free') {
      return;
    }

    if (cameraState.preset === 'top') {
      freeCameraPositionRef.current.copy(TOP_CAMERA_POSITION);
      freeCameraTargetRef.current.copy(DEFAULT_FREE_TARGET);
      return;
    }

    if (cameraState.preset === 'angled') {
      freeCameraPositionRef.current.copy(ANGLED_CAMERA_POSITION);
      freeCameraTargetRef.current.copy(DEFAULT_FREE_TARGET);
      return;
    }

    if (cameraState.preset === 'custom' && cameraState.viewAngle) {
      freeCameraPositionRef.current.copy(
        getPresetAnglePosition(
          freeCameraTargetRef.current,
          cameraState.viewAngle,
          freeCameraPositionRef.current
        )
      );
    }
  }, [cameraState.mode, cameraState.preset, cameraState.viewAngle]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    if (!initializedRef.current) {
      freeCameraPositionRef.current.copy(camera.position);
      freeCameraTargetRef.current.copy(controls.target);
      initializedRef.current = true;
    }

    if (cameraState.mode === 'free' && cameraState.preset !== 'player-perspective') {
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      const movement = new THREE.Vector3();
      const pressedKeys = pressedKeysRef.current;
      const speedMultiplier = pressedKeys.has('shift') ? FREE_CAMERA_SHIFT_MULTIPLIER : 1;

      camera.getWorldDirection(forward);
      forward.y = 0;

      if (forward.lengthSq() > 0) {
        forward.normalize();
        right.crossVectors(forward, CAMERA_WORLD_UP).normalize();

        if (pressedKeys.has('w') || pressedKeys.has('arrowup')) {
          movement.add(forward);
        }
        if (pressedKeys.has('s') || pressedKeys.has('arrowdown')) {
          movement.sub(forward);
        }
        if (pressedKeys.has('a') || pressedKeys.has('arrowleft')) {
          movement.sub(right);
        }
        if (pressedKeys.has('d') || pressedKeys.has('arrowright')) {
          movement.add(right);
        }
      }

      if (movement.lengthSq() > 0) {
        movement
          .normalize()
          .multiplyScalar(FREE_CAMERA_SPEED * speedMultiplier * delta);
        freeCameraPositionRef.current.add(movement);
        freeCameraTargetRef.current.add(movement);
      }

      const smoothing = 1 - Math.exp(-CAMERA_SMOOTHING * delta);
      isApplyingProgrammaticChangeRef.current = true;
      camera.position.lerp(freeCameraPositionRef.current, smoothing);
      controls.target.lerp(freeCameraTargetRef.current, smoothing);
      controls.update();
      isApplyingProgrammaticChangeRef.current = false;
      return;
    }

    if (cameraState.mode === 'broadcast') {
      const broadcastFocus = ball.ownerId
        ? players.find((player) => player.id === ball.ownerId)
        : undefined;
      const focusTarget = broadcastFocus
        ? toScenePosition(broadcastFocus.position)
        : toScenePosition(ball.position);
      const desiredTarget = focusTarget.clone();
      const desiredPosition = focusTarget.clone().add(BROADCAST_OFFSET);
      const smoothing = playbackState === 'playing' ? 1 - Math.exp(-5 * delta) : 1 - Math.exp(-3 * delta);

      isApplyingProgrammaticChangeRef.current = true;
      camera.position.lerp(desiredPosition, smoothing);
      controls.target.lerp(desiredTarget, smoothing);
      controls.update();
      isApplyingProgrammaticChangeRef.current = false;
      return;
    }

    if (cameraState.preset === 'player-perspective') {
      const perspectivePlayer = getPerspectivePlayer(
        players,
        selection,
        ball,
        cameraState.targetPlayerId
      );

      if (!perspectivePlayer) {
        return;
      }

      const playerPosition = toScenePosition(perspectivePlayer.position);
      const lookDirection = getPlayerLookDirection(perspectivePlayer.team);
      const desiredTarget = playerPosition
        .clone()
        .addScaledVector(lookDirection, 3.4)
        .setY(1.4);
      const desiredPosition = playerPosition
        .clone()
        .addScaledVector(lookDirection, -1.9)
        .setY(1.8);
      const smoothing = 1 - Math.exp(-6 * delta);

      isApplyingProgrammaticChangeRef.current = true;
      camera.position.lerp(desiredPosition, smoothing);
      controls.target.lerp(desiredTarget, smoothing);
      controls.update();
      isApplyingProgrammaticChangeRef.current = false;
    }
  });

  return null;
};
