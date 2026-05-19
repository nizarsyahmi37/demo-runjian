import type { Plant, AgentThread, AgentKey, ActionKey } from './types';

/** Asset paths — these resolve against Vite's publicDir which points to ../assets. */
const A = (p: string) => `/${p}`;

export const PLANTS: Plant[] = [
  { id: 'kedah',  name: 'Kedah-Commercial',  cap: '307.44 kWp', capMW: 0.307, oem: 'iSolarCloud', today: '0.42 MWh', status: 'normal',   power: 142,  x: 18, y: 22 },
  { id: 'penang', name: 'Penang-Commercial', cap: '2,757 kWp',  capMW: 2.757, oem: 'iSolarCloud', today: '8.91 MWh', status: 'critical', power: 1284, alarms: 2, x: 50, y: 12 },
  { id: 'perak',  name: 'Perak-Commercial',  cap: '2,855 kWp',  capMW: 2.855, oem: 'iSolarCloud', today: '12.4 MWh', status: 'normal',   power: 1402, x: 78, y: 22 },
  { id: 'melaka', name: 'Melaka-Commercial', cap: '409 kWp',    capMW: 0.409, oem: 'Huawei',      today: '1.84 MWh', status: 'normal',   power: 198,  x: 28, y: 70 },
  { id: 'johor',  name: 'Johor-Commercial',  cap: '1,160 kWp',  capMW: 1.160, oem: 'Huawei',      today: '5.21 MWh', status: 'normal',   power: 561,  x: 72, y: 75 },
];

export const AGENTS: Record<AgentKey, AgentThread> = {
  alarm: {
    key: 'alarm',
    name: 'Alarm Agent',
    shortName: 'Alarm',
    desc: 'Triage & dispatch active alarms · 2 active',
    img: A('generated/ai-agents/alarm-agent.png'),
    badge: '2',
    quick: ['View all alarms', 'Analyze Penang #2', 'Auto-dispatch', 'Acknowledge all'],
    messages: [
      { from: 'agent', html: 'Good afternoon, <strong>hunter</strong>. I detected <strong>2 active alarms</strong> at <strong>Penang-Commercial</strong>.' },
      { from: 'agent', html: 'Pulled the latest from BO/CMS:', list: [
        { sev: 'crit', text: 'Inverter #4 — DC string ground fault', time: '14:32:11' },
        { sev: 'warn', text: 'Combiner Box 2 — temperature rising', time: '14:18:04' },
      ]},
      { from: 'agent', html: 'Suggested action: <strong>dispatch Chen Wei + service van</strong> to Penang. ETA 38 min. Drone pre-inspection ready in 6 min.' },
    ],
  },
  ticket: {
    key: 'ticket',
    name: 'Ticket Agent',
    shortName: 'Ticket',
    desc: 'Work order lifecycle',
    img: A('generated/ai-agents/ticket-agent.png'),
    quick: ['Open tickets', 'New work order', 'Pending approvals', 'Closed today'],
    messages: [
      { from: 'agent', html: 'I have <strong>4 open work orders</strong> across the region. 2 awaiting your sign-off.' },
      { from: 'agent', html: 'Most overdue: <strong>WO-2026-0418</strong> (Johor inverter cleaning, +3 days).' },
    ],
  },
  schedule: {
    key: 'schedule',
    name: 'Scheduling Agent',
    shortName: 'Schedule',
    desc: 'Crew & route optimization',
    img: A('generated/ai-agents/scheduling-agent.png'),
    quick: ["Today's roster", 'Optimize routes', 'Crew availability', 'Reassign'],
    messages: [
      { from: 'agent', html: 'Today: <strong>3 crews</strong> on duty across Penang / Perak / Johor.' },
      { from: 'agent', html: 'If I reroute Team-2 via the Perak alarm first, I save <strong>1h 12m</strong>. Apply?' },
    ],
  },
  warning: {
    key: 'warning',
    name: 'Predictive Alert',
    shortName: 'Predict',
    desc: 'Anomaly forecasting',
    img: A('generated/ai-agents/warning-agent.png'),
    quick: ['Forecast 24h', 'Show degradation', 'Weather impact', 'Yield projection'],
    messages: [
      { from: 'agent', html: 'PV string at Penang #2 trending <strong>−14% vs baseline</strong> last 48h. 87% probability of inverter fault in 72h.' },
      { from: 'agent', html: 'Recommend pre-emptive inspection before <strong>20 May 09:00</strong>.' },
    ],
  },
  inspect: {
    key: 'inspect',
    name: 'Inspection Agent',
    shortName: 'Inspect',
    desc: 'Routine SOP & checklist',
    img: A('generated/ai-agents/inspection-agent.png'),
    quick: ['SOP for Penang', 'Start inspection', 'Upload photos', 'Sign off'],
    messages: [
      { from: 'agent', html: 'Standard SOP for commercial PV alarm contains 14 checklist items. I can pre-fill 9 from sensor data.' },
    ],
  },
  pv: {
    key: 'pv',
    name: 'PV Assistant',
    shortName: 'PV',
    desc: 'Performance specialist',
    img: A('generated/ai-agents/pv-assistant-agent.png'),
    quick: ['PR analysis', 'Loss tree', 'Compare to peers', 'Soiling estimate'],
    messages: [
      { from: 'agent', html: 'Portfolio PR today: <strong>84.2%</strong> vs target 86%. Soiling contributing <strong>−1.3pp</strong> at Perak.' },
    ],
  },
  diag: {
    key: 'diag',
    name: 'Diagnosis Agent',
    shortName: 'Diag',
    desc: 'Root-cause analysis',
    img: A('generated/ai-agents/diagnosis-agent.png'),
    quick: ['Diagnose Penang #2', 'Inverter fault tree', 'Compare similar', 'Generate report'],
    messages: [
      { from: 'agent', html: 'For Penang #2 — top 3 hypotheses:' },
      { from: 'agent', html: 'Likely causes (Bayesian, last 90 days):', list: [
        { sev: 'crit', text: 'DC arc fault (IGBT module)', time: '74%' },
        { sev: 'warn', text: 'String connector corrosion', time: '18%' },
        { sev: 'warn', text: 'Sensor misread', time: '8%' },
      ]},
    ],
  },
  dataqa: {
    key: 'dataqa',
    name: 'Data Q&A',
    shortName: 'Data Q&A',
    desc: 'Ask anything about telemetry',
    img: A('generated/ai-agents/data-qa-agent.png'),
    quick: ['Top performers today', 'kWh by site', 'Yesterday vs today', 'CO₂ this year'],
    messages: [
      { from: 'agent', html: 'Ask in plain English — e.g. <em>"How much did Johor produce last Tuesday between 10 and 2?"</em>' },
    ],
  },
};

export const AGENT_ORDER: AgentKey[] = ['alarm', 'ticket', 'schedule', 'warning', 'inspect', 'pv', 'diag', 'dataqa'];

export interface ActionDef {
  key: ActionKey;
  name: string;
  hint: string;
  hotkey: string;
  icon: string;
  className?: string;
}

export const ACTIONS: ActionDef[] = [
  { key: 'view-alarms', name: 'View Alarms',       hint: 'Q · 2 active', hotkey: 'Q', icon: A('generated/status-icons/alert-marker.png'),    className: 'alert-action' },
  { key: 'work-order',  name: 'Create Work Order', hint: 'W',            hotkey: 'W', icon: A('generated/status-icons/work-order-icon.png') },
  { key: 'dispatch',    name: 'Dispatch Crew',     hint: 'E',            hotkey: 'E', icon: A('generated/status-icons/dispatch-icon.png') },
  { key: 'inspect',     name: 'Inspection',        hint: 'R',            hotkey: 'R', icon: A('generated/status-icons/checklist-icon.png') },
  { key: 'history',     name: 'Ticket History',    hint: 'T',            hotkey: 'T', icon: A('generated/status-icons/history-icon.png') },
  { key: 'report',      name: 'Smart Report',      hint: 'Y',            hotkey: 'Y', icon: A('generated/status-icons/human-report-icon.png') },
  { key: 'maintenance', name: 'Maintenance',       hint: 'U',            hotkey: 'U', icon: A('generated/status-icons/maintenance-icon.png') },
  { key: 'sos',         name: 'SOS Escalate',      hint: 'SHIFT+Q',      hotkey: '⇧Q', icon: A('generated/status-icons/sos-marker.png'),       className: 'sos-action' },
];

/** Map a free-text user message to an agent reply (and optionally a side effect). */
export interface ReplyResult {
  reply: { from: 'agent'; html: string; list?: { sev: 'crit' | 'warn' | 'info' | 'ok'; text: string; time: string }[] };
  fire?: { action: string; plantId?: string; team?: string };
}
export function generateReply(text: string): ReplyResult {
  const t = text.toLowerCase();
  if (t.includes('alarm') || t.includes('view')) {
    return {
      reply: {
        from: 'agent',
        html: 'Showing all <strong>2 active alarms</strong> at Penang. The DC arc fault is highest priority — I\'ve flagged it on the map.',
        list: [
          { sev: 'crit', text: 'Penang · Inverter #4 DC ground fault', time: 'P1' },
          { sev: 'warn', text: 'Penang · Combiner Box 2 thermal rise', time: 'P2' },
        ],
      },
    };
  }
  if (t.includes('dispatch') || t.includes('crew') || t.includes('auto')) {
    return {
      reply: { from: 'agent', html: '✅ <strong>Crew dispatched.</strong> Team-2 + Service Van VAN-04 + Drone-01 routed to Penang. Live ETA <strong>38 min</strong>. Live route now drawing on the map.' },
      fire: { action: 'AUTO_DISPATCH', plantId: 'penang', team: 'Team-2' },
    };
  }
  if (t.includes('analyze') || t.includes('penang') || t.includes('diagnose')) {
    return { reply: { from: 'agent', html: 'Diving in. Penang #2 inverter shows characteristic DC arc signature (≥18kHz harmonic, IR rise +24°C). Confidence <strong>91%</strong>. Generating intelligent report…' } };
  }
  if (t.includes('weather') || t.includes('forecast')) {
    return { reply: { from: 'agent', html: 'Forecast next 6h: scattered cumulus, irradiance <strong>−12% vs clear-sky</strong>. No safety risk. Expect midday production dip.' } };
  }
  return { reply: { from: 'agent', html: 'On it — pulling that from the BO/CMS layer now.' } };
}
