import { Player, Position2D, Team } from '../types';

const BALL_FORWARD_OFFSET = 0.52;
const BALL_LATERAL_OFFSET = 0.16;

function getDefaultForward(team: Team): Position2D {
  return team === 'home'
    ? { x: 1, z: 0 }
    : { x: -1, z: 0 };
}

export function getAttachedBallPosition(player: Pick<Player, 'position' | 'team'>): Position2D {
  const forward = getDefaultForward(player.team);
  const right = { x: forward.z, z: -forward.x };

  return {
    x: player.position.x + forward.x * BALL_FORWARD_OFFSET + right.x * BALL_LATERAL_OFFSET,
    z: player.position.z + forward.z * BALL_FORWARD_OFFSET + right.z * BALL_LATERAL_OFFSET,
  };
}