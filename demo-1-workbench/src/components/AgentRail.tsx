import type { AgentKey } from '../types';
import { AGENTS, AGENT_ORDER } from '../data';

interface Props {
  activeAgent: AgentKey;
  onSelect: (k: AgentKey) => void;
}

export function AgentRail({ activeAgent, onSelect }: Props) {
  return (
    <aside className="agent-rail">
      <div className="rail-section-label">AI AGENTS</div>
      {AGENT_ORDER.map(k => {
        const a = AGENTS[k];
        const active = k === activeAgent;
        return (
          <button
            key={k}
            className={`agent-btn ${active ? 'active' : ''}`}
            onClick={() => onSelect(k)}
          >
            <img src={a.img} alt="" />
            <div className="agent-name">{a.shortName}</div>
            {a.badge && <span className="agent-badge">{a.badge}</span>}
          </button>
        );
      })}
    </aside>
  );
}
