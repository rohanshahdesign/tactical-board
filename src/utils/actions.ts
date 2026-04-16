import { PlayerAction } from '../types';

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

// Map action to GLB animation clip name
export function getAnimationClipName(action: PlayerAction): string {
  return action;
}

// Movement type to speed multiplier (meters per second)
export const MOVEMENT_SPEEDS = {
  walk: 1.5,
  jog: 3.5,
  run: 7.0,
} as const;
