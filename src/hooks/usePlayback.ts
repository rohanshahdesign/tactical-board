import { useEffect, useRef } from 'react';
import { useTacticalStore } from '../store/tacticalStore';
import { lerpPosition } from '../utils/coordinates';

export function usePlayback() {
  const playbackState = useTacticalStore((s) => s.playbackState);
  const playbackSpeed = useTacticalStore((s) => s.playbackSpeed);
  const loop = useTacticalStore((s) => s.loop);
  const frames = useTacticalStore((s) => s.frames);
  const currentFrameIndex = useTacticalStore((s) => s.currentFrameIndex);
  const players = useTacticalStore((s) => s.players);

  const rafRef = useRef<number>(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (playbackState !== 'playing' || frames.length < 2) return;

    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const delta = ((time - lastTimeRef.current) / 1000) * playbackSpeed;
      lastTimeRef.current = time;
      elapsedRef.current += delta;

      const store = useTacticalStore.getState();
      const frameIdx = store.currentFrameIndex;
      const currentFrame = store.frames[frameIdx];
      const nextFrame = store.frames[frameIdx + 1];

      if (!currentFrame) return;

      if (!nextFrame) {
        // Last frame reached
        if (loop) {
          useTacticalStore.setState({
            currentFrameIndex: 0,
            players: store.players.map((player) => {
              const nextState = store.frames[0]?.playerStates.find(
                (framePlayer) => framePlayer.playerId === player.id
              );
              return nextState
                ? { ...player, position: { ...nextState.position } }
                : player;
            }),
            ball: store.frames[0]?.ballState ?? store.ball,
          });
          elapsedRef.current = 0;
        } else {
          useTacticalStore.setState({ playbackState: 'stopped' });
          return;
        }
      } else {
        const duration = currentFrame.duration;
        const t = Math.min(elapsedRef.current / duration, 1);

        // Interpolate positions
        const updatedPlayers = store.players.map((p) => {
          const fromState = currentFrame.playerStates.find((ps) => ps.playerId === p.id);
          const toState = nextFrame.playerStates.find((ps) => ps.playerId === p.id);
          if (fromState && toState) {
            return { ...p, position: lerpPosition(fromState.position, toState.position, t) };
          }
          return p;
        });

        const nextBall =
          currentFrame.ballState.mode === 'free' && nextFrame.ballState.mode === 'free'
            ? {
                ...currentFrame.ballState,
                position: lerpPosition(
                  currentFrame.ballState.position,
                  nextFrame.ballState.position,
                  t
                ),
              }
            : t >= 1
              ? nextFrame.ballState
              : currentFrame.ballState;

        useTacticalStore.setState({ players: updatedPlayers, ball: nextBall });

        if (t >= 1) {
          // Move to next frame
          elapsedRef.current = 0;
          useTacticalStore.setState({
            currentFrameIndex: frameIdx + 1,
            ball: nextFrame.ballState,
          });
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    elapsedRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [playbackState, playbackSpeed, loop, frames.length]);
}
