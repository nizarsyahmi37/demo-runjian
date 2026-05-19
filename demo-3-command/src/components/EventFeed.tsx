export interface FeedEntry {
  id: number;
  sev: 'crit' | 'warn' | 'info' | 'ok';
  html: string;
  ts: string;
}

interface Props {
  entries: FeedEntry[];
}

export function EventFeed({ entries }: Props) {
  return (
    <div className="panel feed-panel">
      <header className="panel-head">
        <span className="panel-tag">LIVE</span>
        <span className="panel-title">EVENT FEED</span>
        <span className="panel-status">{entries.length} EVENTS · TAILING</span>
      </header>
      <div className="feed">
        {entries.map(e => (
          <div className="feed-line" key={e.id}>
            <span className="ts">{e.ts}</span>
            <span className={`sev ${e.sev}`}>{e.sev.toUpperCase()}</span>
            <span className="msg" dangerouslySetInnerHTML={{ __html: e.html }} />
          </div>
        ))}
      </div>
    </div>
  );
}
