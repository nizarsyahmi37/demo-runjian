/* ============================================================
   iRun Tactical · Demo 2 — RTS HUD interactive
   ============================================================ */

// Unit data
const UNITS = {
  kedah:   { name: 'Kedah-Commercial',   class: 'PV Substation · iSolarCloud', hp: 96, power: 142,  capMax: 307,   cap: '307 kWp',   alarms: 0, crew: '—',       yieldT: '0.42 MWh today', img: './assets/generated/infrastructure/substation.png' },
  penang:  { name: 'Penang-Commercial',  class: 'PV Substation · iSolarCloud', hp: 48, power: 1284, capMax: 2757,  cap: '2,757 kWp', alarms: 2, crew: 'Team-2',  yieldT: '8.91 MWh today', img: './assets/generated/infrastructure/substation.png', alert: true },
  perak:   { name: 'Perak-Commercial',   class: 'PV Substation · iSolarCloud', hp: 91, power: 1402, capMax: 2855,  cap: '2,855 kWp', alarms: 0, crew: 'Team-1',  yieldT: '12.4 MWh today', img: './assets/generated/infrastructure/substation.png' },
  melaka:  { name: 'Melaka-Commercial',  class: 'PV Substation · Huawei',     hp: 88, power: 198,  capMax: 409,   cap: '409 kWp',   alarms: 0, crew: '—',       yieldT: '1.84 MWh today', img: './assets/generated/infrastructure/substation.png' },
  johor:   { name: 'Johor-Commercial',   class: 'PV Substation · Huawei',     hp: 84, power: 561,  capMax: 1160,  cap: '1,160 kWp', alarms: 0, crew: 'Team-3',  yieldT: '5.21 MWh today', img: './assets/generated/infrastructure/substation.png' },
};

// Voice-line phrases per command (Warcraft-style flavor)
const VOICE = {
  'view-alarms':   ['Show me the threat.', 'Scanning for hostiles…', 'Eyes on target.'],
  'work-order':    ['Work order issued, my liege.', 'Paperwork incoming.', 'Filed and signed.'],
  'dispatch':      ['Squad inbound!', 'Crew rolling out!', 'On our way!', 'Yes, milord.'],
  'inspect':       ['Beginning inspection.', 'Checklist running.', 'On it.'],
  'diagnose':      ['Engaging Diagnosis Agent.', 'Running fault tree…', 'Computing root cause.'],
  'maintenance':   ['Maintenance scheduled.', 'Calendar marked.'],
  'report':        ['Smart report compiling.', 'Crunching numbers, sire.'],
  'recall':        ['Team returning to base.', 'Recalled!'],
  'sos':           ['SOS! ESCALATING NOW!', 'CRITICAL! All hands!', 'Mayday, mayday.'],
};

// State
let selected = 'penang';

// -------- Unit selection --------
const stage = document.getElementById('battlefield');

function renderPortrait(unit) {
  document.getElementById('portraitSprite').src = unit.img;
  document.getElementById('portraitName').textContent = unit.name;
  document.getElementById('portraitClass').textContent = unit.class;

  const hpFill = document.getElementById('hpFill');
  hpFill.style.width = unit.hp + '%';
  hpFill.className = 'bar-fill ' + (unit.hp < 60 ? 'hp' : '');
  hpFill.style.background = unit.hp < 60
    ? 'linear-gradient(180deg, #f87171, #b91c1c)'
    : 'linear-gradient(180deg, #4ade80, #15803d)';
  document.getElementById('hpVal').textContent = `${unit.hp} / 100`;

  const ratio = unit.power / unit.capMax;
  document.getElementById('mpFill').style.width = (ratio * 100).toFixed(0) + '%';
  document.getElementById('mpVal').textContent = `${(unit.power/1000).toFixed(2)} / ${(unit.capMax/1000).toFixed(2)} MW`;

  // Yield XP arbitrary
  document.getElementById('xpFill').style.width = Math.min(100, ratio * 80 + 10) + '%';
  document.getElementById('xpVal').textContent = unit.yieldT;

  document.getElementById('statCap').textContent = unit.cap;
  document.getElementById('statAlarm').textContent = unit.alarms > 0 ? `${unit.alarms} alarms` : 'no alarms';
  document.getElementById('statCrew').textContent = unit.crew;
}

renderPortrait(UNITS.penang);
document.querySelector('.unit[data-id="penang"]').classList.add('selected');

document.querySelectorAll('.unit').forEach(el => {
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.unit').forEach(u => u.classList.remove('selected'));
    el.classList.add('selected');
    selected = el.dataset.id;
    renderPortrait(UNITS[selected]);

    pushChat({ from: 'system', text: `Selected: ${UNITS[selected].name}.` });
  });
});

// -------- Command card --------
const cmdTooltip = document.getElementById('cmdTooltip');
const cmds = document.querySelectorAll('.cmd');

cmds.forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    cmdTooltip.innerHTML = `<strong>${btn.dataset.name}</strong><small>${btn.dataset.cost}</small>`;
    cmdTooltip.classList.add('visible');
  });
  btn.addEventListener('mouseleave', () => cmdTooltip.classList.remove('visible'));
  btn.addEventListener('click', () => fireCommand(btn.dataset.cmd, btn.dataset.name));
});

function fireCommand(cmd, name) {
  const lines = VOICE[cmd] || ['Acknowledged.'];
  const voice = lines[Math.floor(Math.random() * lines.length)];

  pushChat({ from: 'user', text: `> ${name}` });
  setTimeout(() => pushChat({ from: 'agent', text: voice }), 250);

  // Show BO payload
  const payload = buildPayload(cmd, name);
  showBoPop(payload);
}

function buildPayload(cmd, name) {
  return {
    timestamp: new Date().toISOString(),
    source: 'irun-tactical-fe',
    method: 'api_or_rpa_bridge',
    boTarget: 'IRUN-BO/CMS',
    tenant: 'International Landing Plants',
    user: 'hunter',
    command: cmd.toUpperCase(),
    action: name,
    unitId: selected,
    unitName: UNITS[selected].name,
  };
}

const boPop = document.getElementById('boPop');
const boPopBody = document.getElementById('boPopBody');
let boTimer;
function showBoPop(payload) {
  boPopBody.textContent = JSON.stringify(payload, null, 2);
  boPop.hidden = false;
  // re-trigger animation
  boPop.style.animation = 'none';
  boPop.offsetHeight;
  boPop.style.animation = '';
  clearTimeout(boTimer);
  boTimer = setTimeout(() => boPop.hidden = true, 5500);
}

// -------- Chat feed --------
const chatFeed = document.getElementById('chatFeed');
const chatForm = document.getElementById('rtsChatForm');
const chatInput = document.getElementById('rtsChatInput');

function pushChat(msg) {
  const line = document.createElement('div');
  line.className = `cf-line ${msg.from}`;
  const prefix = msg.from === 'user' ? '[hunter]' :
                 msg.from === 'agent' ? 'Alarm Agent' :
                 'System';
  line.innerHTML = `<strong>${prefix} ›</strong> ${msg.text}`;
  chatFeed.appendChild(line);
  chatFeed.scrollTop = chatFeed.scrollHeight;

  // also stream to top-left chat log
  const logEntry = document.createElement('div');
  logEntry.className = `chat-log-entry ${msg.from === 'user' ? 'user' : 'agent'}`;
  logEntry.innerHTML = `<strong>${msg.from === 'user' ? '[Cmdr. hunter]' : 'Alarm Agent'}:</strong> ${msg.text}`;
  document.getElementById('chatLog').appendChild(logEntry);

  // Cap to last 6
  const logEntries = document.querySelectorAll('#chatLog .chat-log-entry');
  if (logEntries.length > 6) logEntries[0].remove();
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = chatInput.value.trim();
  if (!v) return;
  pushChat({ from: 'user', text: v });
  chatInput.value = '';
  setTimeout(() => {
    pushChat({ from: 'agent', text: replyTo(v) });
  }, 600);
});

function replyTo(t) {
  const s = t.toLowerCase();
  if (s.includes('dispatch') || s.includes('send')) {
    fireCommand('dispatch', 'Dispatch Crew');
    return 'Crew rolling out to ' + UNITS[selected].name + '!';
  }
  if (s.includes('inspect')) {
    fireCommand('inspect', 'Run Inspection SOP');
    return 'Beginning inspection of ' + UNITS[selected].name + '.';
  }
  if (s.includes('alarm') || s.includes('view')) {
    fireCommand('view-alarms', 'View Alarms');
    return 'Pulling active alarms now.';
  }
  if (s.includes('diagnose') || s.includes('why')) {
    fireCommand('diagnose', 'Run Diagnosis');
    return 'Engaging Diagnosis Agent…';
  }
  if (s.includes('status')) {
    return `${UNITS[selected].name}: ${UNITS[selected].hp}/100 health, ${UNITS[selected].alarms} alarms.`;
  }
  return 'Yes, my liege.';
}

// -------- Hotkeys --------
const KEYS = { q: 'view-alarms', w: 'work-order', e: 'dispatch', r: 'inspect', t: 'diagnose', y: 'maintenance', a: 'report', s: 'recall', d: 'sos' };
window.addEventListener('keydown', (e) => {
  if (document.activeElement?.tagName === 'INPUT') return;
  const cmd = KEYS[e.key.toLowerCase()];
  if (cmd) {
    const btn = document.querySelector(`.cmd[data-cmd="${cmd}"]`);
    if (btn) { btn.click(); btn.style.filter = 'brightness(1.5)'; setTimeout(() => btn.style.filter = '', 200); }
  }
});

// -------- Live counters --------
let energy = 32.4;
let crew = 3;
let tokens = 46.2;

setInterval(() => {
  energy += 0.005;
  tokens += 0.03;
  document.getElementById('resEnergy').textContent = energy.toFixed(2);
  document.getElementById('resToken').textContent = tokens.toFixed(1);
}, 1100);

// -------- Periodic ambient chat lines for "alive" feel --------
const AMBIENT = [
  { from: 'agent', text: 'Penang inverter #4 telemetry steady. No new faults.' },
  { from: 'agent', text: 'Drone-01 visual confirms thermal hotspot.' },
  { from: 'agent', text: 'Team-2 arriving Penang in 12 min.' },
  { from: 'agent', text: 'PV Assistant: portfolio PR 84.2%.' },
  { from: 'agent', text: 'Scheduling Agent: 2 work orders queued for tomorrow.' },
];
let ambIdx = 0;
setInterval(() => {
  pushChat(AMBIENT[ambIdx % AMBIENT.length]);
  ambIdx++;
}, 14000);

// -------- Day counter increment --------
let day = 540;
setInterval(() => {
  // simulate every 25s = "day passes" purely decorative
  day += 1;
  document.getElementById('dayVal').textContent = day;
}, 25000);
