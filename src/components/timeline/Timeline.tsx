import React from 'react';
import { useTacticalStore } from '../../store/tacticalStore';
import './Timeline.css';

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2];

export const Timeline: React.FC = () => {
  const animationEnabled = useTacticalStore((s) => s.animationEnabled);
  const frames = useTacticalStore((s) => s.frames);
  const currentFrameIndex = useTacticalStore((s) => s.currentFrameIndex);
  const playbackState = useTacticalStore((s) => s.playbackState);
  const playbackSpeed = useTacticalStore((s) => s.playbackSpeed);
  const loop = useTacticalStore((s) => s.loop);

  const addFrame = useTacticalStore((s) => s.addFrame);
  const duplicateFrame = useTacticalStore((s) => s.duplicateFrame);
  const deleteFrame = useTacticalStore((s) => s.deleteFrame);
  const setCurrentFrame = useTacticalStore((s) => s.setCurrentFrame);
  const play = useTacticalStore((s) => s.play);
  const pause = useTacticalStore((s) => s.pause);
  const stop = useTacticalStore((s) => s.stop);
  const setPlaybackSpeed = useTacticalStore((s) => s.setPlaybackSpeed);
  const toggleLoop = useTacticalStore((s) => s.toggleLoop);

  if (!animationEnabled) {
    return (
      <div className="timeline disabled">
        <span className="timeline-hint">Enable animation to use the timeline</span>
      </div>
    );
  }

  return (
    <div className="timeline">
      {/* Playback controls */}
      <div className="timeline-controls">
        {playbackState === 'playing' ? (
          <button className="tl-btn" onClick={pause} title="Pause">
            ⏸
          </button>
        ) : (
          <button className="tl-btn" onClick={play} title="Play" disabled={frames.length < 2}>
            ▶
          </button>
        )}
        <button className="tl-btn" onClick={stop} title="Stop">
          ⏹
        </button>
        <button
          className={`tl-btn ${loop ? 'active' : ''}`}
          onClick={toggleLoop}
          title="Loop"
        >
          🔁
        </button>
      </div>

      {/* Speed */}
      <div className="timeline-speed">
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            className={`speed-btn ${playbackSpeed === s ? 'active' : ''}`}
            onClick={() => setPlaybackSpeed(s)}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Frame bar */}
      <div className="timeline-frames">
        {frames.map((frame, i) => (
          <button
            key={frame.id}
            className={`frame-btn ${i === currentFrameIndex ? 'active' : ''}`}
            onClick={() => setCurrentFrame(i)}
          >
            {i + 1}
          </button>
        ))}
        <button className="frame-btn add" onClick={addFrame} title="Add Frame">
          +
        </button>
      </div>

      {/* Frame actions */}
      <div className="timeline-actions">
        <button
          className="tl-btn small"
          onClick={() => duplicateFrame(currentFrameIndex)}
          disabled={frames.length === 0}
          title="Duplicate Frame"
        >
          ⧉
        </button>
        <button
          className="tl-btn small danger"
          onClick={() => deleteFrame(currentFrameIndex)}
          disabled={frames.length === 0}
          title="Delete Frame"
        >
          ✕
        </button>
      </div>

      {/* Counter */}
      <div className="frame-counter">
        {frames.length > 0
          ? `${currentFrameIndex + 1} / ${frames.length}`
          : '0 / 0'}
      </div>
    </div>
  );
};
