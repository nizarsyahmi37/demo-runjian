import { useEffect, useState } from 'react';

/** Top mission HUD — brand, system pills, multi-zone clock, commander chip. */
export function MissionBar() {
  const [time, setTime] = useState(() => fmt(new Date()));
  useEffect(() => {
    const id = setInterval(() => setTime(fmt(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="mission-bar">
      <div className="mb-left">
        <div className="mission-patch" aria-hidden="true">
          <svg viewBox="0 0 60 60" width="38" height="38">
            <defs>
              <radialGradient id="patch-bg" cx="50%" cy="40%" r="60%">
                <stop offset="0%"  stopColor="#15151a"/>
                <stop offset="100%" stopColor="#000"/>
              </radialGradient>
            </defs>
            <circle cx="30" cy="30" r="28" fill="url(#patch-bg)" stroke="#ffffff" strokeOpacity=".4" strokeWidth="1"/>
            <polygon points="30,12 36,28 30,24 24,28" fill="#ffffff" opacity=".85"/>
            <circle cx="30" cy="38" r="3" fill="#fbbf24"/>
            <text x="30" y="50" textAnchor="middle" fill="#ffffff" opacity=".7"
                  fontSize="6" fontFamily="Inter" fontWeight="700" letterSpacing="1">RUNJIAN</text>
          </svg>
        </div>
        <div className="mb-titles">
          <div className="mb-title">RUNJIAN COMMAND</div>
          <div className="mb-sub">MY-SECTOR · MISSION 540 · INTERNATIONAL LANDING PLANTS</div>
        </div>
      </div>

      <div className="mb-status">
        <div className="status-pill ok"><span className="dot"/>SYS NOMINAL</div>
        <div className="status-pill warn"><span className="dot"/>1 ANOMALY</div>
        <div className="status-pill ok"><span className="dot"/>UPLINK 142ms</div>
        <div className="status-pill ok"><span className="dot"/>AI · 8 AGENTS</div>
      </div>

      <div className="mb-clock">
        <div className="clock-row"><span className="clock-zone">MYT</span><span className="clock-val">{time.myt}</span></div>
        <div className="clock-row"><span className="clock-zone">UTC</span><span className="clock-val">{time.utc}</span></div>
        <div className="clock-row"><span className="clock-zone">T+</span><span className="clock-val">540d {time.myt}</span></div>
      </div>

      <div className="mb-user">
        <div className="user-orb"/>
        <div>
          <div className="user-callsign">CMDR · HUNTER</div>
          <div className="user-clearance">CLEARANCE: P3 · INTL OPS</div>
        </div>
      </div>
    </header>
  );
}

function fmt(d: Date): { myt: string; utc: string } {
  const offset = 8 * 60 * 60 * 1000;
  const my = new Date(d.getTime() + d.getTimezoneOffset() * 60000 + offset);
  const ut = new Date(d.getTime());
  const fm = (t: Date) => `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`;
  return { myt: fm(my), utc: fm(new Date(ut.getTime() - my.getTimezoneOffset() * 60000)) };
}
