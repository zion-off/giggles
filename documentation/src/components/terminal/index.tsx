'use client';

import { type ReactElement, useState } from 'react';
import dynamic from 'next/dynamic';

const TerminalInner = dynamic(() => import('./terminal').then((m) => m.TerminalInner), { ssr: false });

export function Terminal({ children }: { children: ReactElement }) {
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <div className="not-prose rounded-lg border border-fd-border overflow-hidden my-4 hidden sm:block">
      <div className="bg-fd-muted px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Stop"
              disabled={!ready}
              onClick={() => {
                setActive(false);
                setReady(false);
                setKey((k) => k + 1);
              }}
              className="size-3 rounded-full bg-[#FF5F57] cursor-pointer disabled:cursor-not-allowed transition-opacity hover:brightness-90"
            />
            <button
              type="button"
              aria-label="Stop"
              disabled={!ready}
              onClick={() => {
                setActive(false);
                setReady(false);
                setKey((k) => k + 1);
              }}
              className="size-3 rounded-full bg-[#FEBC2E] cursor-pointer disabled:cursor-not-allowed transition-opacity hover:brightness-90"
            />
            <button
              type="button"
              aria-label={active ? 'Loading' : 'Run demo'}
              disabled={active}
              onClick={() => setActive(true)}
              className="size-3 rounded-full bg-[#28C840] cursor-pointer disabled:cursor-not-allowed transition-opacity hover:brightness-90"
            />
          </div>
          <span className="text-xs text-fd-muted-foreground font-mono">Terminal</span>
        </div>
        {ready ? (
          <button
            type="button"
            onClick={() => {
              setActive(false);
              setReady(false);
              setKey((k) => k + 1);
            }}
            className="text-xs px-2 py-1 rounded bg-fd-background text-fd-foreground border border-fd-border hover:bg-fd-accent transition-colors cursor-pointer"
          >
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActive(true)}
            disabled={active}
            className="text-xs px-2 py-1 rounded bg-fd-primary text-fd-primary-foreground font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-wait"
          >
            {active ? 'Loading…' : 'Run demo'}
          </button>
        )}
      </div>

      {active && (
        <TerminalInner key={key} onReady={() => setReady(true)}>
          {children}
        </TerminalInner>
      )}
    </div>
  );
}
