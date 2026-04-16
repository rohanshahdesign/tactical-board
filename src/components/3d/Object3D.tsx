import React, { useMemo } from 'react';
import * as THREE from 'three';
import { PitchObject, PITCH } from '../../types';
import { SCENE_SCALE, STADIUM_PITCH_Y, toStadiumSpace } from './pitch3dConstants';

const S = SCENE_SCALE;

interface Object3DProps {
  object: PitchObject;
  isSelected: boolean;
  onSelect: () => void;
}

export const Object3D: React.FC<Object3DProps> = React.memo(({ object, isSelected, onSelect }) => {
  const stadiumPosition = useMemo(() => toStadiumSpace(object.position), [object.position]);
  const color = useMemo(() => {
    switch (object.type) {
      case 'cone': return '#ff8c00';
      case 'marker': return '#ff4444';
      case 'hurdle': return '#ffdd00';
      case 'blocker': return '#888888';
      case 'pole': return '#cccccc';
      case 'training-ladder': return '#ffaa00';
      case 'mini-net': return '#ffffff';
      case 'goalpost': return '#ffffff';
      default: return '#888888';
    }
  }, [object.type]);

  return (
    <group
      position={[stadiumPosition.x * S, STADIUM_PITCH_Y, stadiumPosition.z * S]}
      rotation={[0, object.rotation, 0]}
      scale={[S, S, S]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      userData={{ entityId: object.id, entityType: 'object' }}
    >
      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.4, 0.55, 24]} />
          <meshBasicMaterial color="#2563eb" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Placeholder mesh per type */}
      {object.type === 'cone' && (
        <mesh position={[0, 0.2, 0]} castShadow={false}>
          <coneGeometry args={[0.2, 0.4, 8]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      )}

      {object.type === 'marker' && (
        <group>
          <mesh position={[0, 0.4, 0]} castShadow={false}>
            <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
            <meshStandardMaterial color="#cccccc" />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow={false}>
            <planeGeometry args={[0.3, 0.2]} />
            <meshStandardMaterial color={color} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {object.type === 'hurdle' && (
        <group>
          <mesh position={[-0.25, 0.15, 0]} castShadow={false}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0.25, 0.15, 0]} castShadow={false}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow={false}>
            <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      )}

      {object.type === 'pole' && (
        <mesh position={[0, 0.75, 0]} castShadow={false}>
          <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
        </mesh>
      )}

      {object.type === 'blocker' && (
        <mesh position={[0, 0.5, 0]} castShadow={false}>
          <boxGeometry args={[0.6, 1.0, 0.15]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      )}

      {(object.type === 'training-ladder') && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow={false}>
          <planeGeometry args={[0.6, 2.5]} />
          <meshStandardMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {object.type === 'mini-net' && (
        <mesh position={[0, 0.5, 0]} castShadow={false}>
          <boxGeometry args={[1.5, 1.0, 0.05]} />
          <meshStandardMaterial color={color} transparent opacity={0.15} wireframe />
        </mesh>
      )}

      {/* Generic fallback for goalpost etc */}
      {object.type === 'goalpost' && (
        <mesh position={[0, 1.2, 0]} castShadow={false}>
          <boxGeometry args={[0.1, 2.4, 3.5]} />
          <meshStandardMaterial color={color} wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
});

Object3D.displayName = 'Object3D';
