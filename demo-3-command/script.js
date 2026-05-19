/* ============================================================
   RUNJIAN COMMAND · Demo 3 — Mission Control script
   ============================================================ */

// -------- Static data --------
const PLANTS = {
  kedah:   { id: 'PS-01', name: 'KEDAH',  cap: '307 kWp',   oem: 'iSolarCloud', status: 'NOMINAL',  power: 142 },
  penang:  { id: 'PS-02', name: 'PENANG', cap: '2,757 kWp', oem: 'iSolarCloud', status: 'CRITICAL', power: 1284, alarms: 2 },
  perak:   { id: 'PS-03', name: 'PERAK',  cap: '2,855 kWp', oem: 'iSolarCloud', status: 'NOMINAL',  power: 1402 },
  melaka:  { id: 'PS-04', name: 'MELAKA', cap: '409 kWp',   oem: 'Huawei',      status: 'NOMINAL',  power: 198 },
  johor:   { id: 'PS-05', name: 'JOHOR',  cap: '1,160 kWp', oem: 'Huawei',      status: 'NOMINAL',  power: 561 },
};

const AGENTS = {
  alarm:    { name: 'ALARM AGENT',         status: 'ALARM AGENT · ONLINE' },
  ticket:   { name: 'TICKET AGENT',        status: 'TICKET AGENT · ONLINE' },
  schedule: { name: 'SCHEDULING AGENT',    status: 'SCHED AGENT · ONLINE' },
  warning:  { name: 'PREDICTIVE ALERT',    status: 'PREDICT AGENT · ONLINE' },
  inspect:  { name: 'INSPECTION AGENT',    status: 'INSPECT AGENT · ONLINE' },
  pv:       { name: 'PV ASSISTANT',        status: 'PV ASSIST · ONLINE' },
  diag:     { name: 'DIAGNOSIS AGENT',     status: 'DIAG AGENT · ONLINE' },
  dataqa:   { name: 'DATA Q&A AGENT',      status: 'DATA Q&A · ONLINE' },
};

let activeAgent = 'alarm';
let selectedPlant = null;

// -------- Helpers --------
function ts() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// -------- Clock --------
setInterval(() => {
  document.getElementById('clockMyt').textContent = ts();
}, 1000);

// -------- Live event feed (rolling) --------
const feed = document.getElementById('feed');

const FEED_TEMPLATE = [
  { sev: 'crit', msg: '<strong>PS-02 PENANG</strong> · DC arc fault detected on Inverter #4' },
  { sev: 'warn', msg: '<strong>PS-02 PENANG</strong> · Combiner Box 2 thermal +24°C above baseline' },
  { sev: 'info', msg: '<strong>DRONE-01</strong> · pre-flight check OK · ETA 6 min' },
  { sev: 'info', msg: '<strong>VAN-04</strong> · departing depot · payload: replacement IGBT module' },
  { sev: 'ok',   msg: '<strong>PS-04 MELAKA</strong> · daily yield target met (1.84 MWh)' },
  { sev: 'info', msg: '<strong>AI · Diagnosis</strong> · Bayesian inference complete · arc fault 91% conf.' },
  { sev: 'info', msg: '<strong>PR</strong> · portfolio performance ratio steady at 84.2%' },
  { sev: 'warn', msg: '<strong>PS-05 JOHOR</strong> · WO-2026-0418 overdue (3 days)' },
  { sev: 'ok',   msg: '<strong>TEAM-2 (CHEN WEI)</strong> · acknowledged dispatch · status: en route' },
  { sev: 'info', msg: '<strong>SAT</strong> · irradiance 746 W/m² · clear sky window 14:00–17:00' },
  { sev: 'info', msg: '<strong>AGENT · PV ASSISTANT</strong> · soiling estimate Perak -1.3pp' },
  { sev: 'ok',   msg: '<strong>UPLINK</strong> · BO/CMS bridge healthy · 142ms RTT' },
];

function addFeedLine({ sev, msg }) {
  const line = document.createElement('div');
  line.className = 'feed-line';
  line.innerHTML = `<span class="ts">${ts()}</span><span class="sev ${sev}">${sev.toUpperCase().padEnd(4)}</span><span class="msg">${msg}</span>`;
  feed.prepend(line);
  // cap to 60 entries
  const lines = feed.querySelectorAll('.feed-line');
  if (lines.length > 60) lines[lines.length - 1].remove();
}

// seed
FEED_TEMPLATE.slice(0, 8).forEach(addFeedLine);

let feedIdx = 8;
setInterval(() => {
  addFeedLine(FEED_TEMPLATE[feedIdx % FEED_TEMPLATE.length]);
  feedIdx++;
}, 3500);

// -------- Tactical crosshair --------
const tactical = document.getElementById('tactical');
const crosshair = document.getElementById('crosshair');
const chText = document.getElementById('chText');

tactical.addEventListener('mousemove', (e) => {
  const r = tactical.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  crosshair.style.left = x + 'px';
  crosshair.style.top = y + 'px';
  // fake coords (Malaysia is roughly lat 1-7N, lon 100-104E)
  const lat = (7 - (y / r.height) * 6).toFixed(2);
  const lon = (100 + (x / r.width) * 4).toFixed(2);
  chText.textContent = `${lat}°N ${lon}°E`;
});

// -------- Plant node selection --------
document.querySelectorAll('.node').forEach(el => {
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
    el.classList.add('selected');
    selectedPlant = el.dataset.id;
    const p = PLANTS[selectedPlant];
    addFeedLine({ sev: 'info', msg: `<strong>OPERATOR</strong> · target acquired: <strong>${p.id} ${p.name}</strong>` });
    pushChat({ from: 'sys', text: `Target locked: ${p.id} ${p.name} (${p.cap}, ${p.oem})` });
  });
});

// -------- AI Agent tabs --------
document.querySelectorAll('.agent-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.agent-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeAgent = tab.dataset.key;
    const a = AGENTS[activeAgent];
    document.getElementById('chatStatus').textContent = a.status;
    pushChat({ from: 'sys', text: `Switched channel → ${a.name}` });
  });
});

// -------- Chat stream --------
const chatStream = document.getElementById('chatStream');
const cmdForm = document.getElementById('cmdForm');
const cmdInput = document.getElementById('cmdInput');

function pushChat({ from, text, html }) {
  const el = document.createElement('div');
  el.className = `cs-msg ${from}`;
  const prefix = from === 'agent' ? AGENTS[activeAgent].name.split(' ')[0] + '>' :
                 from === 'user'  ? 'CMDR>' :
                                    'SYS>';
  el.innerHTML = `<span class="cs-prefix">${prefix}</span><span class="cs-body">${html || text}</span>`;
  chatStream.appendChild(el);
  chatStream.scrollTop = chatStream.scrollHeight;
}

function pushTyping() {
  const el = document.createElement('div');
  el.className = 'cs-msg agent';
  const prefix = AGENTS[activeAgent].name.split(' ')[0] + '>';
  el.innerHTML = `<span class="cs-prefix">${prefix}</span><span class="cs-body"><span class="typing-dots-cs"><span></span><span></span><span></span></span></span>`;
  chatStream.appendChild(el);
  chatStream.scrollTop = chatStream.scrollHeight;
  return el;
}

// seed chat
pushChat({ from: 'sys', text: 'Console v3.46.1 // BO/CMS bridge ready // type "help" for options' });
pushChat({ from: 'agent', html: 'Operator, I have <strong>2 active alarms</strong> at <strong>PS-02 PENANG</strong>. Recommend immediate dispatch.' });

cmdForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = cmdInput.value.trim();
  if (!v) return;
  pushChat({ from: 'user', text: v });
  cmdInput.value = '';
  const typing = pushTyping();
  setTimeout(() => {
    typing.remove();
    const reply = replyTo(v);
    pushChat({ from: 'agent', html: reply });
  }, 700 + Math.random() * 400);
});

function replyTo(t) {
  const s = t.toLowerCase();
  if (s === 'help') return 'Commands: <em>alarms</em>, <em>dispatch</em>, <em>diagnose</em>, <em>status</em>, <em>weather</em>, <em>report</em>';
  if (s.includes('alarm')) return 'Active <strong>P1 · DC arc fault</strong> · Penang Inv #4. Active <strong>P2 · combiner thermal</strong> · Penang. Engage diagnosis? <em>[T]</em>';
  if (s.includes('dispatch') || s.includes('send')) { fireBoAction('dispatch', 'DISPATCH'); return 'Crew rolling. ETA 38 min. Tracking VAN-04 on tactical.'; }
  if (s.includes('diagnose') || s.includes('why')) return 'Bayesian fault tree → IGBT module DC arc <strong>91%</strong>, connector corrosion <strong>6%</strong>, sensor misread <strong>3%</strong>. Recommend module replacement.';
  if (s.includes('status')) return 'PORTFOLIO: 4/5 nominal · PR 84.2% · live 2.85 MW · 2 P1 alarms';
  if (s.includes('weather')) return 'Forecast 6h: scattered cumulus · irradiance -12% vs clear sky · production dip likely 15:30-16:30';
  if (s.includes('report')) { fireBoAction('report', 'SMART_REPORT'); return 'Generating smart report…'; }
  return 'Acknowledged. Routing query to BO/CMS layer.';
}

// -------- Sparkline data --------
const powerLine = document.getElementById('powerLine');
const powerArea = document.getElementById('powerArea');
const chartPwr = document.getElementById('chartPwr');

let powerHistory = [];
for (let i = 0; i < 40; i++) powerHistory.push(2700 + Math.random() * 400 - 200);

function renderSpark() {
  const w = 200, h = 50;
  const min = Math.min(...powerHistory) - 50;
  const max = Math.max(...powerHistory) + 50;
  const range = max - min || 1;
  const pts = powerHistory.map((v, i) => {
    const x = (i / (powerHistory.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  powerLine.setAttribute('points', pts);
  powerArea.setAttribute('points', `0,${h} ${pts} ${w},${h}`);
  const cur = Math.round(powerHistory[powerHistory.length - 1]);
  chartPwr.textContent = cur.toLocaleString() + ' kW';
}
renderSpark();

setInterval(() => {
  const last = powerHistory[powerHistory.length - 1];
  const next = Math.max(2400, Math.min(3200, last + (Math.random() * 200 - 100)));
  powerHistory.push(next);
  if (powerHistory.length > 40) powerHistory.shift();
  renderSpark();
}, 1400);

// -------- BO actions --------
const toast = document.getElementById('boToast');
const toastBody = document.getElementById('toastBody');
const toastX = document.getElementById('toastX');

function fireBoAction(act, label) {
  const payload = {
    timestamp: new Date().toISOString(),
    source: 'runjian-command-fe',
    method: 'api_or_rpa_bridge',
    boTarget: 'IRUN-BO/CMS',
    tenant: 'International Landing Plants',
    user: 'hunter',
    clearance: 'P3',
    command: act.toUpperCase(),
    action: label || act,
    target: selectedPlant ? PLANTS[selectedPlant].id : 'PS-02',
    targetName: selectedPlant ? PLANTS[selectedPlant].name : 'PENANG',
    activeAgent,
  };
  toastBody.textContent = JSON.stringify(payload, null, 2);
  toast.hidden = false;
  addFeedLine({ sev: act === 'sos' ? 'crit' : 'info',
                msg: `<strong>BO/CMS</strong> · ${act.toUpperCase()} dispatched → ${payload.target} ${payload.targetName}` });
  clearTimeout(window.__t3); window.__t3 = setTimeout(() => toast.hidden = true, 6500);
}

document.querySelectorAll('.bo-act').forEach(btn => {
  btn.addEventListener('click', () => fireBoAction(btn.dataset.act, btn.querySelector('.bo-name').textContent));
});

toastX.addEventListener('click', () => toast.hidden = true);

// -------- Hotkeys --------
const KEYS_3 = { q: 'view-alarms', w: 'work-order', e: 'dispatch', r: 'inspect', t: 'diagnose', y: 'report', u: 'maintenance' };
window.addEventListener('keydown', (e) => {
  if (document.activeElement?.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (e.shiftKey && k === 'q') { fireBoAction('sos', 'SOS · ESCALATE'); return; }
  if (KEYS_3[k]) {
    const btn = document.querySelector(`.bo-act[data-act="${KEYS_3[k]}"]`);
    if (btn) { btn.click(); btn.style.filter = 'brightness(1.4)'; setTimeout(() => btn.style.filter = '', 220); }
  }
});

// -------- Live numbers --------
let todayE = 32.41;
setInterval(() => {
  todayE += 0.002;
  document.getElementById('tkToday').textContent = todayE.toFixed(2) + ' MWh';
}, 1100);

let tokens = 46.2;
setInterval(() => {
  tokens += 0.04;
  document.getElementById('agentLoad').textContent = tokens.toFixed(1) + 'k tok';
}, 1700);

// -------- Buttons --------
document.getElementById('alarmFocus')?.addEventListener('click', () => {
  const node = document.querySelector('.node[data-id="penang"]');
  if (node) {
    node.click();
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

document.getElementById('resetView')?.addEventListener('click', () => {
  document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
  selectedPlant = null;
  pushChat({ from: 'sys', text: 'View reset. No target selected.' });
});
