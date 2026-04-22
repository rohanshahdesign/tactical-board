import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTacticalStore } from '../../store/tacticalStore';
import { CameraViewAngle } from '../../types';
import './ViewportOverlay.css';

// tabler:video-filled points right by default.
// Rotation makes each camera "face toward the pitch center".
const VIEW_ANGLE_OPTIONS: Array<{
  value: CameraViewAngle;
  row: number;
  column: number;
  rotation: number;
  label: string;
}> = [
  { value: 'north-west', row: 1, column: 1, rotation:  45,   label: 'North-west' },
  { value: 'north',      row: 1, column: 2, rotation:  90,   label: 'North'      },
  { value: 'north-east', row: 1, column: 3, rotation:  135,  label: 'North-east' },
  { value: 'west',       row: 2, column: 1, rotation:  0,    label: 'West'       },
  { value: 'east',       row: 2, column: 3, rotation:  180,  label: 'East'       },
  { value: 'south-west', row: 3, column: 1, rotation: -45,   label: 'South-west' },
  { value: 'south',      row: 3, column: 2, rotation: -90,   label: 'South'      },
  { value: 'south-east', row: 3, column: 3, rotation: -135,  label: 'South-east' },
];

type CameraPanelView = 'main' | 'angles';

export const ViewportOverlay: React.FC = () => {
  const camera = useTacticalStore((s) => s.camera);
  const setCameraPreset = useTacticalStore((s) => s.setCameraPreset);
  const setCameraMode = useTacticalStore((s) => s.setCameraMode);
  const setCameraViewAngle = useTacticalStore((s) => s.setCameraViewAngle);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [isCameraPanelOpen, setIsCameraPanelOpen] = useState(false);
  const [panelView, setPanelView] = useState<CameraPanelView>('main');

  useEffect(() => {
    if (camera.mode !== 'free') {
      setPanelView('main');
    }
  }, [camera.mode]);

  useEffect(() => {
    if (!isCameraPanelOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!overlayRef.current?.contains(event.target as Node)) {
        setIsCameraPanelOpen(false);
        setPanelView('main');
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isCameraPanelOpen]);

  const activateFreePreset = (preset: 'top' | 'angled' | 'player-perspective') => {
    setCameraMode('free');
    setCameraPreset(preset);
    setPanelView('main');
  };

  const activateAngleView = (viewAngle: CameraViewAngle) => {
    setCameraMode('free');
    setCameraPreset('custom');
    setCameraViewAngle(viewAngle);
  };

  const openCameraPanel = () => {
    setIsCameraPanelOpen(true);
    setPanelView(camera.mode === 'free' && camera.preset === 'custom' ? 'angles' : 'main');
  };

  const openAnglePicker = () => {
    setCameraMode('free');
    setIsCameraPanelOpen(true);
    setPanelView('angles');
  };

  const closeCameraPanel = () => {
    setIsCameraPanelOpen(false);
    setPanelView('main');
  };

  return (
    <div ref={overlayRef} className="viewport-overlay">
      {/* Zoom pill */}
      <div className="vo-zoom">
        <button
          className="vo-btn"
          title="Zoom in"
          onClick={() => {
            const canvas = document.querySelector<HTMLCanvasElement>('.three-scene-wrapper canvas');
            canvas?.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));
          }}
        >+</button>
        <button
          className="vo-btn"
          title="Zoom out"
          onClick={() => {
            const canvas = document.querySelector<HTMLCanvasElement>('.three-scene-wrapper canvas');
            canvas?.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
          }}
        >−</button>
      </div>

      {/* Camera dock */}
      <div className="vo-camera-dock">
        {isCameraPanelOpen ? (
          <div
            className={`vo-camera-panel${panelView === 'angles' ? ' is-angles' : ''}`}
            role="dialog"
            aria-label="Camera controls"
          >
            {/* Close */}
            <button
              type="button"
              className="vo-close-btn"
              onClick={closeCameraPanel}
              aria-label="Close camera controls"
            >
              <Icon icon="tabler:x" width={12} height={12} />
            </button>

            {panelView === 'main' ? (
              <>
                {/* Mode tabs */}
                <div className="vo-mode-switch" role="tablist" aria-label="Camera mode">
                  <button
                    type="button"
                    className={`vo-mode-btn${camera.mode === 'free' ? ' active' : ''}`}
                    onClick={() => setCameraMode('free')}
                  >
                    Free
                  </button>
                  <button
                    type="button"
                    className={`vo-mode-btn${camera.mode === 'broadcast' ? ' active' : ''}`}
                    onClick={() => setCameraMode('broadcast')}
                  >
                    Broadcast
                  </button>
                </div>

                {/* Preset buttons */}
                <div className="vo-preset-group">
                  <button
                    type="button"
                    className={`vo-camera-btn${camera.mode === 'free' && camera.preset === 'top' ? ' active' : ''}`}
                    onClick={() => activateFreePreset('top')}
                  >
                    Top
                  </button>
                  <button
                    type="button"
                    className={`vo-camera-btn${camera.mode === 'free' && camera.preset === 'player-perspective' ? ' active' : ''}`}
                    onClick={() => activateFreePreset('player-perspective')}
                  >
                    Player POV
                  </button>
                  <button
                    type="button"
                    className={`vo-camera-btn vo-camera-btn-wide${camera.mode === 'free' && camera.preset === 'custom' ? ' active' : ''}`}
                    onClick={openAnglePicker}
                  >
                    Custom
                  </button>
                </div>
              </>
            ) : (
              /* Custom angle picker */
              <div className="vo-angle-panel">
                <button
                  type="button"
                  className="vo-back-btn"
                  onClick={() => setPanelView('main')}
                >
                  <Icon icon="tabler:arrow-left" width={13} height={13} />
                  Custom
                </button>

                <div className="vo-angle-picker" aria-label="Camera direction">
                  {VIEW_ANGLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`vo-angle-btn${camera.viewAngle === opt.value ? ' active' : ''}`}
                      style={{ gridRow: opt.row, gridColumn: opt.column }}
                      onClick={() => activateAngleView(opt.value)}
                      aria-label={opt.label}
                      title={opt.label}
                    >
                      <Icon
                        icon="tabler:video-filled"
                        width={18}
                        height={18}
                        style={{ transform: `rotate(${opt.rotation}deg)` }}
                      />
                    </button>
                  ))}
                  {/* Centre decoration — not a button */}
                  <div className="vo-angle-center" aria-hidden="true" />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Collapsed trigger */
          <button
            type="button"
            className="vo-camera-trigger"
            onClick={openCameraPanel}
            aria-label="Open camera controls"
          >
            <Icon icon="tabler:video" width={22} height={22} />
          </button>
        )}
      </div>
    </div>
  );
};
