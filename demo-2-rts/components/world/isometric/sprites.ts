/**
 * PixiJS Graphics drawing helpers for isometric tiles and structures.
 *
 * The 3-face box pattern (top/left/right) comes from amilich/isometric-city —
 * gives every solid the right depth perception without sprites.
 */

import { Graphics } from "pixi.js";
import { TILE_W, TILE_H } from "./tileMath";
import { GROUND_DEFS, STRUCTURE_DEFS, type GroundKind, type StructureKind, type FaceColors } from "./tileKinds";

/** Draws a flat diamond tile centered at origin, suitable for ground. */
export function drawGroundTile(g: Graphics, kind: GroundKind, w = TILE_W, h = TILE_H) {
  const def = GROUND_DEFS[kind];
  g.poly([0, -h / 2, w / 2, 0, 0, h / 2, -w / 2, 0]).fill({ color: def.color });

  if (def.edge != null) {
    g.poly([0, -h / 2, w / 2, 0, 0, h / 2, -w / 2, 0]).stroke({
      color: def.edge,
      width: 0.5,
      alpha: 0.7,
    });
  }

  // Cheap noise: small dots scattered for textured kinds
  if (def.noiseAmount && def.noiseAmount > 0) {
    const count = Math.floor(def.noiseAmount * 14);
    for (let i = 0; i < count; i++) {
      // Pseudo-random but stable per-tile: use hash of i + kind name
      const seed = hashStr(kind) + i * 17;
      const rx = (frac(seed * 0.137) - 0.5) * (w * 0.7);
      const ry = (frac(seed * 0.293) - 0.5) * (h * 0.7);
      const inside = Math.abs(rx) / (w / 2) + Math.abs(ry) / (h / 2) < 0.85;
      if (!inside) continue;
      g.circle(rx, ry, 0.6).fill({ color: 0x000000, alpha: 0.35 });
    }
  }

  // Water shimmer
  if (kind === "water") {
    g.moveTo(-w / 4, -2).lineTo(w / 4, -2).stroke({ color: 0x4f9cff, width: 0.5, alpha: 0.3 });
    g.moveTo(-w / 4, 4).lineTo(w / 4, 4).stroke({ color: 0x4f9cff, width: 0.5, alpha: 0.2 });
  }

  // Asphalt centerline (when used as road)
  if (kind === "asphalt") {
    g.moveTo(-w / 6, 0).lineTo(w / 6, 0).stroke({ color: 0xc9a85a, width: 0.6, alpha: 0.5 });
  }
}

/** The 4 corners of a w×h footprint diamond, relative to the footprint centroid.
 *
 *  In iso projection with TILE_W:TILE_H = 2:1, a w×h footprint covers a diamond
 *  whose corners sit at the outer edges of the corner tiles:
 *    - top    = (-(w-h)*W/4, -(w+h)*H/4)   ← upper vertex (north)
 *    - right  = ( (w+h)*W/4,  (w-h)*H/4)   ← right vertex (east)
 *    - bottom = ( (w-h)*W/4,  (w+h)*H/4)   ← lower vertex (south)
 *    - left   = (-(w+h)*W/4, -(w-h)*H/4)   ← left vertex (west)
 *
 *  For 1×1 this collapses to the familiar single-tile diamond.
 *  For asymmetric footprints (e.g. 4×1), the diamond is elongated along the
 *  long axis and skewed in iso-space — which is exactly the cell coverage.
 */
export function footprintDiamond(footprintW: number, footprintH: number) {
  const E = ((footprintW + footprintH) * TILE_W) / 4;
  const N = ((footprintW + footprintH) * TILE_H) / 4;
  const skewX = ((footprintW - footprintH) * TILE_W) / 4;
  const skewY = ((footprintW - footprintH) * TILE_H) / 4;
  return {
    top:    { x: -skewX, y: -N },
    right:  { x:  E,     y:  skewY },
    bottom: { x:  skewX, y:  N },
    left:   { x: -E,     y: -skewY },
  };
}

/** Draws a 3-face isometric box (top + left + right) of given footprint and height.
 *  Footprint w/h are in tile units; height is in tile units (TILE_H pixels each). */
export function drawBox3Face(
  g: Graphics,
  footprintW: number,
  footprintH: number,
  heightTiles: number,
  faces: FaceColors,
  accent?: number,
) {
  const { top, right, bottom, left } = footprintDiamond(footprintW, footprintH);
  const h = heightTiles * TILE_H;

  // Left face (darker)
  g.poly([left.x, left.y, bottom.x, bottom.y, bottom.x, bottom.y - h, left.x, left.y - h])
    .fill({ color: faces.left });
  // Right face (lighter)
  g.poly([bottom.x, bottom.y, right.x, right.y, right.x, right.y - h, bottom.x, bottom.y - h])
    .fill({ color: faces.right });
  // Top face (the actual top diamond, lifted by h)
  g.poly([top.x, top.y - h, right.x, right.y - h, bottom.x, bottom.y - h, left.x, left.y - h])
    .fill({ color: faces.top });

  // Subtle edges around the top diamond
  g.poly([top.x, top.y - h, right.x, right.y - h, bottom.x, bottom.y - h, left.x, left.y - h])
    .stroke({ color: 0x000000, width: 0.5, alpha: 0.45 });

  // Vertical edges at the three visible corners (front, right-front, left-front)
  g.moveTo(bottom.x, bottom.y).lineTo(bottom.x, bottom.y - h).stroke({ color: 0x000000, width: 0.5, alpha: 0.45 });
  g.moveTo(left.x, left.y).lineTo(left.x, left.y - h).stroke({ color: 0x000000, width: 0.5, alpha: 0.35 });
  g.moveTo(right.x, right.y).lineTo(right.x, right.y - h).stroke({ color: 0x000000, width: 0.5, alpha: 0.35 });

  // Accent stripe along the back edges of the top face
  if (accent != null) {
    g.moveTo(left.x + 2, left.y - h + 1).lineTo(top.x, top.y - h + 1)
      .stroke({ color: accent, width: 1, alpha: 0.85 });
    g.moveTo(top.x, top.y - h + 1).lineTo(right.x - 2, right.y - h + 1)
      .stroke({ color: accent, width: 1, alpha: 0.85 });
  }
}

/** Panel array — tilted glass surface lying within the footprint diamond.
 *
 *  The top face is the cell-coverage diamond, lifted slightly and with its
 *  "back" edges (toward top/north) lifted higher to imply tilt.
 *  All ink stays inside the cell footprint so clicks map back correctly.
 */
export function drawPanelArray(g: Graphics, footprintW: number, footprintH: number, accent: number) {
  const { top, right, bottom, left } = footprintDiamond(footprintW, footprintH);

  const baseLift = 3;   // panel sits this far off the ground
  const tiltLift = 11;  // additional lift at the back (top) corner

  // Ground shadow — slightly larger diamond, low alpha
  g.poly([
    left.x - 2, left.y,
    top.x, top.y - 2,
    right.x + 2, right.y,
    bottom.x, bottom.y + 2,
  ]).fill({ color: 0x000000, alpha: 0.35 });

  // Slab body — the dark frame under the glass (drawn as a 3-face mini box)
  const frameH = 4;
  g.poly([
    left.x, left.y - baseLift,
    bottom.x, bottom.y - baseLift,
    bottom.x, bottom.y - baseLift - frameH,
    left.x, left.y - baseLift - frameH,
  ]).fill({ color: 0x0a1322 });
  g.poly([
    bottom.x, bottom.y - baseLift,
    right.x, right.y - baseLift,
    right.x, right.y - baseLift - frameH,
    bottom.x, bottom.y - baseLift - frameH,
  ]).fill({ color: 0x142848 });

  // Tilted glass top — same diamond shape, with top corner lifted further.
  const tL = { x: left.x,   y: left.y   - baseLift - frameH - tiltLift * 0.4 };
  const tT = { x: top.x,    y: top.y    - baseLift - frameH - tiltLift };
  const tR = { x: right.x,  y: right.y  - baseLift - frameH - tiltLift * 0.4 };
  const tB = { x: bottom.x, y: bottom.y - baseLift - frameH };

  g.poly([tT.x, tT.y, tR.x, tR.y, tB.x, tB.y, tL.x, tL.y])
    .fill({ color: 0x1a3360 })
    .stroke({ color: accent, width: 0.8, alpha: 0.85 });

  // Solar-cell grid lines along the long axis
  const cellsAcross = Math.max(footprintW, footprintH) * 3;
  for (let i = 1; i < cellsAcross; i++) {
    const t = i / cellsAcross;
    // Lines from top-side edge (tL→tT for i<0.5 or tT→tR for i>0.5)
    // Simpler: interpolate between bottom edge (tB→tR) and top edge (tL→tT)?
    // Use the long axis: for w>=h, draw lines from left side to right side
    if (footprintW >= footprintH) {
      // Lines perpendicular to the long axis: from tL→tT edge to tB→tR edge
      const a = { x: lerp(tL.x, tT.x, t), y: lerp(tL.y, tT.y, t) };
      const b = { x: lerp(tB.x, tR.x, t), y: lerp(tB.y, tR.y, t) };
      g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: 0x000000, width: 0.4, alpha: 0.4 });
    } else {
      // Vertical panel — lines from tT→tR to tL→tB
      const a = { x: lerp(tT.x, tR.x, t), y: lerp(tT.y, tR.y, t) };
      const b = { x: lerp(tL.x, tB.x, t), y: lerp(tL.y, tB.y, t) };
      g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: 0x000000, width: 0.4, alpha: 0.4 });
    }
  }
  // One cross-line for the short axis
  {
    const a = { x: lerp(tL.x, tB.x, 0.5), y: lerp(tL.y, tB.y, 0.5) };
    const b = { x: lerp(tT.x, tR.x, 0.5), y: lerp(tT.y, tR.y, 0.5) };
    g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: 0x000000, width: 0.3, alpha: 0.3 });
  }

  // Sun glint near the top edge
  g.moveTo(lerp(tL.x, tT.x, 0.4), lerp(tL.y, tT.y, 0.4))
    .lineTo(lerp(tT.x, tR.x, 0.6), lerp(tT.y, tR.y, 0.6))
    .stroke({ color: 0xffffff, width: 0.7, alpha: 0.22 });
}

/** Met tower — thin mast with sensor head + anemometer arms. */
export function drawTower(g: Graphics, accent: number) {
  // Concrete base
  g.poly([-8, 0, 0, 4, 8, 0, 0, -4]).fill({ color: 0x3a4256 });
  g.poly([-8, 0, 0, 4, 8, 0, 0, -4]).stroke({ color: 0x000000, width: 0.4, alpha: 0.5 });

  // Mast
  g.rect(-1.5, -64, 3, 64).fill({ color: 0x2a3142 });
  g.rect(-1.5, -64, 1, 64).fill({ color: 0x4a5066 });

  // Cross arms (anemometer)
  g.moveTo(-10, -60).lineTo(10, -60).stroke({ color: 0x4a5066, width: 1 });
  g.circle(-10, -60, 1.5).fill({ color: accent });
  g.circle(10, -60, 1.5).fill({ color: accent });

  // Sensor head
  g.rect(-6, -54, 12, 4).fill({ color: 0x3a4458 });
  g.rect(-6, -54, 12, 1).fill({ color: accent });
  g.circle(0, -50, 2).fill({ color: 0x000000, alpha: 0.8 }).stroke({ color: accent, width: 0.6 });

  // Top antenna
  g.moveTo(0, -64).lineTo(0, -72).stroke({ color: accent, width: 0.8 });
  g.circle(0, -72, 1).fill({ color: accent });
}

/** Tree — round canopy on a small trunk, drawn with two ellipses for depth. */
export function drawTree(g: Graphics) {
  // Trunk
  g.rect(-1.5, -10, 3, 10).fill({ color: 0x3d2818 });
  // Canopy back (darker)
  g.ellipse(0, -20, 10, 12).fill({ color: 0x1f4a26 });
  // Canopy front (lighter)
  g.ellipse(2, -22, 8, 9).fill({ color: 0x2f6a3a });
  // Highlight
  g.ellipse(4, -24, 3, 3).fill({ color: 0x46894f, alpha: 0.8 });
}

/** Bollard — small cone marker. */
export function drawBollard(g: Graphics) {
  g.poly([-3, 0, 3, 0, 2, -8, -2, -8]).fill({ color: 0xc9a85a });
  g.rect(-2, -8, 4, 1).fill({ color: 0xddc07a });
}

/** Fence segment along the iso X axis. */
export function drawFence(g: Graphics, axis: "h" | "v") {
  const len = TILE_W * 0.42;
  const h = 8;
  if (axis === "h") {
    g.rect(-len / 2, -h, len, 1).fill({ color: 0x586071 });
    g.rect(-len / 2, -h, 1, h).fill({ color: 0x363c4d });
    g.rect(len / 2 - 1, -h, 1, h).fill({ color: 0x363c4d });
    g.moveTo(-len / 2 + len * 0.5, -h).lineTo(-len / 2 + len * 0.5, 0).stroke({ color: 0x363c4d, width: 0.5 });
  } else {
    g.rect(-1, -h, 1, h).fill({ color: 0x586071 });
    g.rect(-len / 2, -h / 2, len, 0.6).fill({ color: 0x4a5066 });
  }
}

/** Light pole with glowing tip. */
export function drawLightPole(g: Graphics, accent: number) {
  g.rect(-1, -44, 2, 44).fill({ color: 0x586071 });
  // Arm
  g.moveTo(0, -40).lineTo(8, -42).stroke({ color: 0x586071, width: 1.5 });
  // Lamp
  g.circle(8, -42, 2).fill({ color: accent }).stroke({ color: 0x000000, width: 0.3 });
  // Glow
  g.circle(8, -42, 5).fill({ color: accent, alpha: 0.2 });
}

/** Single-tile hover diamond — used when no multi-tile brush is active. */
export function drawHoverDiamond(g: Graphics, color = 0xc9a85a, w = TILE_W, h = TILE_H) {
  g.poly([0, -h / 2, w / 2, 0, 0, h / 2, -w / 2, 0])
    .stroke({ color, width: 1.5, alpha: 0.95 })
    .fill({ color, alpha: 0.12 });
}

/** Outline a w×h footprint diamond (centered on origin), used as a build-mode
 *  cursor for multi-tile brushes. */
export function drawFootprintOutline(g: Graphics, footprintW: number, footprintH: number, color = 0xc9a85a, alpha = 0.18) {
  const { top, right, bottom, left } = footprintDiamond(footprintW, footprintH);
  g.poly([top.x, top.y, right.x, right.y, bottom.x, bottom.y, left.x, left.y])
    .fill({ color, alpha })
    .stroke({ color, width: 1.5, alpha: 0.95 });
}

/** Structure dispatch — given a kind, draw it into Graphics. */
export function drawStructure(g: Graphics, kind: StructureKind, accentOverride?: number) {
  const def = STRUCTURE_DEFS[kind];
  const accent = accentOverride ?? def.accent ?? 0xffffff;

  switch (kind) {
    case "panel_array_ns":
      drawPanelArray(g, def.footprint.w, def.footprint.h, accent);
      return;
    case "panel_array_ew":
      drawPanelArray(g, def.footprint.w, def.footprint.h, accent);
      return;
    case "tower":
      drawTower(g, accent);
      return;
    case "tree":
      drawTree(g);
      return;
    case "bollard":
      drawBollard(g);
      return;
    case "fence_h":
      drawFence(g, "h");
      return;
    case "fence_v":
      drawFence(g, "v");
      return;
    case "light_pole":
      drawLightPole(g, accent);
      return;
    default:
      drawBox3Face(g, def.footprint.w, def.footprint.h, def.height, def.faces, def.accent);
      // Add type-specific embellishments
      addStructureDetail(g, kind, def.footprint.w, def.footprint.h, def.height);
  }
}

function addStructureDetail(
  g: Graphics,
  kind: StructureKind,
  fw: number,
  fh: number,
  hTiles: number,
) {
  const h = hTiles * TILE_H;
  const { top, right, bottom, left } = footprintDiamond(fw, fh);
  // Center of the top face (lifted by h)
  const topY = -h;

  switch (kind) {
    case "inverter": {
      // Vents on right face — runs along the right-front diagonal
      for (let i = 0; i < 3; i++) {
        const t = 0.18 + i * 0.16;
        const x1 = lerp(bottom.x, right.x, t);
        const y1 = lerp(bottom.y, right.y, t) - h + 4;
        const x2 = lerp(bottom.x, right.x, t + 0.1);
        const y2 = lerp(bottom.y, right.y, t + 0.1) - h + 4;
        g.moveTo(x1, y1).lineTo(x2, y2).stroke({ color: 0x000000, width: 1.4, alpha: 0.6 });
      }
      // Display panel near the left-front edge
      const dispX = lerp(left.x, bottom.x, 0.55);
      const dispY = lerp(left.y, bottom.y, 0.55) - h * 0.7;
      g.rect(dispX - 5, dispY, 10, 3).fill({ color: 0x000000, alpha: 0.7 });
      g.rect(dispX - 4, dispY + 0.5, 5, 2).fill({ color: 0x34d399, alpha: 0.7 });
      return;
    }
    case "transformer": {
      for (let i = -1; i <= 1; i++) {
        g.circle(i * 5, topY - 2, 1.5).fill({ color: 0xeab308 });
        g.moveTo(i * 5, topY - 2).lineTo(i * 5, topY - 8).stroke({ color: 0xeab308, width: 0.7 });
      }
      return;
    }
    case "meter": {
      g.rect(-6, topY + 2, 12, 4).fill({ color: 0x000000, alpha: 0.6 });
      g.rect(-5, topY + 3, 5, 2).fill({ color: 0x3b82f6, alpha: 0.7 });
      return;
    }
    case "depot": {
      // Pitched roof ridge between left-back and right-back edges
      g.moveTo(top.x, topY - 6).lineTo(left.x, topY + 1).stroke({ color: 0xd97706, width: 1, alpha: 0.6 });
      g.moveTo(top.x, topY - 6).lineTo(right.x, topY + 1).stroke({ color: 0xd97706, width: 1, alpha: 0.6 });
      // Door on the front (bottom) face — small dark rectangle
      const dx = lerp(bottom.x, right.x, 0.25);
      const dy = lerp(bottom.y, right.y, 0.25);
      g.poly([dx - 3, dy, dx + 3, dy, dx + 3, dy - h * 0.45, dx - 3, dy - h * 0.45])
        .fill({ color: 0x2a2218, alpha: 0.85 });
      return;
    }
    case "combiner": {
      g.rect(-4, topY + 2, 8, 3).fill({ color: 0x000000, alpha: 0.6 });
      return;
    }
    case "battery": {
      // Stripe of cells across the top face — fit within the top diamond
      // For 2x1: top diamond half-width ≈ (w+h)*W/4 = 48; place cells along the long axis
      const cellCount = Math.max(fw, fh) * 2 + 1;
      for (let i = 0; i < cellCount; i++) {
        const t = (i + 0.5) / cellCount;
        const cx = lerp(left.x, right.x, t);
        const cy = lerp(left.y, right.y, t);
        g.rect(cx - 2, cy + topY - 2, 4, 5).fill({ color: 0xa855f7, alpha: 0.5 });
      }
      return;
    }
  }
}

// ────────────────────────── helpers ──────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function frac(n: number) {
  return n - Math.floor(n);
}
