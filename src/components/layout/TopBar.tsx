import React from 'react';
import { useTacticalStore } from '../../store/tacticalStore';
import './TopBar.css';

export const TopBar: React.FC = () => {
  const mode = useTacticalStore((s) => s.mode);
  const setMode = useTacticalStore((s) => s.setMode);
  const theme = useTacticalStore((s) => s.theme);
  const toggleTheme = useTacticalStore((s) => s.toggleTheme);
  const animationEnabled = useTacticalStore((s) => s.animationEnabled);
  const toggleAnimation = useTacticalStore((s) => s.toggleAnimation);
  const resetBoard = useTacticalStore((s) => s.resetBoard);

  const handleUndo = () => {
    useTacticalStore.temporal.getState().undo();
  };

  const handleRedo = () => {
    useTacticalStore.temporal.getState().redo();
  };

  const handleSnapshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tactical-board-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <>
      {/* Left: Undo/Redo/Reset */}
      <div className="topbar-left">
        <button className="topbar-icon-btn" onClick={handleUndo} title="Undo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a5 5 0 0 1 0 10H9"/><path d="M3 10l4-4"/><path d="M3 10l4 4"/></svg>
        </button>
        <button className="topbar-icon-btn" onClick={handleRedo} title="Redo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H11a5 5 0 0 0 0 10h4"/><path d="M21 10l-4-4"/><path d="M21 10l-4 4"/></svg>
        </button>
        <button className="topbar-icon-btn" onClick={resetBoard} title="Reset">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
      </div>

      {/* Center: Mode + Animate */}
      <div className="topbar-center">
        <div className="mode-pill">
          <button
            className={`pill-btn ${mode === '3D' ? 'active' : ''}`}
            onClick={() => setMode('3D')}
          >
            3D
          </button>
          <button
            className={`pill-btn ${mode === '2D' ? 'active' : ''}`}
            onClick={() => setMode('2D')}
          >
            2D
          </button>
        </div>

        <div className="topbar-divider" />

        <button
          className={`animate-toggle ${animationEnabled ? 'active' : ''}`}
          onClick={toggleAnimation}
        >
          <span className="animate-label">ANIMATE</span>
          <span className={`animate-dot ${animationEnabled ? 'on' : ''}`} />
        </button>

        <div className="topbar-divider" />

        <button
          className={`topbar-text-btn ${theme === 'light' ? 'active' : ''}`}
          onClick={toggleTheme}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>

        <div className="topbar-divider" />

        <button className="topbar-text-btn" onClick={handleSnapshot}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="13" r="3"/><path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/></svg>
          Snapshot
        </button>

        <button className="topbar-text-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export
        </button>
      </div>

      {/* Right: Play preview */}
      {/* <div className="topbar-right">
        <button className="topbar-play-btn" title="Preview">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
        </button>
      </div> */}
    </>
  );
};
