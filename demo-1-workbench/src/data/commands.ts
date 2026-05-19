/**
 * Comprehensive BO/CMS command catalog — mirrors every page + control surface
 * exposed by pmms01.rundoai.com (38 sub-pages across 10 top-level groups).
 *
 * Each command produces a structured JSON payload that the BO bridge can
 * route to the real PMMS via API or RPA. The shape of `payload` matches the
 * action's POST body convention.
 */

export type BoCommandCategory =
  | 'Plant Overview'
  | 'Real-time Monitoring'
  | 'Data Summary'
  | 'Alarm Management'
  | 'Work Order'
  | 'Data Analysis'
  | 'Inspection'
  | 'Plant Report'
  | 'Message Push'
  | 'Asset Management'
  | 'System Admin';

export interface BoCommand {
  id: string;
  name: string;
  category: BoCommandCategory;
  description?: string;
  shortcut?: string;            // single key or chord shown in palette
  icon?: string;                // emoji glyph (lightweight, no dep)
  destructive?: boolean;
  payload: Record<string, unknown>;
}

/** Helper builds a standard payload skeleton; specific commands extend this. */
const base = (action: string, extra: Record<string, unknown> = {}) => ({
  action,
  ...extra,
});

export const BO_COMMANDS: BoCommand[] = [
  // ------------------- Plant Overview -------------------
  { id: 'plant.view',       category: 'Plant Overview', name: 'View Portfolio Overview',     icon: '🗺',  payload: base('VIEW_PLANT_OVERVIEW') },
  { id: 'plant.refresh',    category: 'Plant Overview', name: 'Refresh Live Telemetry',      icon: '🔄', shortcut: 'F5', payload: base('REFRESH_OVERVIEW', { source: 'manual' }) },
  { id: 'plant.filter',     category: 'Plant Overview', name: 'Filter Plants…',              icon: '🔍', payload: base('FILTER_PLANTS', { fields: ['oem', 'name', 'location', 'type', 'status', 'capacity'] }) },
  { id: 'plant.favourite',  category: 'Plant Overview', name: 'Toggle Favourite Plant',      icon: '⭐', payload: base('TOGGLE_FAVOURITE') },
  { id: 'plant.export',     category: 'Plant Overview', name: 'Export Overview to CSV',      icon: '📤', payload: base('EXPORT_OVERVIEW_CSV') },

  // ------------------- Real-time Monitoring -------------------
  { id: 'monitor.plant',    category: 'Real-time Monitoring', name: 'Plant Monitoring',                   icon: '📡', payload: base('OPEN_PLANT_MONITOR') },
  { id: 'monitor.device',   category: 'Real-time Monitoring', name: 'Device Monitoring',                  icon: '🛠', payload: base('OPEN_DEVICE_MONITOR') },
  { id: 'monitor.video',    category: 'Real-time Monitoring', name: 'Video Surveillance',                 icon: '🎥', payload: base('OPEN_VIDEO_SURVEILLANCE') },
  { id: 'monitor.config',   category: 'Real-time Monitoring', name: 'Configuration Monitoring',           icon: '⚙', payload: base('OPEN_CONFIG_MONITOR') },
  { id: 'monitor.suspend',  category: 'Real-time Monitoring', name: 'Generation Suspension Early Warning', icon: '⚠', payload: base('OPEN_SUSPENSION_WARNING') },
  { id: 'monitor.ptz',      category: 'Real-time Monitoring', name: 'PTZ Camera Control',                 icon: '🎯', payload: base('PTZ_CONTROL', { presets: ['home', 'wide', 'tight', 'sweep'] }) },

  // ------------------- Data Summary -------------------
  { id: 'summary.gen',      category: 'Data Summary', name: 'Generation Summary',         icon: '⚡', payload: base('VIEW_GENERATION_SUMMARY', { period: 'today' }) },
  { id: 'summary.alarm',    category: 'Data Summary', name: 'Alarm Summary',              icon: '🚨', payload: base('VIEW_ALARM_SUMMARY') },
  { id: 'summary.social',   category: 'Data Summary', name: 'Social Contribution Summary', icon: '🌱', payload: base('VIEW_SOCIAL_SUMMARY') },
  { id: 'summary.custom',   category: 'Data Summary', name: 'Customized Report',          icon: '📊', payload: base('OPEN_CUSTOM_REPORT_BUILDER') },
  { id: 'summary.metered',  category: 'Data Summary', name: 'Metered Electricity Summary', icon: '🔌', payload: base('VIEW_METERED_SUMMARY') },
  { id: 'summary.smart',    category: 'Data Summary', name: 'Smart Report (AI)',          icon: '🤖', payload: base('GENERATE_SMART_REPORT', { period: 'daily', useAi: true }) },

  // ------------------- Alarm Management -------------------
  { id: 'alarm.device',     category: 'Alarm Management', name: 'View Device Alarms',                icon: '🚨', shortcut: 'Q', payload: base('VIEW_DEVICE_ALARMS', { scope: 'region', count: 2 }) },
  { id: 'alarm.low-perf',   category: 'Alarm Management', name: 'View Low-Performance Alarms',       icon: '📉', payload: base('VIEW_LOW_PERF_ALARMS') },
  { id: 'alarm.ack',        category: 'Alarm Management', name: 'Acknowledge Selected',              icon: '✅', payload: base('ACK_ALARM') },
  { id: 'alarm.ack-all',    category: 'Alarm Management', name: 'Acknowledge All Active',            icon: '✅', payload: base('ACK_ALL_ALARMS') },
  { id: 'alarm.escalate',   category: 'Alarm Management', name: 'Escalate to P0 (SOS)',              icon: '🆘', shortcut: '⇧Q', destructive: true, payload: base('SOS_ESCALATE', { priority: 'P0', notify: ['oncall', 'manager'] }) },
  { id: 'alarm.auto-rule',  category: 'Alarm Management', name: 'Configure Auto-Dispatch Rules',     icon: '⚙', payload: base('CONFIGURE_AUTO_RULES') },

  // ------------------- Work Order -------------------
  { id: 'ticket.create',    category: 'Work Order', name: 'Create Work Order',              icon: '📝', shortcut: 'W', payload: base('CREATE_WORK_ORDER', { template: 'PV_INSPECTION' }) },
  { id: 'ticket.dispatch',  category: 'Work Order', name: 'Dispatch Crew',                  icon: '🚐', shortcut: 'E', payload: base('DISPATCH_CREW', { team: 'Team-2' }) },
  { id: 'ticket.auto',      category: 'Work Order', name: 'Auto Dispatch',                  icon: '🤖', payload: base('AUTO_DISPATCH', { engine: 'route-optimizer' }) },
  { id: 'ticket.history',   category: 'Work Order', name: 'Ticket History',                 icon: '📜', shortcut: 'T', payload: base('OPEN_TICKET_HISTORY', { range: 'last_30d' }) },
  { id: 'ticket.approve',   category: 'Work Order', name: 'Approve Pending Tickets',        icon: '✔', payload: base('APPROVE_PENDING_TICKETS') },
  { id: 'ticket.reassign',  category: 'Work Order', name: 'Reassign Ticket…',               icon: '↪', payload: base('REASSIGN_TICKET') },
  { id: 'ticket.close',     category: 'Work Order', name: 'Close Ticket',                   icon: '✖', payload: base('CLOSE_TICKET') },

  // ------------------- Data Analysis -------------------
  { id: 'analysis.gen',     category: 'Data Analysis', name: 'Generation Analysis',        icon: '📈', payload: base('OPEN_GENERATION_ANALYSIS') },
  { id: 'analysis.trend',   category: 'Data Analysis', name: 'Trend Analysis',             icon: '📉', payload: base('OPEN_TREND_ANALYSIS') },
  { id: 'analysis.heatmap', category: 'Data Analysis', name: 'Heatmap Analysis',           icon: '🗺', payload: base('OPEN_HEATMAP_ANALYSIS') },
  { id: 'analysis.disp',    category: 'Data Analysis', name: 'Dispersion Analysis',        icon: '◑', payload: base('OPEN_DISPERSION_ANALYSIS') },
  { id: 'analysis.compare', category: 'Data Analysis', name: 'Comparison Analysis',        icon: '⚖', payload: base('OPEN_COMPARISON_ANALYSIS') },
  { id: 'analysis.rank',    category: 'Data Analysis', name: 'Plant Ranking',              icon: '🏆', payload: base('OPEN_PLANT_RANKING') },

  // ------------------- Inspection -------------------
  { id: 'inspect.start',    category: 'Inspection', name: 'Start Inspection',                icon: '🔎', shortcut: 'R', payload: base('START_INSPECTION', { sop: 'PV-SOP-014', steps: 14 }) },
  { id: 'inspect.sop',      category: 'Inspection', name: 'Inspection SOP Library',          icon: '📋', payload: base('OPEN_SOP_LIBRARY') },
  { id: 'inspect.sop-cfg',  category: 'Inspection', name: 'Plant SOP Configuration',         icon: '⚙', payload: base('OPEN_PLANT_SOP_CONFIG') },
  { id: 'inspect.wo',       category: 'Inspection', name: 'Inspection Work Orders',          icon: '📋', payload: base('VIEW_INSPECTION_WORK_ORDERS') },
  { id: 'inspect.hazard',   category: 'Inspection', name: 'File Hazard Order',               icon: '☠', payload: base('FILE_HAZARD_ORDER') },
  { id: 'inspect.record',   category: 'Inspection', name: 'Inspection Records',              icon: '📁', payload: base('VIEW_INSPECTION_RECORDS') },
  { id: 'inspect.summary',  category: 'Inspection', name: 'Inspection Summary',              icon: '📊', payload: base('VIEW_INSPECTION_SUMMARY') },
  { id: 'inspect.photos',   category: 'Inspection', name: 'Upload Before/During/After Photos', icon: '📷', payload: base('UPLOAD_INSPECTION_PHOTOS') },

  // ------------------- Plant Report -------------------
  { id: 'report.smart',     category: 'Plant Report', name: 'Generate Smart Report',         icon: '🤖', shortcut: 'Y', payload: base('GENERATE_SMART_REPORT', { period: 'daily' }) },
  { id: 'report.template',  category: 'Plant Report', name: 'Manage Report Templates',       icon: '📐', payload: base('OPEN_REPORT_TEMPLATES') },
  { id: 'report.param',     category: 'Plant Report', name: 'Report Parameter Setup',        icon: '⚙', payload: base('CONFIGURE_REPORT_PARAMS') },
  { id: 'report.amr',       category: 'Plant Report', name: 'AMR Power Report',              icon: '⚡', payload: base('RUN_AMR_POWER_REPORT') },
  { id: 'report.schedule',  category: 'Plant Report', name: 'Schedule Auto-Report',          icon: '⏰', payload: base('SCHEDULE_AUTO_REPORT') },
  { id: 'report.export',    category: 'Plant Report', name: 'Export Report (PDF/XLSX)',      icon: '📤', payload: base('EXPORT_REPORT', { formats: ['pdf', 'xlsx'] }) },

  // ------------------- Message Push -------------------
  { id: 'push.warning',     category: 'Message Push', name: 'Send Warning Push',             icon: '⚠', payload: base('SEND_WARNING_PUSH') },
  { id: 'push.station',     category: 'Message Push', name: 'Send Station Push',             icon: '📡', payload: base('SEND_STATION_PUSH') },
  { id: 'push.announce',    category: 'Message Push', name: 'Send Announcement',             icon: '📢', payload: base('SEND_ANNOUNCEMENT') },

  // ------------------- Asset Management -------------------
  { id: 'asset.plant',      category: 'Asset Management', name: 'Plant Management',          icon: '🏭', payload: base('OPEN_PLANT_MGMT') },
  { id: 'asset.plant-add',  category: 'Asset Management', name: 'Add New Plant',             icon: '➕', payload: base('ADD_PLANT') },
  { id: 'asset.device',     category: 'Asset Management', name: 'Device Management',         icon: '🔌', payload: base('OPEN_DEVICE_MGMT') },
  { id: 'asset.device-add', category: 'Asset Management', name: 'Add Device',                icon: '➕', payload: base('ADD_DEVICE') },
  { id: 'asset.camera',     category: 'Asset Management', name: 'Camera Management',         icon: '🎥', payload: base('OPEN_CAMERA_MGMT') },
  { id: 'asset.svg',        category: 'Asset Management', name: 'SVG / Single-Line Diagram', icon: '📐', payload: base('OPEN_SVG_MGMT') },
  { id: 'asset.planned',    category: 'Asset Management', name: 'Planned Generation',        icon: '📅', payload: base('OPEN_PLANNED_GENERATION') },
  { id: 'asset.maintenance', category: 'Asset Management', name: 'Schedule Maintenance',     icon: '🔧', shortcut: 'U', payload: base('SCHEDULE_MAINTENANCE') },

  // ------------------- System Administration -------------------
  { id: 'admin.account',    category: 'System Admin', name: 'Account Management',            icon: '👥', payload: base('OPEN_ACCOUNT_MGMT') },
  { id: 'admin.role',       category: 'System Admin', name: 'Role Management',               icon: '🛡', payload: base('OPEN_ROLE_MGMT') },
  { id: 'admin.audit',      category: 'System Admin', name: 'View Audit Log',                icon: '📜', payload: base('VIEW_AUDIT_LOG') },
  { id: 'admin.api-key',    category: 'System Admin', name: 'API Key / Bridge Token',        icon: '🔑', payload: base('MANAGE_API_KEYS') },
];

/** Group commands by category — used by the palette UI to render sections. */
export function groupCommands(cmds: BoCommand[] = BO_COMMANDS): Record<BoCommandCategory, BoCommand[]> {
  const out: Partial<Record<BoCommandCategory, BoCommand[]>> = {};
  for (const c of cmds) {
    (out[c.category] ||= []).push(c);
  }
  return out as Record<BoCommandCategory, BoCommand[]>;
}

/** Tiny fuzzy filter — matches if every char of `q` appears in `name` in order. */
export function filterCommands(q: string, cmds: BoCommand[] = BO_COMMANDS): BoCommand[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return cmds;
  return cmds.filter(c => {
    const hay = `${c.name} ${c.category}`.toLowerCase();
    let i = 0;
    for (const ch of needle) {
      const idx = hay.indexOf(ch, i);
      if (idx === -1) return false;
      i = idx + 1;
    }
    return true;
  });
}

/** Lookup command by id for hotkey/chat routing. */
export function findCommand(id: string): BoCommand | undefined {
  return BO_COMMANDS.find(c => c.id === id);
}
