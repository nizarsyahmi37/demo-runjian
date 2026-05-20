"use client";

import { Minimap } from "./Minimap";
import { AgentSkillBar } from "./AgentSkillBar";
import { CommandTray } from "./CommandTray";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { Panel } from "@/components/primitives/Panel";
import { useAgentStore } from "@/lib/store/agentStore";

/** DOTA-style bottom HUD strip: Minimap (left) + Agent skill bar (center) +
 *  Command tray (right). */
export function BottomHUD() {
  const statuses = useAgentStore((s) => s.statuses);
  const activeCount = Object.values(statuses).filter((s) => s !== "idle").length;

  return (
    <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-none">
      <div className="flex items-stretch gap-3 h-44 pointer-events-auto">
        {/* Minimap (square) */}
        <Minimap />

        {/* Agent skill bar — centered, takes remaining width */}
        <div className="flex-1 min-w-0">
          <Panel className="h-full" accentColor="var(--color-gold-rim)" glowColor="var(--color-gold-glow)" ribSide="top">
            <div className="flex flex-col h-full px-2 py-1.5">
              <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[var(--color-rule)]">
                <OrnateTitle size="xs">Agent Skill Panel</OrnateTitle>
                <div className="flex items-center gap-2 font-mono text-[9px] text-text-muted">
                  <span>
                    {activeCount > 0 ? (
                      <span className="text-amber-400">{activeCount} active</span>
                    ) : (
                      <span>10 idle</span>
                    )}
                  </span>
                  <span className="text-text-dim">·</span>
                  <span>1·9·0 to invoke</span>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <AgentSkillBar />
              </div>
            </div>
          </Panel>
        </div>

        {/* Command tray + portal stacked on the right */}
        <div className="w-[280px] flex-shrink-0">
          <CommandTray />
        </div>
      </div>
    </div>
  );
}
