import React, { useMemo, useState } from 'react';
import { useTacticalStore } from '../../store/tacticalStore';
import { ACTION_LABELS, ATTACKING_ACTIONS, DEFENSIVE_ACTIONS, GOALKEEPER_ACTIONS, MISC_ACTIONS, MOVEMENT_ACTIONS } from '../../utils/actions';
import { PitchObjectType, Player, PlayerAction, PlayerFrameState, PlayerRole } from '../../types';
import './RightPanel.css';

const HOME_KIT = '#3b82f6';
const AWAY_KIT = '#ef4444';

type ActionOption = {
  action: PlayerAction;
  tone: 'attack' | 'defend' | 'move' | 'support';
};

type RightPanelTab = 'properties' | 'formations' | 'objects';

type PlacementAsset =
  | { kind: 'object'; type: PitchObjectType; label: string; copy: string }
  | { kind: 'ball'; label: string; copy: string };

const OBJECT_LIBRARY: Record<'2D' | '3D', PlacementAsset[]> = {
  '2D': [
    { kind: 'ball', label: 'Soccer Ball', copy: 'Place the live match ball on the pitch' },
    { kind: 'object', type: 'cone', label: '2D Cone', copy: 'Flat training marker' },
    { kind: 'object', type: 'marker', label: '2D Flag', copy: 'Sideline style marker' },
    { kind: 'object', type: 'hurdle', label: '2D Hurdle', copy: 'Agility hurdle asset' },
    { kind: 'object', type: 'blocker', label: '2D Blocker', copy: 'Wall / mannequin' },
    { kind: 'object', type: 'pole', label: '2D Pole', copy: 'Reference pole' },
    { kind: 'object', type: 'training-ladder', label: '2D Ladder', copy: 'Flat ladder guide' },
  ],
  '3D': [
    { kind: 'ball', label: 'Soccer Ball', copy: 'GLB match ball with connected playback support' },
    { kind: 'object', type: 'cone', label: '3D Cone', copy: 'Low-poly cone' },
    { kind: 'object', type: 'marker', label: '3D Flag', copy: 'Raised flag marker' },
    { kind: 'object', type: 'hurdle', label: '3D Hurdle', copy: 'Jump training prop' },
    { kind: 'object', type: 'blocker', label: '3D Blocker', copy: 'Wall / mannequin' },
    { kind: 'object', type: 'pole', label: '3D Pole', copy: 'Height reference prop' },
    { kind: 'object', type: 'training-ladder', label: '3D Ladder', copy: 'Ground agility ladder' },
  ],
};

const OUTFIELD_WITH_BALL: ActionOption[] = [
  { action: 'pass-inside', tone: 'attack' },
  { action: 'pass-outside', tone: 'attack' },
  { action: 'shoot', tone: 'attack' },
  { action: 'volley', tone: 'attack' },
  { action: 'sprint', tone: 'move' },
  { action: 'change-direction', tone: 'move' },
];

const OUTFIELD_OFF_BALL: ActionOption[] = [
  { action: 'press', tone: 'defend' },
  { action: 'intercept', tone: 'defend' },
  { action: 'tackle-standing', tone: 'defend' },
  { action: 'slide-tackle', tone: 'defend' },
  { action: 'call-for-pass', tone: 'support' },
  { action: 'sprint', tone: 'move' },
];

const GOALKEEPER_WITH_BALL: ActionOption[] = [
  { action: 'gk-collect', tone: 'support' },
  { action: 'gk-pass', tone: 'attack' },
  { action: 'gk-kick', tone: 'attack' },
  { action: 'gk-volley-kick', tone: 'attack' },
  { action: 'gk-idle', tone: 'move' },
  { action: 'none', tone: 'support' },
];

const GOALKEEPER_OFF_BALL: ActionOption[] = [
  { action: 'gk-idle', tone: 'move' },
  { action: 'gk-dive-left', tone: 'defend' },
  { action: 'gk-dive-right', tone: 'defend' },
  { action: 'gk-jump-parry', tone: 'defend' },
  { action: 'block-shot', tone: 'defend' },
  { action: 'call-for-pass', tone: 'support' },
];

function getAvailableActions(role: PlayerRole, hasBall: boolean): ActionOption[] {
  if (role === 'goalkeeper') {
    return hasBall ? GOALKEEPER_WITH_BALL : GOALKEEPER_OFF_BALL;
  }

  return hasBall ? OUTFIELD_WITH_BALL : OUTFIELD_OFF_BALL;
}

function getDefaultAction(role: PlayerRole, hasBall: boolean): PlayerAction {
  return getAvailableActions(role, hasBall)[0]?.action ?? 'none';
}

export const RightPanel: React.FC = () => {
  const mode = useTacticalStore((s) => s.mode);
  const toggleRightPanel = useTacticalStore((s) => s.toggleRightPanel);

  return mode === '2D'
    ? <TwoDInspector onCollapse={toggleRightPanel} />
    : <ThreeDInspector onCollapse={toggleRightPanel} />;
};

const TwoDInspector: React.FC<{ onCollapse: () => void }> = ({ onCollapse }) => {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('properties');
  const selection = useTacticalStore((s) => s.selection);
  const players = useTacticalStore((s) => s.players);
  const objects = useTacticalStore((s) => s.objects);

  const selectedPlayer = selection.type === 'player'
    ? players.find((player) => player.id === selection.id)
    : undefined;
  const selectedObject = selection.type === 'object'
    ? objects.find((object) => object.id === selection.id)
    : undefined;

  return (
    <div className="right-panel mode-2d">
      <PanelTabs activeTab={activeTab} setActiveTab={setActiveTab} onCollapse={onCollapse} />

      {activeTab === 'formations' ? (
        <FormationsPanel />
      ) : activeTab === 'objects' ? (
        <ObjectsPanel mode="2D" />
      ) : selectedPlayer ? (
        <PlayerPropertiesPanel player={selectedPlayer} detailed />
      ) : selectedObject ? (
        <ObjectInspectorPanel />
      ) : (
        <EmptyPanel
          title="2D properties"
          copy="Select a player or object on the board to inspect it. Use the left tool rail for placement and switch to Formations for team setups."
        />
      )}
    </div>
  );
};

const ThreeDInspector: React.FC<{ onCollapse: () => void }> = ({ onCollapse }) => {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('properties');
  const selection = useTacticalStore((s) => s.selection);
  const players = useTacticalStore((s) => s.players);
  const objects = useTacticalStore((s) => s.objects);

  const selectedPlayer = selection.type === 'player'
    ? players.find((player) => player.id === selection.id)
    : undefined;
  const selectedObject = selection.type === 'object'
    ? objects.find((object) => object.id === selection.id)
    : undefined;

  return (
    <div className="right-panel mode-3d">
      <PanelTabs activeTab={activeTab} setActiveTab={setActiveTab} onCollapse={onCollapse} />

      {activeTab === 'formations' ? (
        <FormationsPanel />
      ) : activeTab === 'objects' ? (
        <ObjectsPanel mode="3D" />
      ) : (
        <>
          {selectedPlayer ? (
            <PlayerPropertiesPanel player={selectedPlayer} detailed={false} />
          ) : selectedObject ? (
            <ObjectInspectorPanel />
          ) : (
            <EmptyPanel
              title="Nothing selected"
              copy="Use the left tool rail to place players or drag an object from the Objects tab onto the pitch."
            />
          )}
        </>
      )}
    </div>
  );
};

const PlayerPropertiesPanel: React.FC<{ player: Player; detailed: boolean }> = ({
  player,
  detailed,
}) => {
  const updatePlayer = useTacticalStore((s) => s.updatePlayer);
  const removePlayer = useTacticalStore((s) => s.removePlayer);
  const attachBall = useTacticalStore((s) => s.attachBall);
  const detachBall = useTacticalStore((s) => s.detachBall);
  const ball = useTacticalStore((s) => s.ball);
  const players = useTacticalStore((s) => s.players);
  const animationEnabled = useTacticalStore((s) => s.animationEnabled);
  const currentFrameIndex = useTacticalStore((s) => s.currentFrameIndex);
  const frames = useTacticalStore((s) => s.frames);
  const updatePlayerFrameState = useTacticalStore((s) => s.updatePlayerFrameState);

  const currentFrame = frames[currentFrameIndex];
  const frameState = currentFrame?.playerStates.find((ps) => ps.playerId === player.id);
  const playerHasBall = ball.ownerId === player.id;
  const currentOwner = ball.ownerId
    ? players.find((candidate) => candidate.id === ball.ownerId)
    : undefined;
  const availableActions = getAvailableActions(player.role, playerHasBall);
  const currentAction =
    frameState && availableActions.some(({ action }) => action === frameState.action)
      ? frameState.action
      : getDefaultAction(player.role, playerHasBall);

  const handleConnectBall = () => {
    attachBall(player.id);
    if (animationEnabled && frameState) {
      const nextAvailableActions = getAvailableActions(player.role, true);
      const nextAction = getDefaultAction(player.role, true);
      if (!nextAvailableActions.some(({ action }) => action === frameState.action)) {
        updatePlayerFrameState(currentFrameIndex, player.id, { action: nextAction });
      }
    }
  };

  const handleReleaseBall = () => {
    detachBall();
    if (animationEnabled && frameState) {
      updatePlayerFrameState(currentFrameIndex, player.id, {
        action: getDefaultAction(player.role, false),
      });
    }
  };

  return (
    <>
      <div className="rp-player-card prominent">
        <div className="rp-jersey" style={{ background: player.kitColor }}>
          {player.jerseyNumber}
        </div>
        <div className="rp-player-info">
          <input
            className="rp-player-name-input"
            value={player.name}
            onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
          />
          <span className="rp-player-role">
            {player.role === 'goalkeeper' ? 'GOALKEEPER' : 'OUTFIELD'}
          </span>
        </div>
      </div>

      <div className="rp-field-group">
        <span className="rp-section-label">TEAM</span>
        <div className="rp-pill-toggle fill">
          <button
            className={`rp-pill ${player.team === 'home' ? 'active' : ''}`}
            onClick={() => updatePlayer(player.id, { team: 'home', kitColor: HOME_KIT })}
          >
            Home
          </button>
          <button
            className={`rp-pill ${player.team === 'away' ? 'active' : ''}`}
            onClick={() => updatePlayer(player.id, { team: 'away', kitColor: AWAY_KIT })}
          >
            Away
          </button>
        </div>
      </div>

      {detailed && (
        <div className="rp-field-group">
          <span className="rp-section-label">ROLE</span>
          <div className="rp-pill-toggle fill">
            <button
              className={`rp-pill ${player.role === 'outfield' ? 'active' : ''}`}
              onClick={() => updatePlayer(player.id, { role: 'outfield' })}
            >
              Player
            </button>
            <button
              className={`rp-pill ${player.role === 'goalkeeper' ? 'active' : ''}`}
              onClick={() => updatePlayer(player.id, { role: 'goalkeeper' })}
            >
              Goalkeeper
            </button>
          </div>
        </div>
      )}

      <div className="rp-grid-two">
        <div className="rp-field stack">
          <span className="rp-label">Jersey #</span>
          <input
            className="rp-number-input wide"
            type="number"
            min={1}
            max={99}
            value={player.jerseyNumber}
            onChange={(e) =>
              updatePlayer(player.id, { jerseyNumber: parseInt(e.target.value, 10) || 1 })
            }
          />
        </div>
        <div className="rp-field stack">
          <span className="rp-label">Model</span>
          <select
            className="rp-select full"
            value={player.model}
            onChange={(e) =>
              updatePlayer(player.id, { model: e.target.value as 'male' | 'female' | 'kid' })
            }
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="kid">Kid</option>
          </select>
        </div>
      </div>

      {detailed && (
        <div className="rp-grid-two">
          <div className="rp-field stack">
            <span className="rp-label">Kit color</span>
            <input
              className="rp-color-input large"
              type="color"
              value={player.kitColor}
              onChange={(e) => updatePlayer(player.id, { kitColor: e.target.value })}
            />
          </div>
          <div className="rp-field stack">
            <span className="rp-label">Label</span>
            <label className="rp-switch">
              <input
                type="checkbox"
                checked={player.showName}
                onChange={(e) => updatePlayer(player.id, { showName: e.target.checked })}
              />
              <span className="rp-switch-slider" />
            </label>
          </div>
        </div>
      )}

      {detailed && (
        <div className="rp-field stack">
          <span className="rp-label">Height</span>
          <div className="rp-height-control full-width">
            <input
              className="rp-slider wide"
              type="range"
              min={0.7}
              max={1.3}
              step={0.05}
              value={player.height}
              onChange={(e) => updatePlayer(player.id, { height: parseFloat(e.target.value) })}
            />
            <span className="rp-height-value">
              {Math.round(player.height * 178)} <span className="rp-unit">cm</span>
            </span>
          </div>
        </div>
      )}

      <div className="rp-ball-card">
        <div>
          <span className="rp-ball-status-label">
            {playerHasBall
              ? 'Connected to this player'
              : currentOwner
                ? `Connected to ${currentOwner.name}`
                : 'Ball is free on the pitch'}
          </span>
          <p className="rp-ball-status-copy">
            Possession changes the action set available in animation mode.
          </p>
        </div>
        <div className="rp-ball-actions">
          {playerHasBall ? (
            <button className="rp-action-btn active" onClick={handleReleaseBall}>
              Release Ball
            </button>
          ) : (
            <button className="rp-action-btn" onClick={handleConnectBall}>
              {currentOwner ? 'Take Ball' : 'Connect Ball'}
            </button>
          )}
        </div>
      </div>

      {animationEnabled && frameState && (
        <AnimationSection
          frameState={frameState}
          currentAction={currentAction}
          availableActions={availableActions}
          role={player.role}
          playerHasBall={playerHasBall}
          onSelectAction={(action) => updatePlayerFrameState(currentFrameIndex, player.id, { action })}
          onMovementChange={(movementType) => updatePlayerFrameState(currentFrameIndex, player.id, { movementType })}
        />
      )}

      {animationEnabled && !frameState && (
        <div className="rp-info-card">
          Add a frame in the timeline to assign actions and possession for this player.
        </div>
      )}

      <button className="rp-delete-btn" onClick={() => removePlayer(player.id)}>
        Delete Player
      </button>
    </>
  );
};

const AnimationSection: React.FC<{
  frameState: PlayerFrameState;
  currentAction: PlayerAction;
  availableActions: ActionOption[];
  role: PlayerRole;
  playerHasBall: boolean;
  onSelectAction: (action: PlayerAction) => void;
  onMovementChange: (movementType: 'walk' | 'jog' | 'run') => void;
}> = ({
  frameState,
  currentAction,
  availableActions,
  role,
  playerHasBall,
  onSelectAction,
  onMovementChange,
}) => {
  const groupedActions = useMemo(() => getActionGroups(availableActions, role, playerHasBall), [availableActions, role, playerHasBall]);

  return (
    <>
      <div className="rp-section-divider" />
      <div className="rp-section-header-row">
        <span className="rp-section-label">AVAILABLE ACTIONS</span>
        <span className={`rp-possession-badge ${playerHasBall ? 'owned' : 'free'}`}>
          {playerHasBall ? 'WITH BALL' : 'OFF BALL'}
        </span>
      </div>
      <p className="rp-helper-copy">
        {playerHasBall
          ? 'Passing and shooting are unlocked while the ball is linked to this player.'
          : 'Off-ball actions focus on pressing, receiving, and defensive recovery.'}
      </p>
      <ActionPicker groups={groupedActions} currentAction={currentAction} onSelect={onSelectAction} />

      <div className="rp-section-divider" />
      <span className="rp-section-label">MOVEMENT TYPE</span>
      <select
        className="rp-select full"
        value={frameState.movementType}
        onChange={(e) => onMovementChange(e.target.value as 'walk' | 'jog' | 'run')}
      >
        <option value="walk">Walking</option>
        <option value="jog">Jogging</option>
        <option value="run">Running</option>
      </select>
    </>
  );
};

const FormationsPanel: React.FC = () => {
  const formations = useTacticalStore((s) => s.formations);
  const loadFormation = useTacticalStore((s) => s.loadFormation);
  const flipFormation = useTacticalStore((s) => s.flipFormation);
  const saveCustomFormation = useTacticalStore((s) => s.saveCustomFormation);
  const [team, setTeam] = useState<'home' | 'away'>('home');

  return (
    <>
      <div className="rp-info-card emphasis">
        <span className="rp-section-label">FORMATION ENGINE</span>
        <p className="rp-helper-copy">
          Load any saved shape for the selected team, flip orientation, or save the current home setup as a custom formation.
        </p>
        <div className="rp-pill-toggle fill">
          <button
            className={`rp-pill ${team === 'home' ? 'active' : ''}`}
            onClick={() => setTeam('home')}
          >
            Home
          </button>
          <button
            className={`rp-pill ${team === 'away' ? 'active' : ''}`}
            onClick={() => setTeam('away')}
          >
            Away
          </button>
        </div>
      </div>

      <div className="rp-list-card">
        <span className="rp-section-label">AVAILABLE FORMATIONS</span>
        <div className="rp-list">
          {formations.map((formation) => (
            <button
              key={formation.id}
              className="rp-list-item"
              onClick={() => loadFormation(formation.id, team)}
            >
              <span>{formation.name}{formation.isCustom ? ' (custom)' : ''}</span>
              <span>{team.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rp-inline-actions">
        <button className="rp-action-btn" onClick={flipFormation}>
          Flip Formation
        </button>
        <button
          className="rp-action-btn"
          onClick={() => {
            const name = prompt('Formation name:');
            if (name) {
              saveCustomFormation(name);
            }
          }}
        >
          Save Custom
        </button>
      </div>
    </>
  );
};

const ObjectsPanel: React.FC<{ mode: '2D' | '3D' }> = ({ mode }) => {
  const setActiveTool = useTacticalStore((s) => s.setActiveTool);
  const setObjectPlacementType = useTacticalStore((s) => s.setObjectPlacementType);
  const objectAssets = OBJECT_LIBRARY[mode];

  return (
    <>
      <div className="rp-info-card emphasis">
        <span className="rp-section-label">{mode} OBJECT ASSETS</span>
        <p className="rp-helper-copy">
          Drag an object card onto the board to place it, or click one to arm the object tool.
        </p>
      </div>
      <div className="rp-object-grid-panel">
        {objectAssets.map((asset) => (
          <button
            key={`${mode}-${asset.kind === 'ball' ? 'ball' : asset.type}`}
            className="rp-object-asset-card"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(
                'application/x-tactical-object',
                JSON.stringify(
                  asset.kind === 'ball'
                    ? { kind: 'ball', mode }
                    : { kind: 'object', type: asset.type, mode }
                )
              );
              event.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => {
              if (asset.kind === 'ball') {
                setActiveTool('place-ball');
                return;
              }

              setObjectPlacementType(asset.type);
              setActiveTool('place-object');
            }}
          >
            <span className="rp-placement-title">{asset.label}</span>
            <span className="rp-placement-copy">{asset.copy}</span>
          </button>
        ))}
      </div>
    </>
  );
};

const ObjectInspectorPanel: React.FC = () => {
  const selection = useTacticalStore((s) => s.selection);
  const objects = useTacticalStore((s) => s.objects);
  const removeObject = useTacticalStore((s) => s.removeObject);
  const object = selection.type === 'object'
    ? objects.find((item) => item.id === selection.id)
    : undefined;

  if (!object) {
    return (
      <EmptyPanel
        title="No object selected"
        copy="Select an object on the board to inspect or remove it."
      />
    );
  }

  return (
    <>
      <div className="rp-info-card">
        <span className="rp-section-label">OBJECT</span>
        <div className="rp-field">
          <span className="rp-label">Type</span>
          <span className="rp-value">{object.type}</span>
        </div>
        <div className="rp-field">
          <span className="rp-label">Rotation</span>
          <span className="rp-value">{object.rotation.toFixed(1)} rad</span>
        </div>
      </div>
      <button className="rp-delete-btn" onClick={() => removeObject(object.id)}>
        Delete Object
      </button>
    </>
  );
};

const EmptyPanel: React.FC<{ title: string; copy: string }> = ({ title, copy }) => (
  <div className="right-panel empty">
    <div className="rp-header stack">
      <span className="rp-title">{title}</span>
    </div>
    <div className="rp-empty-state">
      <span className="rp-empty-text">{copy}</span>
    </div>
  </div>
);

interface ActionPickerProps {
  groups: Array<{ title: string; tone: ActionOption['tone']; actions: ActionOption[] }>;
  currentAction: PlayerAction;
  onSelect: (action: PlayerAction) => void;
}

const ActionPicker: React.FC<ActionPickerProps> = ({ groups, currentAction, onSelect }) => {
  return (
    <div className="rp-action-groups">
      {groups.map((group) => (
        <div key={group.title} className="rp-action-group">
          <span className="rp-section-label">{group.title}</span>
          <div className="rp-action-pills">
            {group.actions.map(({ action, tone }) => (
              <button
                key={action}
                className={`rp-action-pill tone-${tone} ${currentAction === action ? 'active' : ''}`}
                onClick={() => onSelect(action)}
              >
                {ACTION_LABELS[action]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const PanelTabs: React.FC<{
  activeTab: RightPanelTab;
  setActiveTab: (tab: RightPanelTab) => void;
  onCollapse: () => void;
}> = ({ activeTab, setActiveTab, onCollapse }) => (
  <div className="rp-tab-row">
    <button
      type="button"
      className="rp-collapse-btn"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onCollapse();
      }}
      aria-label="Collapse right panel"
      title="Collapse right panel"
    >
      ›
    </button>
    <div className="rp-tabbar-scroll">
      <div className="rp-tabbar">
        <button className={`rp-tab ${activeTab === 'properties' ? 'active' : ''}`} onClick={() => setActiveTab('properties')}>
          Properties
        </button>
        <button className={`rp-tab ${activeTab === 'formations' ? 'active' : ''}`} onClick={() => setActiveTab('formations')}>
          Formations
        </button>
        <button className={`rp-tab ${activeTab === 'objects' ? 'active' : ''}`} onClick={() => setActiveTab('objects')}>
          Objects
        </button>
      </div>
    </div>
  </div>
);

function getActionGroups(
  availableActions: ActionOption[],
  role: PlayerRole,
  playerHasBall: boolean
): Array<{ title: string; tone: ActionOption['tone']; actions: ActionOption[] }> {
  const makeGroup = (
    title: string,
    tone: ActionOption['tone'],
    actions: ActionOption[]
  ) => ({ title, tone, actions });
  const filterGroup = (source: PlayerAction[]) => availableActions.filter(({ action }) => source.includes(action));

  if (role === 'goalkeeper') {
    const groups = [
      makeGroup(
        playerHasBall ? 'Attacking' : 'Defending',
        playerHasBall ? 'attack' : 'defend',
        playerHasBall ? filterGroup(['gk-pass', 'gk-kick', 'gk-volley-kick']) : filterGroup(['gk-dive-left', 'gk-dive-right', 'gk-jump-parry', 'block-shot'])
      ),
      makeGroup('Goalkeeper', 'support', filterGroup(GOALKEEPER_ACTIONS)),
    ];

    return groups.filter((group) => group.actions.length > 0);
  }

  if (playerHasBall) {
    return [
      makeGroup('Attacking', 'attack', filterGroup(ATTACKING_ACTIONS)),
      makeGroup('Defending', 'defend', filterGroup(DEFENSIVE_ACTIONS)),
      makeGroup('Movement', 'move', filterGroup(MOVEMENT_ACTIONS)),
    ].filter((group) => group.actions.length > 0);
  }

  return [
    makeGroup('Defending', 'defend', filterGroup(DEFENSIVE_ACTIONS)),
    makeGroup('Movement', 'move', filterGroup(MOVEMENT_ACTIONS)),
    makeGroup('Support', 'support', filterGroup(MISC_ACTIONS)),
  ].filter((group) => group.actions.length > 0);
}
