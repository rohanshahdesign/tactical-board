import { useEffect } from 'react';
import { useTacticalStore } from './store/tacticalStore';
import { AppLayout } from './components/layout/AppLayout';
import { TopBar } from './components/layout/TopBar';
import { LeftPanel } from './components/panels/LeftPanel';
import { RightPanel } from './components/panels/RightPanel';
import { Timeline } from './components/timeline/Timeline';
import { ThreeScene } from './components/3d/ThreeScene';
import { SVGPitch } from './components/2d/SVGPitch';
import { usePlayback } from './hooks/usePlayback';

function App() {
  const mode = useTacticalStore((s) => s.mode);
  const theme = useTacticalStore((s) => s.theme);
  const leftPanelCollapsed = useTacticalStore((s) => s.leftPanelCollapsed);
  const rightPanelCollapsed = useTacticalStore((s) => s.rightPanelCollapsed);
  const toggleLeftPanel = useTacticalStore((s) => s.toggleLeftPanel);
  const toggleRightPanel = useTacticalStore((s) => s.toggleRightPanel);
  usePlayback();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <AppLayout
      topBar={<TopBar />}
      leftPanel={<LeftPanel />}
      leftPanelCollapsed={leftPanelCollapsed}
      onToggleLeftPanel={toggleLeftPanel}
      viewport={mode === '3D' ? <ThreeScene /> : <SVGPitch />}
      rightPanel={<RightPanel />}
      rightPanelCollapsed={rightPanelCollapsed}
      onToggleRightPanel={toggleRightPanel}
      bottomPanel={<Timeline />}
    />
  );
}

export default App;
