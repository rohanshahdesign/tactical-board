// ============================================================
// Tactical Board — Core Type Definitions
// ============================================================

// --- Player Actions ---

export type AttackingAction =
  | 'shoot'
  | 'volley'
  | 'header'
  | 'pass-inside'
  | 'pass-outside';

export type DefensiveAction =
  | 'tackle-standing'
  | 'slide-tackle'
  | 'press'
  | 'intercept'
  | 'block-shot';

export type MovementAction =
  | 'sprint'
  | 'idle'
  | 'jog'
  | 'walk'
  | 'jockey'
  | 'change-direction';

export type GoalkeeperAction =
  | 'gk-idle'
  | 'gk-dive-left'
  | 'gk-dive-right'
  | 'gk-dive-top-left'
  | 'gk-dive-top-right'
  | 'gk-dive-bottom-left'
  | 'gk-dive-bottom-right'
  | 'gk-jump-parry'
  | 'gk-collect'
  | 'gk-kick'
  | 'gk-volley-kick'
  | 'gk-pass';

export type MiscAction = 'throw-in' | 'call-for-pass' | 'jump';

export type PlayerAction =
  | AttackingAction
  | DefensiveAction
  | MovementAction
  | GoalkeeperAction
  | MiscAction
  | 'none';

// --- Movement ---

export type MovementType = 'walk' | 'jog' | 'run';

// --- Position ---

export interface Position2D {
  x: number;
  z: number;
}

// --- Player ---

export type Team = 'home' | 'away';
export type PlayerRole = 'outfield' | 'goalkeeper';
export type PlayerModel = 'male' | 'female' | 'kid';

export interface Player {
  id: string;
  team: Team;
  role: PlayerRole;
  model: PlayerModel;
  jerseyNumber: number;
  name: string;
  showName: boolean;
  kitColor: string;
  height: number;
  position: Position2D;
}

// --- Pitch Objects ---

export type PitchObjectType =
  | 'cone'
  | 'marker'
  | 'hurdle'
  | 'blocker'
  | 'goalpost'
  | 'mini-net'
  | 'pole'
  | 'training-ladder';

export interface PitchObject {
  id: string;
  type: PitchObjectType;
  position: Position2D;
  rotation: number;
}

// --- Annotations ---

export interface Annotation {
  id: string;
  text: string;
  position: Position2D;
  fontSize: number;
  color: string;
}

// --- Ball ---

export interface Ball {
  mode: 'attached' | 'free';
  ownerId: string | null;
  position: Position2D;
}

// --- Animation Frames ---

export interface PlayerFrameState {
  playerId: string;
  position: Position2D;
  action: PlayerAction;
  movementType: MovementType;
}

export interface Frame {
  id: string;
  playerStates: PlayerFrameState[];
  ballState: Ball;
  duration: number;
}

// --- Camera ---

export type CameraMode = 'free' | 'broadcast';
export type CameraPreset = 'top' | 'angled' | 'player-perspective' | 'custom';
export type CameraViewAngle =
  | 'north'
  | 'north-east'
  | 'east'
  | 'south-east'
  | 'south'
  | 'south-west'
  | 'west'
  | 'north-west';

export interface CameraState {
  mode: CameraMode;
  preset: CameraPreset;
  targetPlayerId?: string;
  viewAngle?: CameraViewAngle;
}

// --- Formations ---

export interface Formation {
  id: string;
  name: string;
  isCustom: boolean;
  positions: Position2D[];
}

// --- Selection ---

export type SelectionType = 'player' | 'object' | 'annotation' | null;

export interface Selection {
  type: SelectionType;
  id: string | null;
}

// --- Playback ---

export type PlaybackState = 'stopped' | 'playing' | 'paused';

// --- Active Tool ---

export type ActiveTool =
  | 'select'
  | 'place-player'
  | 'place-object'
  | 'place-annotation'
  | 'draw';

// --- Pitch Constants ---

export const PITCH = {
  LENGTH: 105,
  WIDTH: 68,
  HALF_LENGTH: 52.5,
  HALF_WIDTH: 34,
  /** Scale factor applied to world coords in the 3D scene (keeps the stadium a manageable size) */
  SCENE_SCALE: 0.12,
} as const;
