import { PadGrid } from './PadGrid';
import { KnobBank } from './KnobBank';
import { FaderBank } from './FaderBank';
import { TouchStrips } from './TouchStrips';

const KEYFRAMES = `
@keyframes panelFadeIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export const ControlPanel = () => {
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={styles.overlay}>
        <div style={styles.panel}>
          {/* Header bar */}
          <div style={styles.header}>
            <div style={styles.headerDot} />
            <span style={styles.headerText}>MINILAB 3 CONTROL</span>
            <div style={styles.headerDot} />
          </div>

          {/* Main control area */}
          <div style={styles.mainArea}>
            {/* Left: Pads */}
            <div style={styles.leftSection}>
              <PadGrid />
            </div>

            {/* Center: Strips + Faders */}
            <div style={styles.centerSection}>
              <TouchStrips />
              <FaderBank />
            </div>

            {/* Right: Knobs */}
            <div style={styles.rightSection}>
              <KnobBank />
            </div>
          </div>

          {/* Bottom: Keyboard cue */}
          <div style={styles.footer}>
            <span style={styles.footerText}>
              &#8592;&#8594; OCTAVE  |  ARROWS OCTAVE &plusmn;  |  0 RESET  |  MIDI READY
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    bottom: 140,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 900,
    animation: 'panelFadeIn 0.6s ease-out',
    pointerEvents: 'auto' as const,
  },
  panel: {
    background: 'rgba(5, 5, 20, 0.75)',
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
    border: '1px solid rgba(0, 255, 255, 0.12)',
    borderRadius: 16,
    padding: '10px 16px 12px 16px',
    boxShadow: `
      0 0 40px rgba(0, 255, 255, 0.06),
      0 0 100px rgba(0, 255, 255, 0.03),
      inset 0 1px 0 rgba(0, 255, 255, 0.04)
    `,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  header: {
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    paddingBottom: 6,
    borderBottom: '1px solid rgba(0, 255, 255, 0.06)',
  },
  headerDot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: '#00ffff',
    boxShadow: '0 0 6px #00ffff',
  },
  headerText: {
    fontSize: 9,
    fontFamily: 'system-ui, monospace',
    color: 'rgba(0, 255, 255, 0.4)',
    letterSpacing: 4,
    fontWeight: 600,
  },
  mainArea: {
    display: 'flex',
    gap: 20,
    alignItems: 'flex-start' as const,
    justifyContent: 'center' as const,
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  centerSection: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-end' as const,
  },
  rightSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  footer: {
    display: 'flex',
    justifyContent: 'center' as const,
    paddingTop: 4,
    borderTop: '1px solid rgba(0, 255, 255, 0.04)',
  },
  footerText: {
    fontSize: 7,
    fontFamily: 'system-ui, monospace',
    color: 'rgba(0, 255, 255, 0.18)',
    letterSpacing: 2,
  },
};
