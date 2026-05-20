"use client";

import { PLANTS } from "@/lib/mock/plants";
import { useWorldStore } from "@/lib/store/worldStore";
import { useLayoutStore } from "@/lib/store/layoutStore";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { STATE_COLORS } from "@/lib/theme/colors";

/** Square minimap for the bottom-left of the screen.
 *  Shows the Malaysia plant network with the active plant pulsing. */
export function Minimap() {
  const activeId = useWorldStore((s) => s.activePlantId);
  const switchToPlant = useLayoutStore((s) => s.switchToPlant);
  const setActive = useWorldStore((s) => s.setActivePlant);

  // 160×160 square minimap viewport
  const W = 160;
  const H = 160;
  // Project lat/lng into a viewport centered on peninsular Malaysia
  // bounds: lat 1.0..6.5, lng 99.0..104.5
  const projectX = (lng: number) => ((lng - 99.0) / 5.5) * W;
  const projectY = (lat: number) => H - ((lat - 1.0) / 5.5) * H;

  return (
    <div className="relative h-full aspect-square">
      <div className="relative h-full clip-hex-frame bg-gradient-to-b from-[#141a2a] to-[#0a0e1a] ring-1 ring-inset ring-[rgba(20,184,166,0.25)]">
        <div
          className="absolute top-0 left-3 right-3 h-[1px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-agent-scheduling) 50%, transparent)",
          }}
        />
        <div className="flex items-center justify-between px-2.5 pt-1.5 pb-1 border-b border-[var(--color-rule)]">
          <OrnateTitle size="xs" accentColor="var(--color-agent-scheduling)">
            Tactical
          </OrnateTitle>
          <span className="font-mono text-[8px] text-text-muted">MY · 5</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-[calc(100%-26px)]">
          <defs>
            <radialGradient id="seaGlow2" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#0a1322" />
              <stop offset="100%" stopColor="#040810" />
            </radialGradient>
            <pattern id="grid2" width="14" height="14" patternUnits="userSpaceOnUse">
              <path d="M 14 0 L 0 0 0 14" fill="none" stroke="rgba(148,163,184,0.06)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#seaGlow2)" />
          <rect width={W} height={H} fill="url(#grid2)" />
          {/* Peninsular Malaysia silhouette — scaled to new viewport */}
          <path
            d="M 78 4 L 108 8 L 118 30 L 128 60 L 134 100 L 128 138 L 112 156 L 90 156 L 70 144 L 56 118 L 48 80 L 50 44 L 60 18 Z"
            fill="rgba(148,163,184,0.05)"
            stroke="rgba(148,163,184,0.18)"
            strokeWidth="0.7"
          />
          {PLANTS.map((p) => {
            const x = projectX(p.lng);
            const y = projectY(p.lat);
            const colorByStatus =
              p.status === "alarm"
                ? STATE_COLORS.faulted.hex
                : p.status === "warning"
                  ? STATE_COLORS.degraded.hex
                  : STATE_COLORS.healthy.hex;
            const isActive = p.id === activeId;
            return (
              <g
                key={p.id}
                onClick={() => {
                  setActive(p.id);
                  switchToPlant(p.id);
                }}
                style={{ cursor: "pointer" }}
              >
                {isActive && (
                  <circle cx={x} cy={y} r={8} fill="none" stroke={colorByStatus} strokeWidth={0.8} opacity={0.6}>
                    <animate attributeName="r" values="6;16;6" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={x} cy={y} r={isActive ? 3.5 : 2.4} fill={colorByStatus} />
                <text
                  x={x + 5}
                  y={y + 2}
                  fill="#5b6680"
                  fontSize="6"
                  fontFamily="ui-monospace, monospace"
                >
                  {p.region.slice(0, 3).toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
