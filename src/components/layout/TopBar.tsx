import React, { useEffect, useState } from 'react';
import { useTacticalStore } from '../../store/tacticalStore';
import './TopBar.css';

type VisualToggleId = 'goalposts' | 'fieldStripes' | 'fieldLines' | 'playerBodies';

const INITIAL_VISUAL_TOGGLES: Record<VisualToggleId, boolean> = {
  goalposts: false,
  fieldStripes: true,
  fieldLines: true,
  playerBodies: false,
};

const SHORTCUT_SECTIONS = [
  {
    title: 'Camera',
    items: [
      {
        label: 'Move free camera',
        description: 'Pan the free camera across the pitch.',
        keys: ['W', 'A', 'S', 'D'],
      },
      {
        label: 'Arrow key movement',
        description: 'Alternative camera movement controls.',
        keys: ['↑', '←', '↓', '→'],
      },
      {
        label: 'Faster movement',
        description: 'Hold while moving the free camera.',
        keys: ['Shift'],
      },
      {
        label: 'Drag to orbit and pan',
        description: 'Hold to enable orbit controls in free camera mode.',
        keys: ['Alt'],
      },
    ],
  },
  {
    title: 'Board actions',
    items: [
      {
        label: 'Switch modes',
        description: 'Jump between 3D and 2D views from the top bar.',
        keys: ['3D', '2D'],
      },
      {
        label: 'Animation controls',
        description: 'Use the animate toggle and playback tools in the header and timeline.',
        keys: ['Toolbar'],
      },
      {
        label: 'Undo and redo',
        description: 'Available from the action buttons on the right side of the top bar.',
        keys: ['Toolbar'],
      },
    ],
  },
];

export const TopBar: React.FC = () => {
  const mode = useTacticalStore((s) => s.mode);
  const setMode = useTacticalStore((s) => s.setMode);
  const theme = useTacticalStore((s) => s.theme);
  const toggleTheme = useTacticalStore((s) => s.toggleTheme);
  const animationEnabled = useTacticalStore((s) => s.animationEnabled);
  const toggleAnimation = useTacticalStore((s) => s.toggleAnimation);
  const resetBoard = useTacticalStore((s) => s.resetBoard);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [visualToggles, setVisualToggles] = useState(INITIAL_VISUAL_TOGGLES);

  useEffect(() => {
    if (!shortcutsOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcutsOpen]);

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

  const toggleVisual = (toggleId: VisualToggleId) => {
    setVisualToggles((current) => ({
      ...current,
      [toggleId]: !current[toggleId],
    }));
  };

  return (
    <>
      <div className="topbar-shell">
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
        </div>

        <div className="topbar-right">
          <div className="topbar-display-tools" role="toolbar" aria-label="Display toggles">
            <button
              className={`topbar-help-btn ${shortcutsOpen ? 'active' : ''}`}
              onClick={() => setShortcutsOpen((open) => !open)}
              title="Show shortcuts"
              aria-haspopup="dialog"
              aria-expanded={shortcutsOpen}
            >
              <HelpIcon />
              <span>Help</span>
            </button>

            <div className="topbar-visual-toggle-group">
              <button
                className={`topbar-visual-btn ${visualToggles.goalposts ? 'active' : ''}`}
                onClick={() => toggleVisual('goalposts')}
                title="Toggle goalposts"
                aria-label="Toggle goalposts"
                aria-pressed={visualToggles.goalposts}
              >
                <GoalpostIcon />
              </button>
              <button
                className={`topbar-visual-btn ${visualToggles.fieldStripes ? 'active' : ''}`}
                onClick={() => toggleVisual('fieldStripes')}
                title="Toggle dark pitch stripes"
                aria-label="Toggle dark pitch stripes"
                aria-pressed={visualToggles.fieldStripes}
              >
                <FieldStripesIcon />
              </button>
              <button
                className={`topbar-visual-btn ${visualToggles.fieldLines ? 'active' : ''}`}
                onClick={() => toggleVisual('fieldLines')}
                title="Toggle pitch lines"
                aria-label="Toggle pitch lines"
                aria-pressed={visualToggles.fieldLines}
              >
                <FieldLinesIcon />
              </button>
              <button
                className={`topbar-visual-btn ${visualToggles.playerBodies ? 'active' : ''}`}
                onClick={() => toggleVisual('playerBodies')}
                title="Toggle player body style"
                aria-label="Toggle player body style"
                aria-pressed={visualToggles.playerBodies}
              >
                <PlayersIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {shortcutsOpen ? (
        <div className="topbar-shortcuts-backdrop" onClick={() => setShortcutsOpen(false)}>
          <div
            className="topbar-shortcuts-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="topbar-shortcuts-header">
              <div>
                <p className="topbar-shortcuts-eyebrow">Command guide</p>
                <h2>Shortcuts</h2>
              </div>
              <button
                className="topbar-icon-btn topbar-shortcuts-close"
                onClick={() => setShortcutsOpen(false)}
                title="Close shortcuts"
                aria-label="Close shortcuts"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <p className="topbar-shortcuts-intro">
              Free-camera movement is keyboard driven today. The display toggles in the header are visual placeholders for future wiring.
            </p>

            <div className="topbar-shortcuts-grid">
              {SHORTCUT_SECTIONS.map((section) => (
                <section key={section.title} className="topbar-shortcuts-section">
                  <h3>{section.title}</h3>
                  <div className="topbar-shortcut-list">
                    {section.items.map((item) => (
                      <div key={`${section.title}-${item.label}`} className="topbar-shortcut-row">
                        <div className="topbar-shortcut-copy">
                          <span className="topbar-shortcut-label">{item.label}</span>
                          <span className="topbar-shortcut-description">{item.description}</span>
                        </div>
                        <div className="topbar-shortcut-keys" aria-label={`${item.label} keys`}>
                          {item.keys.map((key) => (
                            <kbd key={`${item.label}-${key}`}>{key}</kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

const HelpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.2a2.6 2.6 0 0 1 4.8 1.2c0 1.8-2.4 2.2-2.4 4" />
    <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

const GoalpostIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 18V7h14v11" />
    <path d="M5 18h14" />
    <path d="M8 18V10" />
    <path d="M12 18V10" />
    <path d="M16 18V10" />
    <path d="M5 11h14" />
    <path d="M7.5 7l-2.5 3" />
    <path d="M16.5 7l2.5 3" />
  </svg>
);

const FieldStripesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="5" width="16" height="14" rx="2.5" />
    <path d="M8 6v12" />
    <path d="M12 6v12" />
    <path d="M16 6v12" />
  </svg>
);

const FieldLinesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="5" width="16" height="14" rx="2.5" />
    <path d="M12 5v14" />
    <circle cx="12" cy="12" r="2.8" />
    <path d="M4 12h4" />
    <path d="M16 12h4" />
  </svg>
);

const PlayersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="9" r="2.5" />
    <circle cx="16.5" cy="10" r="2.5" />
    <path d="M4.5 18a4.5 4.5 0 0 1 9 0" />
    <path d="M12.5 18a4 4 0 0 1 8 0" />
  </svg>
);
