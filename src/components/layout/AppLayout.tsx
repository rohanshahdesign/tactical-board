import React from 'react';
import './AppLayout.css';

interface AppLayoutProps {
  topBar: React.ReactNode;
  leftPanel: React.ReactNode;
  leftPanelCollapsed: boolean;
  onToggleLeftPanel: () => void;
  viewport: React.ReactNode;
  rightPanel: React.ReactNode;
  rightPanelCollapsed: boolean;
  onToggleRightPanel: () => void;
  bottomPanel: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  topBar,
  leftPanel,
  leftPanelCollapsed,
  onToggleLeftPanel,
  viewport,
  rightPanel,
  rightPanelCollapsed,
  onToggleRightPanel,
  bottomPanel,
}) => {
  return (
    <div className="app-layout">
      <header className="app-topbar">{topBar}</header>
      <div className="app-main">
        <aside className={`app-left-panel ${leftPanelCollapsed ? 'collapsed' : ''}`}>
          {leftPanel}
        </aside>
        <main className="app-viewport">{viewport}</main>
        <aside className={`app-right-panel ${rightPanelCollapsed ? 'collapsed' : ''}`}>
          {!rightPanelCollapsed ? (
            rightPanel
          ) : (
            <button
              className="app-panel-toggle right collapsed-toggle"
              onClick={onToggleRightPanel}
              aria-label="Expand right panel"
              title="Expand right panel"
            >
              ‹
            </button>
          )}
        </aside>
      </div>
      <footer className="app-bottom-panel">{bottomPanel}</footer>
    </div>
  );
};
