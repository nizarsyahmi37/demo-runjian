import { useEffect, useMemo, useRef, useState } from 'react';
import { BO_COMMANDS, type BoCommand, groupCommands, filterCommands } from '../data/commands';

interface Props {
  open: boolean;
  onClose: () => void;
  onRun: (cmd: BoCommand) => void;
}

export function CommandPalette({ open, onClose, onRun }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => filterCommands(query), [query]);
  const grouped  = useMemo(() => groupCommands(filtered), [filtered]);
  const flat     = useMemo(() => Object.values(grouped).flat(), [grouped]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(a => Math.min(flat.length - 1, a + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(a => Math.max(0, a - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = flat[active];
        if (cmd) { onRun(cmd); onClose(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, flat, active, onRun, onClose]);

  // keep the active row scrolled into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  return (
    <div className="cmdk-backdrop" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className="cmdk-panel" onMouseDown={(e) => e.stopPropagation()}>
        <header className="cmdk-head">
          <span className="cmdk-icon" aria-hidden="true">⌘K</span>
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Run a BO command — e.g. dispatch, alarm summary, smart report…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="cmdk-count">{flat.length}</span>
          <button className="cmdk-close" onClick={onClose} aria-label="Close palette">Esc</button>
        </header>

        <div className="cmdk-list" ref={listRef}>
          {flat.length === 0 && (
            <div className="cmdk-empty">No commands match <em>{query}</em></div>
          )}
          {(Object.entries(grouped) as [string, BoCommand[]][]).map(([cat, cmds]) => (
            <div key={cat} className="cmdk-group">
              <div className="cmdk-group-label">{cat}</div>
              {cmds.map((cmd) => {
                const idx = flat.indexOf(cmd);
                const isActive = idx === active;
                return (
                  <button
                    key={cmd.id}
                    data-idx={idx}
                    className={`cmdk-row ${isActive ? 'active' : ''} ${cmd.destructive ? 'destructive' : ''}`}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => { onRun(cmd); onClose(); }}
                  >
                    <span className="cmdk-row-icon">{cmd.icon || '◇'}</span>
                    <span className="cmdk-row-name">{cmd.name}</span>
                    <span className="cmdk-row-id">{cmd.payload.action as string}</span>
                    {cmd.shortcut && <kbd className="cmdk-row-key">{cmd.shortcut}</kbd>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <footer className="cmdk-foot">
          <div className="cmdk-foot-hints">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>⏎</kbd> run</span>
            <span><kbd>Esc</kbd> close</span>
          </div>
          <div className="cmdk-foot-meta">
            BO/CMS bridge · IRUN-BO/CMS · {BO_COMMANDS.length} commands
          </div>
        </footer>
      </div>
    </div>
  );
}
