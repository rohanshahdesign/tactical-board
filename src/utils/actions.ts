import { MovementType, PlayerAction } from '../types';

// Map action names to display labels
export const ACTION_LABELS: Record<PlayerAction, string> = {
  'shoot': 'Shoot',
  'volley': 'Volley',
  'header': 'Header',
  'pass-inside': 'Pass (Inside)',
  'pass-outside': 'Pass (Outside)',
  'tackle-standing': 'Standing Tackle',
  'slide-tackle': 'Slide Tackle',
  'press': 'Press',
  'intercept': 'Intercept',
  'block-shot': 'Block Shot',
  'sprint': 'Sprint',
  'idle': 'Idle',
  'jog': 'Jog',
  'walk': 'Walk',
  'jockey': 'Jockey',
  'change-direction': 'Change Direction',
  'gk-idle': 'GK Idle',
  'gk-dive-left': 'Dive Left',
  'gk-dive-right': 'Dive Right',
  'gk-dive-top-left': 'Dive Top Left',
  'gk-dive-top-right': 'Dive Top Right',
  'gk-dive-bottom-left': 'Dive Bottom Left',
  'gk-dive-bottom-right': 'Dive Bottom Right',
  'gk-jump-parry': 'Jump & Parry',
  'gk-collect': 'Collect Ball',
  'gk-kick': 'Goal Kick',
  'gk-volley-kick': 'Volley Kick',
  'gk-pass': 'GK Pass',
  'throw-in': 'Throw-in',
  'call-for-pass': 'Call for Pass',
  'jump': 'Jump',
  'none': 'None',
};

export const ATTACKING_ACTIONS: PlayerAction[] = [
  'shoot', 'volley', 'header', 'pass-inside', 'pass-outside',
];

export const DEFENSIVE_ACTIONS: PlayerAction[] = [
  'tackle-standing', 'slide-tackle', 'press', 'intercept', 'block-shot',
];

export const MOVEMENT_ACTIONS: PlayerAction[] = [
  'sprint', 'idle', 'jog', 'walk', 'jockey', 'change-direction',
];

export const GOALKEEPER_ACTIONS: PlayerAction[] = [
  'gk-idle', 'gk-dive-left', 'gk-dive-right',
  'gk-dive-top-left', 'gk-dive-top-right',
  'gk-dive-bottom-left', 'gk-dive-bottom-right',
  'gk-jump-parry', 'gk-collect', 'gk-kick', 'gk-volley-kick', 'gk-pass',
];

export const MISC_ACTIONS: PlayerAction[] = [
  'throw-in', 'call-for-pass', 'jump',
];

export const PLAYER_ANIMATION_NAMES = {
  idle: 'Breathing_idle',
  walk: 'Walking',
  jog: 'Jogging_forward',
  sprint: 'Sprint',
  turn: 'Turning',
  header: 'Soccer_header',
  pass: 'Soccer_pass',
  tackle: 'Tackle',
} as const;

const ACTION_TO_CLIP_NAME: Record<PlayerAction, string> = {
  shoot: PLAYER_ANIMATION_NAMES.idle,
  volley: PLAYER_ANIMATION_NAMES.idle,
  header: PLAYER_ANIMATION_NAMES.header,
  'pass-inside': PLAYER_ANIMATION_NAMES.pass,
  'pass-outside': PLAYER_ANIMATION_NAMES.pass,
  'tackle-standing': PLAYER_ANIMATION_NAMES.tackle,
  'slide-tackle': PLAYER_ANIMATION_NAMES.idle,
  press: PLAYER_ANIMATION_NAMES.idle,
  intercept: PLAYER_ANIMATION_NAMES.idle,
  'block-shot': PLAYER_ANIMATION_NAMES.idle,
  sprint: PLAYER_ANIMATION_NAMES.sprint,
  idle: PLAYER_ANIMATION_NAMES.idle,
  jog: PLAYER_ANIMATION_NAMES.jog,
  walk: PLAYER_ANIMATION_NAMES.walk,
  jockey: PLAYER_ANIMATION_NAMES.turn,
  'change-direction': PLAYER_ANIMATION_NAMES.turn,
  'gk-idle': PLAYER_ANIMATION_NAMES.idle,
  'gk-dive-left': PLAYER_ANIMATION_NAMES.idle,
  'gk-dive-right': PLAYER_ANIMATION_NAMES.idle,
  'gk-dive-top-left': PLAYER_ANIMATION_NAMES.idle,
  'gk-dive-top-right': PLAYER_ANIMATION_NAMES.idle,
  'gk-dive-bottom-left': PLAYER_ANIMATION_NAMES.idle,
  'gk-dive-bottom-right': PLAYER_ANIMATION_NAMES.idle,
  'gk-jump-parry': PLAYER_ANIMATION_NAMES.idle,
  'gk-collect': PLAYER_ANIMATION_NAMES.idle,
  'gk-kick': PLAYER_ANIMATION_NAMES.idle,
  'gk-volley-kick': PLAYER_ANIMATION_NAMES.idle,
  'gk-pass': PLAYER_ANIMATION_NAMES.idle,
  'throw-in': PLAYER_ANIMATION_NAMES.idle,
  'call-for-pass': PLAYER_ANIMATION_NAMES.idle,
  jump: PLAYER_ANIMATION_NAMES.idle,
  none: PLAYER_ANIMATION_NAMES.idle,
};

const PROGRESS_DRIVEN_ANIMATIONS = new Set<string>([
  PLAYER_ANIMATION_NAMES.header,
  PLAYER_ANIMATION_NAMES.pass,
  PLAYER_ANIMATION_NAMES.tackle,
]);

// Map action to semantic GLB animation clip name.
export function getAnimationClipName(action: PlayerAction): string {
  return ACTION_TO_CLIP_NAME[action] ?? PLAYER_ANIMATION_NAMES.idle;
}

export function getMovementClipName(movementType: MovementType): string {
  switch (movementType) {
    case 'walk':
      return PLAYER_ANIMATION_NAMES.walk;
    case 'jog':
      return PLAYER_ANIMATION_NAMES.jog;
    case 'run':
      return PLAYER_ANIMATION_NAMES.sprint;
    default:
      return PLAYER_ANIMATION_NAMES.idle;
  }
}

export function isProgressDrivenAnimation(clipName: string): boolean {
  return PROGRESS_DRIVEN_ANIMATIONS.has(clipName);
}

// Movement type to speed multiplier (meters per second)
export const MOVEMENT_SPEEDS = {
  walk: 1.5,
  jog: 3.5,
  run: 7.0,
} as const;
