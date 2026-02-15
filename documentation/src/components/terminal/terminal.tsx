import { InkTerminalBox, getTerminalHeight } from 'ink-web';
import 'ink-web/css';
import 'xterm/css/xterm.css';
import { type ReactElement, useState } from 'react';

const ROWS = 16;
const TERMINAL_HEIGHT = getTerminalHeight(ROWS);

export function TerminalInner({ children, onReady }: { children: ReactElement; onReady: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const handleReady = () => {
    onReady();
    requestAnimationFrame(() => setExpanded(true));
  };

  return (
    <div
      style={{
        height: TERMINAL_HEIGHT,
        overflow: 'hidden',
        opacity: expanded ? 1 : 0,
        transition: 'opacity 0.35s ease'
      }}
    >
      <InkTerminalBox
        focus
        rows={ROWS}
        loading={false}
        onReady={handleReady}
        termOptions={{ fontFamily: 'Geist Mono, monospace' }}
      >
        {children}
      </InkTerminalBox>
    </div>
  );
}
