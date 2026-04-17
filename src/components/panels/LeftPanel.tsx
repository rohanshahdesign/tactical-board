import React from 'react';
import { useTacticalStore } from '../../store/tacticalStore';
import { ActiveTool, PitchObjectType, Team } from '../../types';
import './LeftPanel.css';

export const LeftPanel: React.FC = () => {
  const mode = useTacticalStore((s) => s.mode);
  const activeTool = useTacticalStore((s) => s.activeTool);
  const setActiveTool = useTacticalStore((s) => s.setActiveTool);
  const setPlayerPlacement = useTacticalStore((s) => s.setPlayerPlacement);
  const setObjectPlacementType = useTacticalStore((s) => s.setObjectPlacementType);

  const armPlayerTool = (team: Team, role: 'outfield' | 'goalkeeper' = 'outfield') => {
    setPlayerPlacement({ team, role, model: 'male' });
    setActiveTool('place-player');
  };

  const armObjectTool = (type: PitchObjectType) => {
    setObjectPlacementType(type);
    setActiveTool('place-object');
  };

  return (
    <div className={`left-panel mode-${mode.toLowerCase()}`}>
      <div className="lp-toolbar" aria-label="Board tools">
        <ToolbarButton
          label="Select"
          title="Select and move"
          active={activeTool === 'select'}
          onClick={() => setActiveTool('select')}
          icon={<SelectIcon />}
        />
        <ToolbarButton
          label={mode === '2D' ? 'Players' : 'Home player'}
          title={mode === '2D' ? 'Place players' : 'Place home players'}
          active={activeTool === 'place-player'}
          onClick={() => armPlayerTool('home')}
          icon={<PlayerIcon />}
        />
        <ToolbarButton
          label="Objects"
          title="Place objects"
          active={activeTool === 'place-object'}
          onClick={() => armObjectTool('cone')}
          icon={<ObjectIcon />}
        />
        <ToolbarButton
          label="Arrow"
          title="Drawing tools are not active yet"
          active={false}
          onClick={() => undefined}
          icon={<ArrowIcon />}
          disabled
        />
        <ToolbarButton
          label="Curve"
          title="Drawing tools are not active yet"
          active={false}
          onClick={() => undefined}
          icon={<CurveIcon />}
          disabled
        />
        <ToolbarButton
          label="Shape"
          title="Drawing tools are not active yet"
          active={false}
          onClick={() => undefined}
          icon={<ShapeIcon />}
          disabled
        />
        <ToolbarButton
          label="Text"
          title="Place text annotation"
          active={activeTool === 'place-annotation'}
          onClick={() => setActiveTool('place-annotation')}
          icon={<TextIcon />}
        />
      </div>
    </div>
  );
};

const ToolbarButton: React.FC<{
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}> = ({ label, title, active, onClick, icon, disabled = false }) => (
  <button
    className={`lp-toolbar-btn ${active ? 'active' : ''}`}
    onClick={onClick}
    title={title}
    aria-label={label}
    disabled={disabled}
  >
    {icon}
  </button>
);

function toolLabel(tool: ActiveTool): string {
  switch (tool) {
    case 'place-player':
      return 'Player tool';
    case 'place-object':
      return 'Object tool';
    case 'place-ball':
      return 'Ball tool';
    case 'place-annotation':
      return 'Text tool';
    case 'draw':
      return 'Draw tool';
    default:
      return 'Select tool';
  }
}

const SelectIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 3l7.5 17 1.9-6.1L20 12 4 3z"/></svg>
);

const PlayerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.2"/><path d="M6.5 20a5.5 5.5 0 0 1 11 0"/></svg>
);

const ObjectIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12,3 20,8 20,16 12,21 4,16 4,8"/></svg>
);

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 18c6-10 10-10 16-10"/><path d="M14 4h6v6"/></svg>
);

const CurveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 18c3 0 4-8 8-8s5 8 8 8"/></svg>
);

const ShapeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
);

const TextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16"/><path d="M12 6v12"/><path d="M8 18h8"/></svg>
);
