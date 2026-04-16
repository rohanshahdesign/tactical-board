import { PITCH, Position2D } from '../../types';

export const SCENE_SCALE = PITCH.SCENE_SCALE;
export const STADIUM_PLAYABLE_LENGTH = 218;
export const STADIUM_PLAYABLE_WIDTH = 123;
export const STADIUM_X_SIGN = 1;
export const STADIUM_Z_SIGN = -1;
export const PITCH_2D_DEBUG_LENGTH = 144;
export const PITCH_2D_DEBUG_WIDTH = 76;
export const PITCH_2D_DEBUG_CENTER_X = 2.5;
export const PITCH_2D_DEBUG_CENTER_Z = 3.7;
export const DEBUG_2D_BORDER_VISIBLE = false;
export const DEBUG_3D_BORDER_VISIBLE = false;

// Calibrated from the stadium GLB so on-pitch entities sit on the rendered turf.
export const STADIUM_PITCH_Y = 0;
export const STADIUM_INTERACTION_Y = STADIUM_PITCH_Y + 0.03;
export const STADIUM_DEBUG_Y = STADIUM_PITCH_Y + 0.5;

export function toStadiumSpace(position: Position2D): Position2D {
	return {
		x: position.x * (STADIUM_PLAYABLE_LENGTH / PITCH.LENGTH) * STADIUM_X_SIGN,
		z: position.z * (STADIUM_PLAYABLE_WIDTH / PITCH.WIDTH) * STADIUM_Z_SIGN,
	};
}

export function fromStadiumSpace(position: Position2D): Position2D {
	return {
		x: position.x * (PITCH.LENGTH / STADIUM_PLAYABLE_LENGTH) * STADIUM_X_SIGN,
		z: position.z * (PITCH.WIDTH / STADIUM_PLAYABLE_WIDTH) * STADIUM_Z_SIGN,
	};
}