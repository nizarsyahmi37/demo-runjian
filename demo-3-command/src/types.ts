export type PlantStatus = 'normal' | 'critical' | 'offline';

export interface Plant {
  id: string;
  name: string;
  cap: string;
  capMW: number;
  oem: 'iSolarCloud' | 'Huawei';
  today: string;
  status: PlantStatus;
  power: number;
  alarms?: number;
  /** Position in % across the map background image */
  x: number;
  y: number;
}

export type AgentKey =
  | 'alarm' | 'ticket' | 'schedule' | 'warning'
  | 'inspect' | 'pv' | 'diag' | 'dataqa';

export interface AgentThread {
  key: AgentKey;
  name: string;
  shortName: string;
  desc: string;
  img: string;
  quick: string[];
  messages: ChatMessage[];
  badge?: string;
}

export type MsgFrom = 'agent' | 'user' | 'system';

export interface ChatListItem {
  sev: 'crit' | 'warn' | 'info' | 'ok';
  text: string;
  time: string;
}

export interface ChatMessage {
  from: MsgFrom;
  html: string;
  list?: ChatListItem[];
}

export interface BoActionPayload {
  source: string;
  method: string;
  boTarget: string;
  tenant: string;
  user: string;
  action: string;
  plantId?: string;
  team?: string;
  [k: string]: unknown;
}

export type ActionKey =
  | 'view-alarms' | 'work-order' | 'dispatch' | 'inspect'
  | 'history' | 'report' | 'maintenance' | 'sos';
