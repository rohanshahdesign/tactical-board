import { create } from 'zustand';
import { temporal } from 'zundo';
import { v4 as uuidv4 } from 'uuid';
import {
  Player,
  PitchObject,
  Annotation,
  Ball,
  Frame,
  PlayerFrameState,
  CameraState,
  Formation,
  Selection,
  PlaybackState,
  ActiveTool,
  Position2D,
  PlayerAction,
  MovementType,
  Team,
  PlayerRole,
  PlayerModel,
  PitchObjectType,
  PITCH,
  SceneVisibility,
} from '../types';
import { DEFAULT_FORMATIONS } from '../data/formations';
import { getAttachedBallPosition } from '../utils/ball';

type SceneLayerId = keyof SceneVisibility;
const DEBUG_PLAYER_SPAWN = import.meta.env.DEV;

export interface TacticalStore {
  // --- Mode ---
  mode: '2D' | '3D';
  animationEnabled: boolean;
  theme: 'dark' | 'light';
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  sceneVisibility: SceneVisibility;

  // --- Entities ---
  players: Player[];
  objects: PitchObject[];
  annotations: Annotation[];
  ball: Ball;

  // --- Animation ---
  frames: Frame[];
  currentFrameIndex: number;
  playbackState: PlaybackState;
  playbackProgress: number;
  playbackSpeed: number;
  loop: boolean;
  runModelScale: number;
  runModelYOffset: number;
  runModelYawOffset: number;

  // --- Camera ---
  camera: CameraState;

  // --- Selection ---
  selection: Selection;

  // --- Formations ---
  formations: Formation[];

  // --- Active Tool ---
  activeTool: ActiveTool;
  playerPlacement: {
    team: Team;
    role: PlayerRole;
    model: PlayerModel;
  };
  objectPlacementType: PitchObjectType;

  // --- Mode Actions ---
  setMode: (mode: '2D' | '3D') => void;
  toggleMode: () => void;
  setAnimationEnabled: (enabled: boolean) => void;
  toggleAnimation: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setSceneLayerVisibility: (layer: SceneLayerId, visible: boolean) => void;
  toggleSceneLayerVisibility: (layer: SceneLayerId) => void;

  // --- Player Actions ---
  addPlayer: (config: {
    team: Team;
    role: PlayerRole;
    model: PlayerModel;
    position: Position2D;
    kitColor: string;
    jerseyNumber?: number;
    name?: string;
  }) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  movePlayer: (id: string, position: Position2D) => void;

  // --- Object Actions ---
  addObject: (type: PitchObjectType, position: Position2D) => void;
  updateObject: (id: string, updates: Partial<PitchObject>) => void;
  removeObject: (id: string) => void;

  // --- Annotation Actions ---
  addAnnotation: (text: string, position: Position2D) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;

  // --- Ball Actions ---
  attachBall: (playerId: string) => void;
  detachBall: () => void;
  moveBall: (position: Position2D) => void;
  passBall: (targetPlayerId: string) => void;

  // --- Selection Actions ---
  select: (type: Selection['type'], id: string | null) => void;
  clearSelection: () => void;

  // --- Frame Actions ---
  addFrame: () => void;
  duplicateFrame: (index: number) => void;
  deleteFrame: (index: number) => void;
  reorderFrames: (fromIndex: number, toIndex: number) => void;
  setCurrentFrame: (index: number) => void;
  updatePlayerFrameState: (
    frameIndex: number,
    playerId: string,
    updates: Partial<PlayerFrameState>
  ) => void;

  // --- Playback Actions ---
  play: () => void;
  pause: () => void;
  stop: () => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleLoop: () => void;
  setRunModelScale: (scale: number) => void;
  setRunModelYOffset: (offset: number) => void;
  setRunModelYawOffset: (offset: number) => void;
  spawnDebugRun: () => void;

  // --- Camera Actions ---
  setCameraMode: (mode: CameraState['mode']) => void;
  setCameraPreset: (preset: CameraState['preset']) => void;
  setCameraViewAngle: (angle: CameraState['viewAngle']) => void;
  setCameraTarget: (playerId: string | undefined) => void;

  // --- Formation Actions ---
  loadFormation: (formationId: string, team: Team) => void;
  flipFormation: () => void;
  saveCustomFormation: (name: string) => void;

  // --- Tool Actions ---
  setActiveTool: (tool: ActiveTool) => void;
  setPlayerPlacement: (placement: Partial<TacticalStore['playerPlacement']>) => void;
  setObjectPlacementType: (type: PitchObjectType) => void;

  // --- Board Actions ---
  resetBoard: () => void;

  // --- Helpers ---
  getSelectedPlayer: () => Player | undefined;
  getSelectedObject: () => PitchObject | undefined;
  getCurrentFrameStates: () => PlayerFrameState[];
}

const initialBall: Ball = {
  mode: 'free',
  ownerId: null,
  position: { x: 0, z: 0 },
};

const initialCamera: CameraState = {
  mode: 'free',
  preset: 'angled',
  viewAngle: undefined,
};

export const useTacticalStore = create<TacticalStore>()(
  temporal(
    (set, get) => ({
      // --- Initial State ---
      mode: '3D',
      animationEnabled: false,
      theme: 'dark',
      leftPanelCollapsed: false,
      rightPanelCollapsed: false,
      sceneVisibility: {
        field: true,
        players: true,
        objects: true,
        ball: true,
        annotations: true,
      },
      players: [],
      objects: [],
      annotations: [],
      ball: { ...initialBall },
      frames: [],
      currentFrameIndex: 0,
      playbackState: 'stopped',
      playbackProgress: 0,
      playbackSpeed: 1,
      loop: false,
      runModelScale: 5,
      runModelYOffset: 0,
      runModelYawOffset: 0,
      camera: { ...initialCamera },
      selection: { type: null, id: null },
      formations: [...DEFAULT_FORMATIONS],
      activeTool: 'select',
      playerPlacement: {
        team: 'home',
        role: 'outfield',
        model: 'male',
      },
      objectPlacementType: 'cone',

      // --- Mode ---
      setMode: (mode) => set({ mode }),
      toggleMode: () =>
        set((state) => ({ mode: state.mode === '2D' ? '3D' : '2D' })),
      setAnimationEnabled: (enabled) => set({ animationEnabled: enabled }),
      toggleAnimation: () =>
        set((state) => ({
          animationEnabled: !state.animationEnabled,
          playbackState: !state.animationEnabled ? state.playbackState : 'stopped',
          playbackProgress: !state.animationEnabled ? state.playbackProgress : 0,
        })),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      toggleLeftPanel: () =>
        set((state) => ({ leftPanelCollapsed: !state.leftPanelCollapsed })),
      toggleRightPanel: () =>
        set((state) => ({ rightPanelCollapsed: !state.rightPanelCollapsed })),
      setSceneLayerVisibility: (layer, visible) =>
        set((state) => ({
          sceneVisibility: {
            ...state.sceneVisibility,
            [layer]: visible,
          },
        })),
      toggleSceneLayerVisibility: (layer) =>
        set((state) => ({
          sceneVisibility: {
            ...state.sceneVisibility,
            [layer]: !state.sceneVisibility[layer],
          },
        })),

      // --- Players ---
      addPlayer: (config) => {
        const { players, mode, animationEnabled, frames } = get();
        const teamPlayers = players.filter((p) => p.team === config.team);
        const jerseyNumber =
          config.jerseyNumber ?? teamPlayers.length + 1;
        const player: Player = {
          id: uuidv4(),
          team: config.team,
          role: config.role,
          model: config.model,
          jerseyNumber,
          name: config.name ?? `Player ${jerseyNumber}`,
          showName: true,
          kitColor: config.kitColor,
          height: 1.0,
          position: resolvePlayerPositionForMode(mode, config.position),
        };

        const updatedFrames =
          animationEnabled && frames.length > 0
            ? frames.map((frame) => ({
                ...frame,
                playerStates: frame.playerStates.some((ps) => ps.playerId === player.id)
                  ? frame.playerStates
                  : [...frame.playerStates, createPlayerFrameState(player)],
              }))
            : frames;

        if (DEBUG_PLAYER_SPAWN) {
          console.info('[Tactical] addPlayer', {
            requestedPosition: config.position,
            resolvedPosition: player.position,
            mode,
            player: {
              id: player.id,
              name: player.name,
              team: player.team,
              role: player.role,
              model: player.model,
              height: player.height,
            },
            nextPlayerCount: players.length + 1,
            animationEnabled,
          });
        }

        set({ players: [...players, player], frames: updatedFrames });
      },

      updatePlayer: (id, updates) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      removePlayer: (id) =>
        set((state) => ({
          players: state.players.filter((p) => p.id !== id),
          frames: state.frames.map((frame) => ({
            ...frame,
            playerStates: frame.playerStates.filter((ps) => ps.playerId !== id),
          })),
          selection:
            state.selection.id === id
              ? { type: null, id: null }
              : state.selection,
          ball:
            state.ball.ownerId === id
              ? { ...state.ball, mode: 'free', ownerId: null }
              : state.ball,
        })),

      movePlayer: (id, position) => {
        const { animationEnabled, currentFrameIndex, frames, mode, players, ball } = get();
        const nextPosition = resolvePlayerPositionForMode(mode, position);
        const movingPlayer = players.find((player) => player.id === id);
        const attachedBallPosition =
          movingPlayer && ball.ownerId === id
            ? getAttachedBallPosition({
                position: nextPosition,
                team: movingPlayer.team,
              })
            : null;

        if (animationEnabled && frames.length > 0) {
          // Update frame state
          const frame = frames[currentFrameIndex];
          if (frame) {
            const updatedStates = frame.playerStates.map((ps) =>
              ps.playerId === id
                ? { ...ps, position: nextPosition, movementType: 'run' as MovementType }
                : ps
            );
            const updatedFrames = [...frames];
            updatedFrames[currentFrameIndex] = {
              ...frame,
              playerStates: updatedStates,
              ballState:
                frame.ballState.mode === 'attached' && frame.ballState.ownerId === id && attachedBallPosition
                  ? { ...frame.ballState, position: attachedBallPosition }
                  : frame.ballState,
            };
            set({ frames: updatedFrames });
          }
        }

        // Always update current position
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, position: nextPosition } : p
          ),
          ball:
            state.ball.mode === 'attached' && state.ball.ownerId === id && attachedBallPosition
              ? { ...state.ball, position: attachedBallPosition }
              : state.ball,
        }));
      },

      // --- Objects ---
      addObject: (type, position) =>
        set((state) => ({
          objects: [
            ...state.objects,
            {
              id: uuidv4(),
              type,
              position: resolvePositionForMode(state.mode, position),
              rotation: 0,
            },
          ],
        })),

      updateObject: (id, updates) =>
        set((state) => ({
          objects: state.objects.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
        })),

      removeObject: (id) =>
        set((state) => ({
          objects: state.objects.filter((o) => o.id !== id),
          selection:
            state.selection.id === id
              ? { type: null, id: null }
              : state.selection,
        })),

      // --- Annotations ---
      addAnnotation: (text, position) =>
        set((state) => ({
          annotations: [
            ...state.annotations,
            {
              id: uuidv4(),
              text,
              position: resolvePositionForMode(state.mode, position),
              fontSize: 14,
              color: '#ffffff',
            },
          ],
        })),

      updateAnnotation: (id, updates) =>
        set((state) => ({
          annotations: state.annotations.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      removeAnnotation: (id) =>
        set((state) => ({
          annotations: state.annotations.filter((a) => a.id !== id),
          selection:
            state.selection.id === id
              ? { type: null, id: null }
              : state.selection,
        })),

      // --- Ball ---
      attachBall: (playerId) =>
        set((state) => {
          const owner = state.players.find((player) => player.id === playerId);
          const nextBall: Ball = {
            mode: 'attached',
            ownerId: playerId,
            position: owner ? getAttachedBallPosition(owner) : state.ball.position,
          };

          const currentFrame = state.frames[state.currentFrameIndex];
          const frames =
            state.animationEnabled && currentFrame
              ? state.frames.map((frame, index) =>
                  index === state.currentFrameIndex
                    ? { ...frame, ballState: { ...nextBall } }
                    : frame
                )
              : state.frames;

          return {
            ball: nextBall,
            frames,
          };
        }),

      detachBall: () =>
        set((state) => {
          const owner = state.players.find(
            (p) => p.id === state.ball.ownerId
          );
          const nextBall: Ball = {
            mode: 'free',
            ownerId: null,
            position: owner
              ? getAttachedBallPosition(owner)
              : state.ball.position,
          };

          const currentFrame = state.frames[state.currentFrameIndex];
          const frames =
            state.animationEnabled && currentFrame
              ? state.frames.map((frame, index) =>
                  index === state.currentFrameIndex
                    ? { ...frame, ballState: { ...nextBall } }
                    : frame
                )
              : state.frames;

          return {
            ball: nextBall,
            frames,
          };
        }),

      moveBall: (position) =>
        set((state) => {
          const nextBall: Ball = {
            mode: 'free',
            ownerId: null,
            position: resolvePositionForMode(state.mode, position),
          };

          const currentFrame = state.frames[state.currentFrameIndex];
          const frames =
            state.animationEnabled && currentFrame
              ? state.frames.map((frame, index) =>
                  index === state.currentFrameIndex
                    ? { ...frame, ballState: { ...nextBall } }
                    : frame
                )
              : state.frames;

          return {
            ball: nextBall,
            frames,
          };
        }),

      passBall: (targetPlayerId) =>
        set((state) => {
          const targetPlayer = state.players.find((player) => player.id === targetPlayerId);
          const nextBall: Ball = {
            mode: 'attached',
            ownerId: targetPlayerId,
            position: targetPlayer ? getAttachedBallPosition(targetPlayer) : state.ball.position,
          };

          const currentFrame = state.frames[state.currentFrameIndex];
          const frames =
            state.animationEnabled && currentFrame
              ? state.frames.map((frame, index) =>
                  index === state.currentFrameIndex
                    ? { ...frame, ballState: { ...nextBall } }
                    : frame
                )
              : state.frames;

          return {
            ball: nextBall,
            frames,
          };
        }),

      // --- Selection ---
      select: (type, id) => set({ selection: { type, id } }),
      clearSelection: () => set({ selection: { type: null, id: null } }),

      // --- Frames ---
      addFrame: () => {
        const { players, ball, frames } = get();
        const newFrame: Frame = {
          id: uuidv4(),
          playerStates: players.map((p) => ({
            playerId: p.id,
            position: { ...p.position },
            action: 'idle' as PlayerAction,
            movementType: 'run' as MovementType,
          })),
          ballState: { ...ball },
          duration: 2,
        };
        set({
          frames: [...frames, newFrame],
          currentFrameIndex: frames.length,
          playbackProgress: 0,
        });
      },

      duplicateFrame: (index) => {
        const { frames } = get();
        if (index < 0 || index >= frames.length) return;
        const source = frames[index];
        const duplicate: Frame = {
          ...source,
          id: uuidv4(),
          playerStates: source.playerStates.map((ps) => ({ ...ps, position: { ...ps.position } })),
          ballState: { ...source.ballState, position: { ...source.ballState.position } },
        };
        const updated = [...frames];
        updated.splice(index + 1, 0, duplicate);
        set({ frames: updated, currentFrameIndex: index + 1, playbackProgress: 0 });
      },

      deleteFrame: (index) => {
        const { frames, currentFrameIndex } = get();
        if (frames.length <= 1) {
          set({ frames: [], currentFrameIndex: 0, playbackProgress: 0 });
          return;
        }
        const updated = frames.filter((_, i) => i !== index);
        set({
          frames: updated,
          currentFrameIndex: Math.min(
            currentFrameIndex,
            updated.length - 1
          ),
          playbackProgress: 0,
        });
      },

      reorderFrames: (fromIndex, toIndex) =>
        set((state) => {
          const updated = [...state.frames];
          const [moved] = updated.splice(fromIndex, 1);
          updated.splice(toIndex, 0, moved);
          return { frames: updated };
        }),

      setCurrentFrame: (index) => {
        const { frames, players } = get();
        if (index < 0 || index >= frames.length) return;
        const frame = frames[index];
        // Apply frame state to players
        const updatedPlayers = players.map((p) => {
          const fs = frame.playerStates.find((ps) => ps.playerId === p.id);
          return fs ? { ...p, position: { ...fs.position } } : p;
        });
        set({
          currentFrameIndex: index,
          playbackProgress: 0,
          players: updatedPlayers,
          ball: { ...frame.ballState },
        });
      },

      updatePlayerFrameState: (frameIndex, playerId, updates) =>
        set((state) => {
          const frames = [...state.frames];
          const frame = frames[frameIndex];
          if (!frame) return state;
          frames[frameIndex] = {
            ...frame,
            playerStates: frame.playerStates.map((ps) =>
              ps.playerId === playerId ? { ...ps, ...updates } : ps
            ),
          };
          return { frames };
        }),

      // --- Playback ---
      play: () => set({ playbackState: 'playing' }),
      pause: () => set({ playbackState: 'paused' }),
      stop: () => set({ playbackState: 'stopped', currentFrameIndex: 0, playbackProgress: 0 }),
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
      toggleLoop: () => set((state) => ({ loop: !state.loop })),
      setRunModelScale: (scale) => set({ runModelScale: scale }),
      setRunModelYOffset: (offset) => set({ runModelYOffset: offset }),
      setRunModelYawOffset: (offset) => set({ runModelYawOffset: offset }),
      spawnDebugRun: () => {
        const debugPlayerId = uuidv4();
        const startPosition = { x: -14, z: 8 };
        const endPosition = { x: 10, z: -4 };
        const debugPlayer: Player = {
          id: debugPlayerId,
          team: 'home',
          role: 'outfield',
          model: 'male',
          jerseyNumber: 9,
          name: 'Debug Runner',
          showName: false,
          kitColor: '#3b82f6',
          height: 1.0,
          position: startPosition,
        };

        const frames: Frame[] = [
          {
            id: uuidv4(),
            playerStates: [
              {
                playerId: debugPlayerId,
                position: startPosition,
                action: 'idle',
                movementType: 'run',
              },
            ],
            ballState: { ...initialBall },
            duration: 2,
          },
          {
            id: uuidv4(),
            playerStates: [
              {
                playerId: debugPlayerId,
                position: endPosition,
                action: 'idle',
                movementType: 'run',
              },
            ],
            ballState: { ...initialBall },
            duration: 2,
          },
        ];

        set({
          mode: '3D',
          animationEnabled: true,
          players: [debugPlayer],
          objects: [],
          annotations: [],
          ball: { ...initialBall },
          frames,
          currentFrameIndex: 0,
          playbackState: 'playing',
          playbackProgress: 0,
          selection: { type: null, id: null },
        });
      },

      // --- Camera ---
      setCameraMode: (mode) =>
        set((state) => ({ camera: { ...state.camera, mode } })),
      setCameraPreset: (preset) =>
        set((state) => ({
          camera: {
            ...state.camera,
            preset,
            viewAngle: preset === 'custom' ? state.camera.viewAngle : undefined,
          },
        })),
      setCameraViewAngle: (viewAngle) =>
        set((state) => ({
          camera: {
            ...state.camera,
            viewAngle,
          },
        })),
      setCameraTarget: (playerId) =>
        set((state) => ({
          camera: { ...state.camera, targetPlayerId: playerId },
        })),

      // --- Formations ---
      loadFormation: (formationId, team) => {
        const { formations, players } = get();
        const formation = formations.find((f) => f.id === formationId);
        if (!formation) return;

        // Remove existing players of the team
        const otherPlayers = players.filter((p) => p.team !== team);
        const kitColor = team === 'home' ? '#3b82f6' : '#ef4444';

        const newPlayers: Player[] = formation.positions.map((pos, i) => ({
          id: uuidv4(),
          team,
          role: i === 0 ? 'goalkeeper' : 'outfield',
          model: 'male',
          jerseyNumber: i + 1,
          name: i === 0 ? 'GK' : `Player ${i + 1}`,
          showName: true,
          kitColor,
          height: 1.0,
          position: { ...pos },
        }));

        set({ players: [...otherPlayers, ...newPlayers] });
      },

      flipFormation: () =>
        set((state) => ({
          players: state.players.map((p) => ({
            ...p,
            position: { x: -p.position.x, z: -p.position.z },
          })),
        })),

      saveCustomFormation: (name) => {
        const { players, formations } = get();
        if (players.length === 0) return;
        const homePlayerPositions = players
          .filter((p) => p.team === 'home')
          .map((p) => ({ ...p.position }));
        if (homePlayerPositions.length === 0) return;

        const formation: Formation = {
          id: uuidv4(),
          name,
          isCustom: true,
          positions: homePlayerPositions,
        };
        set({ formations: [...formations, formation] });
      },

      // --- Tool ---
      setActiveTool: (tool) => set({ activeTool: tool }),
      setPlayerPlacement: (placement) =>
        set((state) => ({
          playerPlacement: {
            ...state.playerPlacement,
            ...placement,
          },
        })),
      setObjectPlacementType: (type) => set({ objectPlacementType: type }),

      // --- Board ---
      resetBoard: () =>
        set({
          players: [],
          objects: [],
          annotations: [],
          ball: { ...initialBall },
          frames: [],
          currentFrameIndex: 0,
          playbackState: 'stopped',
          playbackProgress: 0,
          selection: { type: null, id: null },
          activeTool: 'select',
          playerPlacement: {
            team: 'home',
            role: 'outfield',
            model: 'male',
          },
          objectPlacementType: 'cone',
        }),

      // --- Helpers ---
      getSelectedPlayer: () => {
        const { selection, players } = get();
        if (selection.type !== 'player' || !selection.id) return undefined;
        return players.find((p) => p.id === selection.id);
      },

      getSelectedObject: () => {
        const { selection, objects } = get();
        if (selection.type !== 'object' || !selection.id) return undefined;
        return objects.find((o) => o.id === selection.id);
      },

      getCurrentFrameStates: () => {
        const { frames, currentFrameIndex } = get();
        return frames[currentFrameIndex]?.playerStates ?? [];
      },
    }),
    {
      limit: 50,
      equality: (pastState, currentState) =>
        pastState.players === currentState.players &&
        pastState.objects === currentState.objects &&
        pastState.annotations === currentState.annotations &&
        pastState.ball === currentState.ball &&
        pastState.frames === currentState.frames,
    }
  )
);

// --- Helpers ---

function clampPosition(pos: Position2D): Position2D {
  return clampPositionWithPadding(pos, 0, 0);
}

function clampPositionWithPadding(
  pos: Position2D,
  halfLengthPadding: number,
  halfWidthPadding: number
): Position2D {
  return {
    x: Math.max(
      -(PITCH.HALF_LENGTH + halfLengthPadding),
      Math.min(PITCH.HALF_LENGTH + halfLengthPadding, pos.x)
    ),
    z: Math.max(
      -(PITCH.HALF_WIDTH + halfWidthPadding),
      Math.min(PITCH.HALF_WIDTH + halfWidthPadding, pos.z)
    ),
  };
}

function resolvePositionForMode(mode: '2D' | '3D', pos: Position2D): Position2D {
  return clampPosition(pos);
}

function resolvePlayerPositionForMode(mode: '2D' | '3D', pos: Position2D): Position2D {
  return clampPosition(resolvePositionForMode(mode, pos));
}

function createPlayerFrameState(player: Player): PlayerFrameState {
  return {
    playerId: player.id,
    position: { ...player.position },
    action: 'idle',
    movementType: 'run',
  };
}
