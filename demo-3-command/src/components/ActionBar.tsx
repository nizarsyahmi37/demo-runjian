import { ACTIONS } from '../data';
import type { ActionKey } from '../types';

interface Props {
  onAction: (key: ActionKey) => void;
}

export function ActionBar({ onAction }: Props) {
  return (
    <div className="action-bar">
      <div className="action-bar-label">QUICK BO ACTIONS</div>
      <div className="action-bar-grid">
        {ACTIONS.map(a => (
          <button
            key={a.key}
            className={`action-btn ${a.className || ''}`}
            onClick={() => onAction(a.key)}
          >
            <div className="action-icon">
              <img src={a.icon} alt="" />
            </div>
            <div className="action-text">
              <div className="action-name">{a.name}</div>
              <div className="action-hint">{a.hint}</div>
            </div>
            <kbd>{a.hotkey}</kbd>
          </button>
        ))}
      </div>
    </div>
  );
}
