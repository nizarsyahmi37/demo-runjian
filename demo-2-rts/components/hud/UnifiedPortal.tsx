"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Send, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { AGENTS } from "@/lib/mock/agents";
import { AGENT_COLORS } from "@/lib/theme/colors";

const SUGGESTIONS = [
  "Why is Array A3 underperforming this week?",
  "Dispatch a crew to inverter COM1-5",
  "Summarize today's safety events",
  "Forecast generation for tomorrow",
];

const MOCK_RESPONSE = [
  { agent: "supervisor", text: "Routing to specialists…" },
  { agent: "warning", text: "Detected a 23% output gap on Array A3 since 09:12. Trend is degrading at 1.8%/hr." },
  { agent: "diagnosis", text: "Root cause likely shading or surface soiling. Pattern matches 11 prior cases. Confidence 0.84." },
  { agent: "ticket", text: "Drafted WO-2026-0518 for field verification. Awaiting confirmation." },
];

export function UnifiedPortal() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-[200px] right-3 z-40 pointer-events-auto">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute bottom-14 right-0 w-96"
          >
            <div className="relative clip-hex-frame bg-gradient-to-b from-[#141a2a] to-[#0a0e1a] ring-1 ring-inset ring-[rgba(201,168,90,0.25)]"
              style={{ boxShadow: "0 12px 48px rgba(0, 0, 0, 0.6), 0 0 32px rgba(201,168,90,0.08)" }}
            >
              <div className="absolute top-0 left-3 right-3 h-[1px]"
                style={{ background: "linear-gradient(90deg, transparent, var(--color-gold-rim) 50%, transparent)" }}
              />
              <div className="px-4 py-3 border-b border-[var(--color-rule)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-gold-rim)]" />
                  <OrnateTitle size="sm">Unified Intelligence</OrnateTitle>
                </div>
                <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="px-4 py-3 space-y-2 max-h-72 overflow-y-auto scrollbar-dark">
                {MOCK_RESPONSE.map((line, i) => {
                  const isAgent = line.agent !== "supervisor";
                  const color = isAgent ? AGENT_COLORS[line.agent as keyof typeof AGENT_COLORS] : null;
                  const agent = isAgent ? AGENTS.find((a) => a.id === line.agent) : null;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.6, duration: 0.3 }}
                      className="flex gap-2.5"
                    >
                      <div
                        className="flex-shrink-0 w-6 h-6 clip-hex-frame-sm flex items-center justify-center font-display text-[11px] font-bold"
                        style={
                          color
                            ? {
                                background: `linear-gradient(135deg, ${color.hex}33 0%, #0a0e1a 70%)`,
                                color: color.hex,
                                border: `1px solid ${color.hex}66`,
                              }
                            : {
                                background: "#1b2238",
                                color: "var(--color-gold-rim)",
                                border: "1px solid var(--color-gold-deep)",
                              }
                        }
                      >
                        {agent?.glyph ?? "S"}
                      </div>
                      <div className="flex-1">
                        <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-text-muted mb-0.5">
                          {agent?.name ?? "Supervisor"}
                        </div>
                        <div className="text-[12px] text-text-primary leading-relaxed">{line.text}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="px-4 py-2 border-t border-[var(--color-rule)]">
                <div className="flex flex-wrap gap-1 mb-2">
                  {SUGGESTIONS.slice(0, 2).map((s) => (
                    <button
                      key={s}
                      className="text-[10px] px-2 py-1 bg-[#10162a] text-text-secondary hover:text-text-primary border border-[var(--color-border-soft)] clip-hex-frame-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    placeholder="Ask the team…"
                    className="flex-1 bg-[#070a14] border border-[var(--color-border-soft)] px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[var(--color-gold-rim)] clip-hex-frame-sm"
                  />
                  <button
                    className="w-9 h-9 flex items-center justify-center clip-hex-frame-sm bg-[#1b2238] hover:bg-[#26304a] text-[var(--color-gold-rim)]"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative h-12 px-4 flex items-center gap-2.5 clip-hex-frame",
          "bg-gradient-to-r from-[#1b2238] to-[#141a2a]",
          "ring-1 ring-inset ring-[rgba(201,168,90,0.3)]",
        )}
        style={{ boxShadow: "0 0 24px rgba(201,168,90,0.12)" }}
      >
        <MessageSquare className="w-4 h-4 text-[var(--color-gold-rim)]" />
        <span className="font-display text-[11px] uppercase tracking-[0.24em] text-text-primary">
          Unified Portal
        </span>
        <span className="font-mono text-[10px] text-text-muted bg-black/30 px-1.5 py-0.5 rounded-sm">⌘K</span>
      </motion.button>
    </div>
  );
}
