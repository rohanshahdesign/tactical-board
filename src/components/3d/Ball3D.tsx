import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTacticalStore } from '../../store/tacticalStore';
import { PITCH } from '../../types';
import { SCENE_SCALE, STADIUM_PITCH_Y, toStadiumSpace } from './pitch3dConstants';

const S = SCENE_SCALE;

export const Ball3D: React.FC = () => {
  const ball = useTacticalStore((s) => s.ball);
  const players = useTacticalStore((s) => s.players);

  const position = useMemo(() => {
    if (ball.mode === 'attached' && ball.ownerId) {
      const owner = players.find((p) => p.id === ball.ownerId);
      if (owner) {
        const ownerBallPosition = toStadiumSpace({
          x: owner.position.x + 0.5,
          z: owner.position.z + 0.3,
        });
        return new THREE.Vector3(
          ownerBallPosition.x * S,
          STADIUM_PITCH_Y + 0.15 * S,
          ownerBallPosition.z * S
        );
      }
    }
    const stadiumPosition = toStadiumSpace(ball.position);
    return new THREE.Vector3(stadiumPosition.x * S, STADIUM_PITCH_Y + 0.15 * S, stadiumPosition.z * S);
  }, [ball, players]);

  return (
    <group position={position}>
      <mesh castShadow={false}>
        <sphereGeometry args={[0.15 * S, 16, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13 * S, 0]}>
        <circleGeometry args={[0.12 * S, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13, 0]}>
        <circleGeometry args={[0.12, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
};
