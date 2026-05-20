"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { PlantHeader } from "@/components/hud/PlantHeader";
import { AlertFeed } from "@/components/hud/AlertFeed";
import { UnifiedPortal } from "@/components/hud/UnifiedPortal";
import { DetailPanel } from "@/components/hud/DetailPanel";
import { BuildPalette } from "@/components/hud/BuildPalette";
import { BottomHUD } from "@/components/hud/BottomHUD";
import { startAlertStream, stopAlertStream } from "@/lib/mock/stream";
import { useWorldStore } from "@/lib/store/worldStore";
import { useLayoutStore } from "@/lib/store/layoutStore";

const WorldCanvas = dynamic(
  () => import("@/components/world/WorldCanvas").then((m) => m.WorldCanvas),
  { ssr: false },
);

export default function ControlCenter() {
  // Mount-gate to avoid SSR/CSR drift from Date.now() in mock data + clock.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    startAlertStream();
    return () => stopAlertStream();
  }, []);

  const selectedId = useWorldStore((s) => s.selectedDeviceId);
  const isBuildMode = useLayoutStore((s) => s.isBuildMode);

  if (!mounted) {
    return (
      <main className="relative w-screen h-screen overflow-hidden flex items-center justify-center">
        <div className="font-display text-[11px] uppercase tracking-[0.32em] text-text-muted animate-pulse">
          ◆ Initializing Control Center ◆
        </div>
      </main>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* World layer */}
      <div className="absolute inset-0">
        <WorldCanvas />
      </div>

      {/* HUD overlays */}
      <PlantHeader />
      {!isBuildMode && <AlertFeed />}
      <DetailPanel />
      <BuildPalette />
      <BottomHUD />
      <UnifiedPortal />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      {/* Hint when nothing selected */}
      {!selectedId && (
        <div className="absolute bottom-[195px] left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="font-mono text-[10px] text-text-muted tracking-[0.32em] uppercase">
            {isBuildMode
              ? "Build mode · pick a brush · click tiles to place · B to exit"
              : "Click a structure · drag to pan · scroll to zoom · B for build"}
          </div>
        </div>
      )}
    </main>
  );
}
