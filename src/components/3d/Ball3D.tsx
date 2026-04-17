import React, { useEffect, useMemo } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useTacticalStore } from '../../store/tacticalStore';
import { getAttachedBallPosition } from '../../utils/ball';
import { SCENE_SCALE, STADIUM_PITCH_Y, toStadiumSpace } from './pitch3dConstants';

const S = SCENE_SCALE;
const STATIC_BALL_PATH = '/assets/models/components/soccer_ball.glb';
const ANIMATED_BALL_PATH = '/assets/models/components/animated_soccer_ball.glb';
const TARGET_BALL_DIAMETER = 2.5 * S;

function prepareBallScene(source: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(source);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z) || 1;

  source.position.x -= center.x;
  source.position.z -= center.z;
  source.position.y -= box.min.y;
  source.traverse((child: THREE.Object3D) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
    }
  });

  return {
    scene: source,
    scale: TARGET_BALL_DIAMETER / maxDimension,
  };
}

const StaticBallModel: React.FC = () => {
  const { scene } = useGLTF(STATIC_BALL_PATH);

  const prepared = useMemo(() => prepareBallScene(scene.clone(true)), [scene]);

  return <primitive object={prepared.scene} scale={[prepared.scale, prepared.scale, prepared.scale]} />;
};

const AnimatedBallModel: React.FC = () => {
  const { scene, animations } = useGLTF(ANIMATED_BALL_PATH);

  const prepared = useMemo(() => prepareBallScene(SkeletonUtils.clone(scene)), [scene]);
  const { actions } = useAnimations(animations, prepared.scene);

  useEffect(() => {
    const actionName = Object.keys(actions)[0];
    if (!actionName || !actions[actionName]) {
      return;
    }

    actions[actionName]!.reset().fadeIn(0.15).play();

    return () => {
      actions[actionName]?.fadeOut(0.15);
    };
  }, [actions]);

  return <primitive object={prepared.scene} scale={[prepared.scale, prepared.scale, prepared.scale]} />;
};

export const Ball3D: React.FC = () => {
  const ball = useTacticalStore((s) => s.ball);
  const players = useTacticalStore((s) => s.players);
  const playbackState = useTacticalStore((s) => s.playbackState);

  const position = useMemo(() => {
    if (ball.mode === 'attached' && ball.ownerId) {
      const owner = players.find((p) => p.id === ball.ownerId);
      if (owner) {
        const ownerBallPosition = toStadiumSpace(getAttachedBallPosition(owner));
        return new THREE.Vector3(
          ownerBallPosition.x * S,
          STADIUM_PITCH_Y + 0.01 * S,
          ownerBallPosition.z * S
        );
      }
    }
    const stadiumPosition = toStadiumSpace(ball.position);
    return new THREE.Vector3(stadiumPosition.x * S, STADIUM_PITCH_Y + 0.01 * S, stadiumPosition.z * S);
  }, [ball, players]);

  return (
    <group position={position}>
      {playbackState === 'playing' ? <AnimatedBallModel /> : <StaticBallModel />}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[0.18 * S, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
};

useGLTF.preload(STATIC_BALL_PATH);
useGLTF.preload(ANIMATED_BALL_PATH);
