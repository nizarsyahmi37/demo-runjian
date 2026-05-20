"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAlertStore } from "@/lib/store/alertStore";
import { useWorldStore } from "@/lib/store/worldStore";
import { Panel } from "@/components/primitives/Panel";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { DEVICE_BY_ID } from "@/lib/mock/devices";
import { AGENT_BY_ID } from "@/lib/mock/agents";
import { AGENT_COLORS, SEVERITY_COLORS } from "@/lib/theme/colors";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 9;

export function AlertFeed() {
  const allAlarms = useAlertStore((s) => s.alarms);
  const alarms = allAlarms.slice(0, MAX_VISIBLE);
  const openCount = allAlarms.filter((a) => a.status === "open").length;
  const selectAlarm = useAlertStore((s) => s.selectAlarm);
  const selectDevice = useWorldStore((s) => s.selectDevice);

  return (
    <aside className="absolute left-3 top-16 w-72 h-[360px] z-20 pointer-events-none">
      <Panel
        className="h-full pointer-events-auto"
        accentColor="var(--color-agent-alarm)"
        glowColor="rgba(220, 38, 38, 0.2)"
        ribSide="top"
      >
        <div className="flex flex-col h-full px-2.5 py-2.5 gap-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-rule)]">
            <OrnateTitle size="xs" accentColor="var(--color-agent-alarm)">
              Alert Feed
            </OrnateTitle>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="text-red-400">{openCount}</span>
              <span className="text-text-muted">OPEN</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-dark space-y-1 pr-0.5">
            <AnimatePresence initial={false}>
              {alarms.map((alarm) => {
                const device = DEVICE_BY_ID[alarm.deviceId];
                const agent = AGENT_BY_ID[alarm.recommendedAgent];
                const agentColor = AGENT_COLORS[alarm.recommendedAgent];
                const sevColor = SEVERITY_COLORS[alarm.severity];

                return (
                  <motion.button
                    key={alarm.id}
                    layout
                    initial={{ opacity: 0, x: -12, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    onClick={() => {
                      selectAlarm(alarm.id);
                      selectDevice(alarm.deviceId);
                    }}
                    className={cn(
                      "w-full text-left relative px-2 py-1.5 clip-hex-frame-sm",
                      "bg-gradient-to-r from-[#10162a] to-[#0a0e1a]",
                      "ring-1 ring-inset transition-colors hover:bg-[#141a2a]",
                      alarm.status === "open"
                        ? "ring-[rgba(220,38,38,0.15)]"
                        : alarm.status === "acknowledged"
                          ? "ring-[rgba(245,158,11,0.14)] opacity-75"
                          : "ring-[rgba(148,163,184,0.08)] opacity-50",
                    )}
                    style={{ boxShadow: `inset 2px 0 0 ${sevColor}` }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-condensed font-semibold text-[11px] uppercase tracking-[0.06em] text-text-primary truncate flex-1">
                        {device?.name ?? alarm.deviceId}
                      </span>
                      <span className="font-mono text-[9px] text-text-muted flex-shrink-0">
                        {formatRelative(alarm.timestamp)}
                      </span>
                    </div>
                    <div className="text-[10px] text-text-secondary line-clamp-1">
                      {alarm.type.replace(/_/g, " ")} · {alarm.message.split(".")[0]}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span
                        className="inline-flex items-center gap-1 px-1 py-px text-[8px] font-mono uppercase tracking-[0.14em]"
                        style={{
                          color: agentColor.hex,
                          background: `${agentColor.hex}1a`,
                        }}
                      >
                        <span>{agent.glyph}</span>
                        {agent.shortName}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </Panel>
    </aside>
  );
}
