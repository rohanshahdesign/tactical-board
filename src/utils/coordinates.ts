import { PITCH, Position2D } from '../types';

// Convert world coordinates to SVG viewport coordinates
export function worldToSvg(
  pos: Position2D,
  svgWidth: number,
  svgHeight: number
): { x: number; y: number } {
  const scaleX = svgWidth / PITCH.LENGTH;
  const scaleZ = svgHeight / PITCH.WIDTH;
  return {
    x: (pos.x + PITCH.HALF_LENGTH) * scaleX,
    y: (PITCH.HALF_WIDTH - pos.z) * scaleZ, // flip Z for SVG (Y down)
  };
}

// Convert SVG viewport coordinates back to world coordinates
export function svgToWorld(
  svgX: number,
  svgY: number,
  svgWidth: number,
  svgHeight: number
): Position2D {
  const scaleX = PITCH.LENGTH / svgWidth;
  const scaleZ = PITCH.WIDTH / svgHeight;
  return {
    x: svgX * scaleX - PITCH.HALF_LENGTH,
    z: PITCH.HALF_WIDTH - svgY * scaleZ,
  };
}

// Clamp position to pitch bounds
export function clampToPitch(pos: Position2D): Position2D {
  return {
    x: Math.max(-PITCH.HALF_LENGTH, Math.min(PITCH.HALF_LENGTH, pos.x)),
    z: Math.max(-PITCH.HALF_WIDTH, Math.min(PITCH.HALF_WIDTH, pos.z)),
  };
}

// Distance between two positions
export function distance(a: Position2D, b: Position2D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2);
}

// Lerp between two positions
export function lerpPosition(
  a: Position2D,
  b: Position2D,
  t: number
): Position2D {
  return {
    x: a.x + (b.x - a.x) * t,
    z: a.z + (b.z - a.z) * t,
  };
}
