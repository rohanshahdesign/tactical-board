import React, { useEffect, useState } from 'react';
import { useTacticalStore } from '../../store/tacticalStore';
import { CameraViewAngle } from '../../types';
import './ViewportOverlay.css';

const VIEW_ANGLE_OPTIONS: Array<{ label: string; value: CameraViewAngle }> = [
  { label: 'N', value: 'north' },
  { label: 'NE', value: 'north-east' },
  { label: 'E', value: 'east' },
  { label: 'SE', value: 'south-east' },
  { label: 'S', value: 'south' },
  { label: 'SW', value: 'south-west' },
  { label: 'W', value: 'west' },
  { label: 'NW', value: 'north-west' },
];

export const ViewportOverlay: React.FC = () => {
  const camera = useTacticalStore((s) => s.camera);
  const setCameraPreset = useTacticalStore((s) => s.setCameraPreset);
  const setCameraMode = useTacticalStore((s) => s.setCameraMode);
  const setCameraViewAngle = useTacticalStore((s) => s.setCameraViewAngle);
  const [isAnglePickerOpen, setIsAnglePickerOpen] = useState(false);

  useEffect(() => {
    if (camera.mode !== 'free') {
      setIsAnglePickerOpen(false);
    }
  }, [camera.mode]);

  const activateFreePreset = (preset: 'top' | 'angled' | 'player-perspective') => {
    setCameraMode('free');
    setCameraPreset(preset);
  };

  const activateAngleView = (viewAngle: CameraViewAngle) => {
    setCameraMode('free');
    setCameraPreset('custom');
    setCameraViewAngle(viewAngle);
    setIsAnglePickerOpen(false);
  };

  return (
    <div className="viewport-overlay">
      <div className="vo-zoom">
        <button className="vo-btn" disabled title="Use trackpad or mouse wheel to zoom">+</button>
        <span className="vo-zoom-label">Wheel Zoom</span>
        <button className="vo-btn" disabled title="Use trackpad or mouse wheel to zoom">−</button>
      </div>

      <div className="vo-camera-panel">
        <div className="vo-mode-switch" role="tablist" aria-label="Camera mode">
          <button
            type="button"
            className={`vo-mode-btn ${camera.mode === 'free' ? 'active' : ''}`}
            onClick={() => setCameraMode('free')}
          >
            Free
          </button>
          <button
            type="button"
            className={`vo-mode-btn ${camera.mode === 'broadcast' ? 'active' : ''}`}
            onClick={() => setCameraMode('broadcast')}
          >
            Broadcast
          </button>
        </div>

        <div className="vo-preset-group">
          <button
            type="button"
            className={`vo-camera-btn ${camera.mode === 'free' && camera.preset === 'top' ? 'active' : ''}`}
            onClick={() => activateFreePreset('top')}
          >
            Top
          </button>
          <button
            type="button"
            className={`vo-camera-btn ${camera.mode === 'free' && camera.preset === 'angled' ? 'active' : ''}`}
            onClick={() => activateFreePreset('angled')}
          >
            Angled
          </button>
          <button
            type="button"
            className={`vo-camera-btn ${camera.mode === 'free' && camera.preset === 'player-perspective' ? 'active' : ''}`}
            onClick={() => activateFreePreset('player-perspective')}
          >
            Player POV
          </button>
        </div>

        <button
          type="button"
          className={`vo-camera-btn ${isAnglePickerOpen || camera.viewAngle ? 'active' : ''}`}
          onClick={() => {
            setCameraMode('free');
            setIsAnglePickerOpen((open) => !open);
          }}
        >
          8 Views
        </button>

        {isAnglePickerOpen ? (
          <div className="vo-angle-picker" role="dialog" aria-label="Free camera views">
            {VIEW_ANGLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`vo-angle-btn ${camera.viewAngle === option.value ? 'active' : ''}`}
                onClick={() => activateAngleView(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
