import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useTacticalStore } from '../../store/tacticalStore';
import { PITCH, PitchObjectType, Position2D } from '../../types';
import {
  DEBUG_2D_BORDER_VISIBLE,
  PITCH_2D_DEBUG_LENGTH,
  PITCH_2D_DEBUG_WIDTH,
  PITCH_2D_DEBUG_CENTER_X,
  PITCH_2D_DEBUG_CENTER_Z,
} from '../3d/pitch3dConstants';
import './SVGPitch.css';

const SVG_WIDTH = 994;
const SVG_HEIGHT = 565;

// Field area bounds within the SVG (from the white boundary path)
const FIELD_LEFT = 183.834;
const FIELD_TOP = 76.986;
const FIELD_RIGHT = 783.834;
const FIELD_BOTTOM = 546.552;
const FIELD_W = FIELD_RIGHT - FIELD_LEFT;
const FIELD_H = FIELD_BOTTOM - FIELD_TOP;

const FIELD_SVG_PATH = '/assets/2d%20assets/football%20fields/1st%20football%20field%20-%20Top%20View-01%201.svg';

function worldToSvgLocal(pos: Position2D): { x: number; y: number } {
  return {
    x: FIELD_LEFT + ((pos.x + PITCH.HALF_LENGTH) / PITCH.LENGTH) * FIELD_W,
    y: FIELD_TOP + ((PITCH.HALF_WIDTH - pos.z) / PITCH.WIDTH) * FIELD_H,
  };
}

function svgToWorldLocal(svgX: number, svgY: number): Position2D {
  return {
    x: ((svgX - FIELD_LEFT) / FIELD_W) * PITCH.LENGTH - PITCH.HALF_LENGTH,
    z: PITCH.HALF_WIDTH - ((svgY - FIELD_TOP) / FIELD_H) * PITCH.WIDTH,
  };
}

export const SVGPitch: React.FC = () => {
  const players = useTacticalStore((s) => s.players);
  const objects = useTacticalStore((s) => s.objects);
  const annotations = useTacticalStore((s) => s.annotations);
  const ball = useTacticalStore((s) => s.ball);
  const activeTool = useTacticalStore((s) => s.activeTool);
  const playerPlacement = useTacticalStore((s) => s.playerPlacement);
  const objectPlacementType = useTacticalStore((s) => s.objectPlacementType);
  const selection = useTacticalStore((s) => s.selection);
  const select = useTacticalStore((s) => s.select);
  const clearSelection = useTacticalStore((s) => s.clearSelection);
  const addPlayer = useTacticalStore((s) => s.addPlayer);
  const addObject = useTacticalStore((s) => s.addObject);
  const addAnnotation = useTacticalStore((s) => s.addAnnotation);
  const movePlayer = useTacticalStore((s) => s.movePlayer);

  const svgRef = useRef<SVGSVGElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const selectionStroke = 'var(--selection-ring)';
  const objectFill = 'var(--object-accent)';
  const playerOutline = 'var(--player-outline)';
  const labelColor = 'var(--text-secondary)';
  const ballStroke = 'var(--ball-stroke)';
  const annotationSurface = 'var(--annotation-surface)';
  const annotationBorder = 'var(--annotation-border)';

  const toSvg = (pos: Position2D) => worldToSvgLocal(pos);

  const debugHalfLength = PITCH_2D_DEBUG_LENGTH / 2;
  const debugHalfWidth = PITCH_2D_DEBUG_WIDTH / 2;
  const debugCenter = { x: PITCH_2D_DEBUG_CENTER_X, z: PITCH_2D_DEBUG_CENTER_Z };
  const debugTopLeft = toSvg({ x: debugCenter.x - debugHalfLength, z: debugCenter.z + debugHalfWidth });
  const debugTopRight = toSvg({ x: debugCenter.x + debugHalfLength, z: debugCenter.z + debugHalfWidth });
  const debugBottomLeft = toSvg({ x: debugCenter.x - debugHalfLength, z: debugCenter.z - debugHalfWidth });
  const debugBottomRight = toSvg({ x: debugCenter.x + debugHalfLength, z: debugCenter.z - debugHalfWidth });

  const getWorldFromClient = useCallback((clientX: number, clientY: number): Position2D | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scaleX = SVG_WIDTH / rect.width;
    const scaleY = SVG_HEIGHT / rect.height;
    const svgX = (clientX - rect.left) * scaleX;
    const svgY = (clientY - rect.top) * scaleY;
    return svgToWorldLocal(svgX, svgY);
  }, []);

  const getSvgPoint = useCallback((e: React.MouseEvent): Position2D | null => {
    return getWorldFromClient(e.clientX, e.clientY);
  }, [getWorldFromClient]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragId) return;
      const worldPos = getSvgPoint(e);
      if (worldPos) movePlayer(dragId, worldPos);
    },
    [dragId, getSvgPoint, movePlayer]
  );

  const handleMouseUp = useCallback(() => {
    setDragId(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', handleMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', handleMouseUp);
    };
  }, [handleMouseUp]);

  // Ball position in SVG coords
  const ballOwner = ball.mode === 'attached' && ball.ownerId
    ? players.find((p) => p.id === ball.ownerId)
    : null;
  const ballSvg = ballOwner
    ? toSvg({ x: ballOwner.position.x + 1, z: ballOwner.position.z })
    : toSvg(ball.position);

  return (
    <div
      className="svg-pitch-wrapper"
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
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="svg-pitch"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          const target = e.target as SVGElement;
          if (target.tagName === 'svg' || target.classList.contains('pitch-bg')) {
            const worldPos = getSvgPoint(e);

            if (!worldPos) {
              clearSelection();
              return;
            }

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
          }
        }}
      >
        {/* Football field SVG background */}
        <rect className="pitch-bg" x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="transparent" />
        <image
          href={FIELD_SVG_PATH}
          x={0}
          y={0}
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          style={{ pointerEvents: 'none' }}
        />

        {DEBUG_2D_BORDER_VISIBLE && (
          <g style={{ pointerEvents: 'none' }}>
            <polyline
              points={[
                `${debugTopLeft.x},${debugTopLeft.y}`,
                `${debugTopRight.x},${debugTopRight.y}`,
                `${debugBottomRight.x},${debugBottomRight.y}`,
                `${debugBottomLeft.x},${debugBottomLeft.y}`,
                `${debugTopLeft.x},${debugTopLeft.y}`,
              ].join(' ')}
              fill="none"
              stroke="#ff2da6"
              strokeWidth={2}
            />
            {[debugTopLeft, debugTopRight, debugBottomRight, debugBottomLeft].map((point, index) => (
              <circle key={index} cx={point.x} cy={point.y} r={3.5} fill="#00e5ff" />
            ))}
          </g>
        )}

        {/* Objects */}
        {objects.map((obj) => {
          const pos = toSvg(obj.position);
          return (
            <g
              key={obj.id}
              onClick={(e) => { e.stopPropagation(); select('object', obj.id); }}
              style={{ cursor: 'pointer' }}
            >
              {selection.id === obj.id && (
                <circle cx={pos.x} cy={pos.y} r={12} fill="none" stroke={selectionStroke} strokeWidth={2} />
              )}
              <polygon
                points={`${pos.x},${pos.y - 8} ${pos.x - 6},${pos.y + 4} ${pos.x + 6},${pos.y + 4}`}
                fill={objectFill}
                opacity={0.8}
              />
            </g>
          );
        })}

        {/* Players */}
        {players.map((player) => {
          const pos = toSvg(player.position);
          const isSelected = selection.id === player.id;
          return (
            <g
              key={player.id}
              style={{ cursor: 'grab' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                select('player', player.id);
                if (activeTool === 'select') {
                  setDragId(player.id);
                }
              }}
            >
              {/* Selection ring */}
              {isSelected && (
                <circle cx={pos.x} cy={pos.y} r={18} fill="none" stroke={selectionStroke} strokeWidth={2.5} opacity={0.8} />
              )}
              {/* Player circle */}
              <circle cx={pos.x} cy={pos.y} r={14} fill={player.kitColor} stroke={isSelected ? selectionStroke : playerOutline} strokeWidth={isSelected ? 2 : 1} />
              {/* Jersey number */}
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontSize={10}
                fontWeight={700}
                fontFamily="system-ui"
                style={{ pointerEvents: 'none' }}
              >
                {player.jerseyNumber}
              </text>
              {/* Name */}
              {player.showName && (
                <text
                  x={pos.x}
                  y={pos.y - 20}
                  textAnchor="middle"
                  fill={labelColor}
                  fontSize={9}
                  fontFamily="system-ui"
                  style={{ pointerEvents: 'none' }}
                >
                  {player.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Ball */}
        <circle
          cx={ballSvg.x}
          cy={ballSvg.y}
          r={6}
          fill="#ffffff"
          stroke={ballStroke}
          strokeWidth={1}
        />

        {/* Annotations */}
        {annotations.map((anno) => {
          const pos = toSvg(anno.position);
          return (
            <g key={anno.id}>
              <rect
                x={pos.x - 40}
                y={pos.y - 12}
                width={80}
                height={24}
                rx={4}
                fill={annotationSurface}
                stroke={annotationBorder}
              />
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill={anno.color}
                fontSize={anno.fontSize * 0.7}
                fontFamily="system-ui"
              >
                {anno.text}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
