import { useEffect, useRef, useState } from 'react';

/**
 * Telemetry strip — live sparkline + alarm-count bars + node-status grid +
 * agent-activity load bars. Sits below the chat console in the right column.
 */
export function Telemetry() {
  const [history, setHistory] = useState<number[]>(() => {
    const out: number[] = [];
    for (let i = 0; i < 40; i++) out.push(2700 + Math.random() * 400 - 200);
    return out;
  });
  const [tokens, setTokens] = useState(46.2);
  const lastT = useRef(performance.now());

  useEffect(() => {
    const id = setInterval(() => {
      setHistory(prev => {
        const last = prev[prev.length - 1] ?? 2800;
        const next = Math.max(2400, Math.min(3200, last + (Math.random() * 200 - 100)));
        const out = [...prev, next];
        if (out.length > 40) out.shift();
        return out;
      });
      const now = performance.now();
      setTokens(t => +(t + (now - lastT.current) * 0.000023).toFixed(2));
      lastT.current = now;
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const min = Math.min(...history) - 50;
  const max = Math.max(...history) + 50;
  const range = max - min || 1;
  const w = 200; const h = 36;
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  const current = Math.round(history[history.length - 1] ?? 2800);

  return (
    <div className="panel telemetry-panel">
      <header className="panel-head">
        <span className="panel-tag">DATA</span>
        <span className="panel-title">TELEMETRY · LIVE</span>
        <span className="panel-status">5/5 NODES</span>
      </header>
      <div className="charts">
        <div className="chart-card">
          <div className="chart-label"><span>PORTFOLIO POWER</span><strong>{current.toLocaleString()} kW</strong></div>
          <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="pwr-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity=".55"/>
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <polyline points={area} fill="url(#pwr-grad)" />
            <polyline points={pts} fill="none" stroke="#ffffff" strokeWidth="1.4"/>
          </svg>
        </div>

        <div className="chart-card">
          <div className="chart-label"><span>ALARM COUNT 24H</span><strong>2</strong></div>
          <div className="bar-row">
            {[6, 12, 8, 14, 22, 18, 62, 88, 30, 20, 14, 10].map((v, i) => (
              <div key={i} className={`bar-mini ${v >= 60 ? 'crit' : ''}`} style={{ ['--h' as never]: `${v}%` }}/>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-label"><span>NODE STATUS</span><strong>4/5 OK</strong></div>
          <div className="node-row">
            <div className="ns ok">PS-01</div>
            <div className="ns crit">PS-02</div>
            <div className="ns ok">PS-03</div>
            <div className="ns ok">PS-04</div>
            <div className="ns ok">PS-05</div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-label"><span>AGENT ACTIVITY</span><strong>{tokens.toFixed(1)}k tok</strong></div>
          <div className="agent-load-bars">
            <Bar name="ALARM" pct={84}/>
            <Bar name="DIAG"  pct={62}/>
            <Bar name="DATA Q&A" pct={38}/>
            <Bar name="SCHED" pct={24}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bar({ name, pct }: { name: string; pct: number }) {
  return (
    <div className="alb">
      <span>{name}</span>
      <div className="alb-track"><div className="alb-fill" style={{ width: `${pct}%` }}/></div>
    </div>
  );
}
