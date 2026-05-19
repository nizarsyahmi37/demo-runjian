import { useEffect, useRef, useState } from 'react';
import type { ChatMessage, AgentKey, MsgFrom } from '../types';
import { AGENTS, AGENT_ORDER, generateReply } from '../data';

interface Props {
  agentKey: AgentKey;
  collapsed: boolean;
  onCollapse: () => void;
  onFire: (action: string, plantId?: string, team?: string) => void;
  /** Optional — if provided, the panel renders an inline agent picker tab strip. */
  onSelectAgent?: (k: AgentKey) => void;
}

interface RenderedMsg extends ChatMessage {
  id: number;
}

export function ChatPanel({ agentKey, collapsed, onCollapse, onFire, onSelectAgent }: Props) {
  const agent = AGENTS[agentKey];
  const [messages, setMessages] = useState<RenderedMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  function pushMsg(m: ChatMessage) {
    setMessages(prev => [...prev, { ...m, id: ++idRef.current }]);
  }

  // Reset thread on agent switch and stagger the initial messages.
  useEffect(() => {
    setMessages([{ from: 'system', html: `Switched to <strong>${agent.name}</strong>.`, id: ++idRef.current }]);
    setTyping(false);
    const timers: number[] = [];
    agent.messages.forEach((m, i) => {
      timers.push(window.setTimeout(() => pushMsg(m), 220 + i * 360));
    });
    return () => { timers.forEach(t => clearTimeout(t)); };
  }, [agentKey, agent]);

  // Auto-scroll
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    pushMsg({ from: 'user', html: text });
    setTyping(true);
    const delay = 800 + Math.random() * 500;
    setTimeout(() => {
      const { reply, fire } = generateReply(text);
      setTyping(false);
      pushMsg(reply);
      if (fire) onFire(fire.action, fire.plantId, fire.team);
    }, delay);
  }

  return (
    <aside className={`chat-panel ${collapsed ? 'is-collapsed' : ''}`}>
      <header className="chat-head">
        <img className="chat-avatar" src={agent.img} alt="" />
        <div className="chat-meta">
          <div className="chat-title">{agent.name}</div>
          <div className="chat-sub">{agent.desc}</div>
        </div>
        {!onSelectAgent && (
          <button className="chat-collapse" onClick={onCollapse} title="Collapse panel" aria-label="Collapse panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M9 18l6-6-6-6" /></svg>
          </button>
        )}
      </header>

      {onSelectAgent && (
        <div className="chat-agent-tabs">
          {AGENT_ORDER.map(k => (
            <button
              key={k}
              className={`chat-agent-tab ${k === agentKey ? 'active' : ''}`}
              onClick={() => onSelectAgent(k)}
              title={AGENTS[k].name}
            >
              <img src={AGENTS[k].img} alt="" />
              {AGENTS[k].badge && <span className="chat-agent-badge">{AGENTS[k].badge}</span>}
            </button>
          ))}
        </div>
      )}

      <div className="chat-body" ref={bodyRef}>
        {messages.map(m => (
          <MessageRow key={m.id} from={m.from} html={m.html} list={m.list} />
        ))}
        {typing && (
          <div className="msg agent">
            <div className="msg-bubble">
              <div className="typing-dots"><span /><span /><span /></div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-quick">
        {agent.quick.map(q => (
          <button key={q} className="chat-quick-pill" onClick={() => sendMessage(q)}>{q}</button>
        ))}
      </div>

      <form
        className="chat-input"
        onSubmit={(e) => { e.preventDefault(); sendMessage(input); setInput(''); }}
      >
        <button type="button" className="chat-attach" title="Attach">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the agent, e.g. analyze Penang alarm #2…"
          autoComplete="off"
        />
        <button type="submit" className="chat-send">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          Send
        </button>
      </form>
    </aside>
  );
}

function MessageRow({ from, html, list }: { from: MsgFrom; html: string; list?: ChatMessage['list'] }) {
  return (
    <div className={`msg ${from}`}>
      <div className="msg-bubble">
        <span dangerouslySetInnerHTML={{ __html: html }} />
        {list && (
          <div className="msg-list">
            {list.map((li, i) => (
              <div className={`msg-list-row ${li.sev}`} key={i}>
                <span className="status-dot" />
                <strong>{li.text}</strong>
                <span>{li.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
