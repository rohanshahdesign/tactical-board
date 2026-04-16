import React from 'react';
import { Html } from '@react-three/drei';
import { Annotation, PITCH } from '../../types';
import { useTacticalStore } from '../../store/tacticalStore';
import { SCENE_SCALE, STADIUM_PITCH_Y, toStadiumSpace } from './pitch3dConstants';

const S = SCENE_SCALE;

interface Annotation3DProps {
  annotation: Annotation;
}

export const Annotation3D: React.FC<Annotation3DProps> = React.memo(({ annotation }) => {
  const theme = useTacticalStore((s) => s.theme);
  const stadiumPosition = toStadiumSpace(annotation.position);

  return (
    <group position={[stadiumPosition.x * S, STADIUM_PITCH_Y + 1.5 * S, stadiumPosition.z * S]}>
      <Html center distanceFactor={50} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            background: theme === 'light' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(14, 17, 28, 0.9)',
            backdropFilter: 'blur(8px)',
            border:
              theme === 'light'
                ? '1px solid rgba(15, 23, 42, 0.1)'
                : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '8px 12px',
            maxWidth: 200,
            color: annotation.color,
            fontSize: annotation.fontSize,
            fontFamily: 'system-ui',
            lineHeight: 1.4,
            boxShadow:
              theme === 'light'
                ? '0 10px 22px rgba(15, 23, 42, 0.14)'
                : '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {annotation.text}
        </div>
      </Html>
    </group>
  );
});

Annotation3D.displayName = 'Annotation3D';
