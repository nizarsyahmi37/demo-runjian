"use client";

import { useMemo, useRef, type MouseEvent } from "react";
import { useWorldStore } from "@/lib/store/worldStore";
import { useLayoutStore } from "@/lib/store/layoutStore";
import { PLANT_BY_ID } from "@/lib/mock/plants";
import {
  STRUCTURE_DEFS,
  GROUND_DEFS,
  type StructureKind,
  type GroundKind,
} from "@/components/world/isometric/tileKinds";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";

/**
 * Sector minimap — top-down iso projection of the CURRENT plant's layout.
 * Each structure renders as a small filled diamond in its kind colour.
 * The buildable ground (concrete pad, asphalt road, water, sand) renders as
 * a low-contrast background so the user can read the plant footprint at a
 * glance. Click anywhere on the minimap to pan the main camera to that cell.
 */
export function Minimap() {
  const activeId = useWorldStore((s) => s.activePlantId);
  const panToCell = useWorldStore((s) => s.panToCell);
  const cameraView = useWorldStore((s) => s.cameraView);
  const structures = useLayoutStore((s) => s.layout.structures);
  const tiles = useLayoutStore((s) => s.layout.tiles);
  const svgRef = useRef<SVGSVGElement>(null);

  const active = PLANT_BY_ID[activeId];

  const { viewBox, projectCell, invertProject, tileSize } = useMemo(() => {
    // Find the bbox of structures + explicit ground tiles to set the viewport
    let minC = Infinity, maxC = -Infinity, minR = Infinity, maxR = -Infinity;
    for (const s of structures) {
      const def = STRUCTURE_DEFS[s.kind];
      if (s.col < minC) minC = s.col;
      if (s.row < minR) minR = s.row;
      if (s.col + def.footprint.w - 1 > maxC) maxC = s.col + def.footprint.w - 1;
      if (s.row + def.footprint.h - 1 > maxR) maxR = s.row + def.footprint.h - 1;
    }
    for (const key of tiles.keys()) {
      const [cs, rs] = key.split(",");
      const c = Number(cs);
      const r = Number(rs);
      if (c < minC) minC = c;
      if (r < minR) minR = r;
      if (c > maxC) maxC = c;
      if (r > maxR) maxR = r;
    }
    if (!isFinite(minC)) {
      minC = 0; minR = 0; maxC = 16; maxR = 16;
    }
    // Expand bbox to include the live camera viewport so the rectangle is
    // always visible even when the user pans far away.
    if (cameraView) {
      if (cameraView.minCol < minC) minC = cameraView.minCol;
      if (cameraView.minRow < minR) minR = cameraView.minRow;
      if (cameraView.maxCol > maxC) maxC = cameraView.maxCol;
      if (cameraView.maxRow > maxR) maxR = cameraView.maxRow;
    }
    // Pad bbox a bit so structures don't sit on the very edge
    const padCells = 3;
    minC -= padCells; minR -= padCells; maxC += padCells; maxR += padCells;

    // Iso projection (top-down) with TILE_W=4, TILE_H=2 (small minimap units)
    const TW = 4;
    const TH = 2;
    const project = (col: number, row: number) => ({
      x: (col - row) * (TW / 2),
      y: (col + row) * (TH / 2),
    });
    // Compute projected bbox
    const corners = [
      project(minC, minR),
      project(maxC, minR),
      project(maxC, maxR),
      project(minC, maxR),
    ];
    const minX = Math.min(...corners.map((p) => p.x)) - TW / 2;
    const maxX = Math.max(...corners.map((p) => p.x)) + TW / 2;
    const minY = Math.min(...corners.map((p) => p.y)) - TH / 2;
    const maxY = Math.max(...corners.map((p) => p.y)) + TH / 2;
    const bbW = maxX - minX;
    const bbH = maxY - minY;

    return {
      viewBox: `${minX} ${minY} ${bbW} ${bbH}`,
      projectCell: project,
      invertProject: (px: number, py: number) => ({
        col: Math.round(px / TW + py / TH),
        row: Math.round(py / TH - px / TW),
      }),
      tileSize: { w: TW, h: TH },
    };
  }, [structures, tiles, cameraView]);

  // Viewport rectangle (4 iso-projected corners of the visible cell rect)
  const viewportPolygon = useMemo(() => {
    if (!cameraView) return null;
    const { minCol, maxCol, minRow, maxRow } = cameraView;
    const corners = [
      projectCell(minCol, minRow),
      projectCell(maxCol, minRow),
      projectCell(maxCol, maxRow),
      projectCell(minCol, maxRow),
    ];
    return corners.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  }, [cameraView, projectCell]);

  // Pre-compute ground tile diamonds (only explicit ones — default grass left transparent)
  const groundCells = useMemo(() => {
    const out: { key: string; x: number; y: number; color: string }[] = [];
    for (const [key, tile] of tiles) {
      const [cs, rs] = key.split(",");
      const c = Number(cs);
      const r = Number(rs);
      const p = projectCell(c, r);
      out.push({ key, x: p.x, y: p.y, color: GROUND_DEFS[tile.ground as GroundKind].swatch });
    }
    return out;
  }, [tiles, projectCell]);

  const handleClick = (e: MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    const cell = invertProject(local.x, local.y);
    panToCell(cell.col, cell.row);
  };

  const totalStructures = structures.length;

  return (
    <div className="relative h-full aspect-square">
      <div className="relative h-full clip-hex-frame bg-gradient-to-b from-[#0c1322] to-[#06090f] ring-1 ring-inset ring-[rgba(20,184,166,0.25)]">
        <div
          className="absolute top-0 left-3 right-3 h-[1px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-agent-scheduling) 50%, transparent)",
          }}
        />
        <div className="flex items-center justify-between px-2.5 pt-1.5 pb-1 border-b border-[var(--color-rule)]">
          <OrnateTitle size="xs" accentColor="var(--color-agent-scheduling)">
            Sector Map
          </OrnateTitle>
          <span className="font-mono text-[8px] text-text-muted truncate max-w-[80px]" title={active?.name}>
            {active?.region.slice(0, 3).toUpperCase() ?? "—"} · {totalStructures}
          </span>
        </div>
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="block w-full h-[calc(100%-26px)] cursor-crosshair"
          onClick={handleClick}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="mm-grid" width="4" height="2" patternUnits="userSpaceOnUse">
              <rect width="4" height="2" fill="transparent" />
              <circle cx="0" cy="0" r="0.2" fill="rgba(148,163,184,0.18)" />
            </pattern>
          </defs>

          {/* Background grid */}
          <rect
            x={-9999}
            y={-9999}
            width={19998}
            height={19998}
            fill="url(#mm-grid)"
            opacity={0.35}
          />

          {/* Explicit ground tiles (pad/asphalt/water/sand) */}
          {groundCells.map((g) => (
            <polygon
              key={g.key}
              points={diamondPoints(g.x, g.y, tileSize.w, tileSize.h)}
              fill={g.color}
              opacity={0.6}
            />
          ))}

          {/* Structures */}
          {structures.map((s) => {
            const def = STRUCTURE_DEFS[s.kind as StructureKind];
            // Take the centroid of the footprint
            const centerC = s.col + (def.footprint.w - 1) / 2;
            const centerR = s.row + (def.footprint.h - 1) / 2;
            const p = projectCell(centerC, centerR);
            const size = footprintScreenSize(def.footprint.w, def.footprint.h, tileSize.w, tileSize.h);
            return (
              <polygon
                key={s.id}
                points={diamondPoints(p.x, p.y, size.w, size.h)}
                fill={def.swatch}
                stroke="rgba(0,0,0,0.55)"
                strokeWidth={0.15}
              />
            );
          })}

          {/* Live viewport rectangle — what the main camera is looking at */}
          {viewportPolygon && (
            <polygon
              points={viewportPolygon}
              fill="rgba(201,168,90,0.06)"
              stroke="#c9a85a"
              strokeWidth={0.7}
              strokeDasharray="1.5 1"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          )}
        </svg>

        {/* Footer */}
        <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between font-mono text-[8px] text-text-muted">
          <span>click to pan</span>
          <span className="text-emerald-400">● live</span>
        </div>
      </div>
    </div>
  );
}

function diamondPoints(cx: number, cy: number, w: number, h: number): string {
  return `${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}`;
}

function footprintScreenSize(w: number, h: number, tw: number, th: number) {
  // Iso footprint becomes a diamond of (w+h)*tw/2 wide × (w+h)*th/2 tall
  return { w: (w + h) * (tw / 2), h: (w + h) * (th / 2) };
}
