"use client";

import { useEffect, useRef } from "react";
import { Application, Container, Graphics, FederatedPointerEvent, Text, TextStyle } from "pixi.js";
import gsap from "gsap";
import { TILE_W, TILE_H, cellToScreen } from "./isometric/tileMath";
import { drawGroundTile, drawStructure, drawHoverDiamond, drawFootprintOutline } from "./isometric/sprites";
import { STRUCTURE_DEFS } from "./isometric/tileKinds";
import { useWorldStore } from "@/lib/store/worldStore";
import { useAlertStore } from "@/lib/store/alertStore";
import { useLayoutStore, findStructureAt, getGroundAt, type Structure } from "@/lib/store/layoutStore";
import { DEVICE_BY_ID, type DeviceState } from "@/lib/mock/devices";
import { SEVERITY_COLORS } from "@/lib/theme/colors";

const STATE_TINT: Record<DeviceState, number | null> = {
  healthy: null,
  degraded: 0xf59e0b,
  faulted: 0xef4444,
  offline: 0x6b7280,
};

/** Cap on the number of ground tiles rendered at once. Keeps perf bounded
 *  even if the user zooms way out. */
const MAX_TILES = 4000;

type StructureGfx = {
  structure: Structure;
  container: Container;
  body: Graphics;
  glow: Graphics;
};

export function WorldCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const groundLayerRef = useRef<Container | null>(null);
  const structuresLayerRef = useRef<Container | null>(null);
  const hoverLayerRef = useRef<Container | null>(null);
  const ghostRef = useRef<Container | null>(null);
  const hoverDiamondRef = useRef<Graphics | null>(null);
  const structuresMapRef = useRef<Map<string, StructureGfx>>(new Map());
  // Ground tile graphics cache for re-tinting
  const groundMapRef = useRef<Map<string, Graphics>>(new Map());

  // Pixi bootstrap
  useEffect(() => {
    let cancelled = false;
    let initializedApp: Application | null = null;
    let resizeHandler: (() => void) | null = null;
    const host = hostRef.current;
    if (!host) return;

    (async () => {
      const app = new Application();
      try {
        await app.init({
          background: 0x07090f,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          resizeTo: host,
        });
      } catch {
        return;
      }
      if (cancelled) {
        try { app.destroy(true, { children: true, texture: true }); } catch { /* */ }
        return;
      }
      initializedApp = app;
      appRef.current = app;
      host.appendChild(app.canvas);

      const world = new Container();
      world.sortableChildren = true;
      worldRef.current = world;
      app.stage.addChild(world);

      const ground = new Container();
      ground.sortableChildren = false;
      ground.zIndex = 0;
      world.addChild(ground);
      groundLayerRef.current = ground;

      const structures = new Container();
      structures.sortableChildren = true;
      structures.zIndex = 10;
      world.addChild(structures);
      structuresLayerRef.current = structures;

      const hover = new Container();
      hover.sortableChildren = true;
      hover.zIndex = 50;
      world.addChild(hover);
      hoverLayerRef.current = hover;

      // Ambient: sun arc + drifting clouds
      addAmbientFX(world);

      // Center the camera FIRST so updateVisibleGround sees the correct viewport
      centerWorld();
      rebuildStructures();
      rebuildGround();

      attachInteractions(app, world);

      resizeHandler = () => centerWorld();
      window.addEventListener("resize", resizeHandler);
    })();

    return () => {
      cancelled = true;
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        resizeHandler = null;
      }
      if (initializedApp) {
        try { initializedApp.destroy(true, { children: true, texture: true }); } catch { /* */ }
        initializedApp = null;
        appRef.current = null;
      }
      structuresMapRef.current.clear();
      groundMapRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render ground when layout.tiles changes, recenter when plant switches
  useEffect(() => {
    const unsub = useLayoutStore.subscribe((s, prev) => {
      const plantChanged = s.currentPlantId !== prev.currentPlantId;
      if (plantChanged) {
        centerWorld();
      }
      if (s.layout.tiles !== prev.layout.tiles || plantChanged) {
        rebuildGround();
      }
      if (s.layout.structures !== prev.layout.structures || plantChanged) {
        rebuildStructures();
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-tint structures whose linked device state changed
  useEffect(() => {
    const unsub = useWorldStore.subscribe((s, prev) => {
      if (s.deviceStates === prev.deviceStates) return;
      for (const gfx of structuresMapRef.current.values()) {
        const deviceId = gfx.structure.deviceId;
        if (!deviceId) continue;
        const newState = s.deviceStates[deviceId];
        const oldState = prev.deviceStates[deviceId];
        if (newState === oldState) continue;
        applyDeviceStateTint(gfx, newState);
      }
    });
    return unsub;
  }, []);

  // Spawn alert pulse on new alarms
  useEffect(() => {
    const seen = new Set<string>();
    useAlertStore.getState().alarms.forEach((a) => seen.add(a.id));
    const unsub = useAlertStore.subscribe((s) => {
      for (const alarm of s.alarms) {
        if (seen.has(alarm.id)) continue;
        seen.add(alarm.id);
        // Find structure linked to that device
        for (const gfx of structuresMapRef.current.values()) {
          if (gfx.structure.deviceId === alarm.deviceId) {
            spawnAlertPulse(gfx, SEVERITY_COLORS[alarm.severity]);
            break;
          }
        }
      }
    });
    return unsub;
  }, []);

  // Build-mode UI: show ghost preview at hover
  useEffect(() => {
    const unsub = useLayoutStore.subscribe((s, prev) => {
      if (s.hoverCell !== prev.hoverCell || s.brush !== prev.brush || s.isBuildMode !== prev.isBuildMode) {
        updateGhost(s.hoverCell, s.brush, s.isBuildMode);
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} className="absolute inset-0 world-scanlines" />;

  // ─────────────────────── internals ───────────────────────

  /** Compute the cell range currently visible in the viewport, with a margin. */
  function getVisibleCellRange(): { minCol: number; maxCol: number; minRow: number; maxRow: number } | null {
    const app = appRef.current;
    const world = worldRef.current;
    if (!app || !world) return null;
    const sw = app.screen.width;
    const sh = app.screen.height;
    // Screen corners → world local coords
    const corners = [
      { x: -world.x, y: -world.y },
      { x: sw - world.x, y: -world.y },
      { x: -world.x, y: sh - world.y },
      { x: sw - world.x, y: sh - world.y },
    ].map(({ x, y }) => ({ x: x / world.scale.x, y: y / world.scale.y }));
    const cells = corners.map((p) => pickCellAt(p.x, p.y));
    const cols = cells.map((c) => c.col);
    const rows = cells.map((c) => c.row);
    const pad = 2;
    return {
      minCol: Math.min(...cols) - pad,
      maxCol: Math.max(...cols) + pad,
      minRow: Math.min(...rows) - pad,
      maxRow: Math.max(...rows) + pad,
    };
  }

  /** Viewport-culled ground render. Adds tiles that came into view, removes
   *  tiles that left. Default ground for any unset cell is grass. */
  function updateVisibleGround() {
    const layer = groundLayerRef.current;
    if (!layer) return;
    const range = getVisibleCellRange();
    if (!range) return;

    const layout = useLayoutStore.getState().layout;
    const wanted = new Set<string>();
    const span = (range.maxCol - range.minCol + 1) * (range.maxRow - range.minRow + 1);
    // If zoomed way out, the visible range can explode — clamp by re-tightening
    // around the centre of the range.
    let { minCol, maxCol, minRow, maxRow } = range;
    if (span > MAX_TILES) {
      const cx = (minCol + maxCol) / 2;
      const cy = (minRow + maxRow) / 2;
      const side = Math.floor(Math.sqrt(MAX_TILES) / 2);
      minCol = Math.floor(cx - side); maxCol = Math.floor(cx + side);
      minRow = Math.floor(cy - side); maxRow = Math.floor(cy + side);
    }

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        wanted.add(`${c},${r}`);
      }
    }

    // Remove tiles that left the viewport
    for (const [key, g] of groundMapRef.current) {
      if (!wanted.has(key)) {
        layer.removeChild(g);
        g.destroy();
        groundMapRef.current.delete(key);
      }
    }
    // Add tiles that entered the viewport
    for (const key of wanted) {
      if (groundMapRef.current.has(key)) continue;
      const [cs, rs] = key.split(",");
      const c = Number(cs);
      const r = Number(rs);
      const ground = getGroundAt(layout, c, r);
      const g = new Graphics();
      drawGroundTile(g, ground);
      const p = cellToScreen({ col: c, row: r });
      g.x = p.x;
      g.y = p.y;
      layer.addChild(g);
      groundMapRef.current.set(key, g);
    }
  }

  /** Full rebuild (e.g. on plant switch or load) — wipes ground cache then
   *  re-runs visible-tile pass. */
  function rebuildGround() {
    const layer = groundLayerRef.current;
    if (!layer) return;
    for (const g of groundMapRef.current.values()) {
      layer.removeChild(g);
      g.destroy();
    }
    groundMapRef.current.clear();
    updateVisibleGround();
  }

  function rebuildStructures() {
    const layer = structuresLayerRef.current;
    if (!layer) return;
    // Remove existing and rebuild — simple & correct
    for (const gfx of structuresMapRef.current.values()) {
      layer.removeChild(gfx.container);
      gfx.container.destroy({ children: true });
    }
    structuresMapRef.current.clear();

    const { structures } = useLayoutStore.getState().layout;
    // Depth-sort by anchor cell sum
    const sorted = [...structures].sort(
      (a, b) =>
        (a.col + a.row) - (b.col + b.row) ||
        a.col - b.col,
    );

    for (const s of sorted) {
      const def = STRUCTURE_DEFS[s.kind];
      const container = new Container();
      // Place at the centroid of the footprint
      const anchorScreen = cellToScreen({ col: s.col, row: s.row });
      const farScreen = cellToScreen({ col: s.col + def.footprint.w - 1, row: s.row + def.footprint.h - 1 });
      container.x = (anchorScreen.x + farScreen.x) / 2;
      container.y = (anchorScreen.y + farScreen.y) / 2;
      container.zIndex = (s.col + s.row) * 100 + (s.col - s.row);

      const glow = new Graphics();
      glow.alpha = 0;
      container.addChild(glow);

      const body = new Graphics();
      drawStructure(body, s.kind);
      container.addChild(body);

      // Apply current device state tint if linked
      const stateMap = useWorldStore.getState().deviceStates;
      const deviceState = s.deviceId ? stateMap[s.deviceId] : null;

      // Tag label
      const tagText = s.tag ?? def.tagDefault;
      if (tagText) {
        const style = new TextStyle({
          fontFamily: "Share Tech Mono, ui-monospace, monospace",
          fontSize: 9,
          fill: 0x9aa6bf,
          letterSpacing: 1.2,
        });
        const txt = new Text({ text: tagText, style });
        txt.x = -txt.width / 2;
        txt.y = -def.height * TILE_H - 16;
        txt.alpha = 0.75;
        container.addChild(txt);
      }

      // No per-structure event handler — stage-level pointertap routes via hoverCell
      layer.addChild(container);
      const gfx: StructureGfx = { structure: s, container, body, glow };
      structuresMapRef.current.set(s.id, gfx);
      if (deviceState && deviceState !== "healthy") {
        applyDeviceStateTint(gfx, deviceState);
      }
    }
  }

  /** Unified click handler — called for any tap on the world.
   *  Looks at the current hovered cell + any structure occupying it, then
   *  acts according to mode + brush. */
  function handleWorldClick() {
    const { isBuildMode, brush, layout } = useLayoutStore.getState();
    const hover = useLayoutStore.getState().hoverCell;
    if (!hover) return;
    const { col, row } = hover;
    // World is unbounded — no out-of-range check.
    const structureAtCell = findStructureAt(layout.structures, col, row);

    if (!isBuildMode) {
      // View mode: select linked device if structure; else clear
      if (structureAtCell?.deviceId) {
        useWorldStore.getState().selectDevice(structureAtCell.deviceId);
      } else {
        useWorldStore.getState().selectDevice(null);
      }
      return;
    }

    // Build mode
    if (!brush) return;

    if (brush.type === "erase") {
      if (structureAtCell) {
        useLayoutStore.getState().removeStructureById(structureAtCell.id);
      }
      return;
    }

    if (brush.type === "ground") {
      // Always replace ground, even under a structure
      useLayoutStore.getState().setGround(col, row, brush.kind);
      return;
    }

    if (brush.type === "structure") {
      // If something is here, remove it first (silent replace) for tiny decorations,
      // otherwise reject to protect linked devices.
      if (structureAtCell) {
        if (structureAtCell.deviceId) {
          // Don't overwrite live devices — flash feedback handled by the ghost color
          return;
        }
        useLayoutStore.getState().removeStructureById(structureAtCell.id);
      }
      useLayoutStore.getState().placeStructure(col, row, brush.kind);
    }
  }

  function applyDeviceStateTint(gfx: StructureGfx, state: DeviceState | undefined) {
    const tint = state ? STATE_TINT[state] : null;
    if (tint != null) {
      gfx.glow.clear();
      gfx.glow.ellipse(0, -4, TILE_W * 0.7, TILE_H * 0.7).fill({ color: tint, alpha: 0.35 });
      gsap.killTweensOf(gfx.glow);
      if (state === "faulted") {
        gsap.to(gfx.glow, {
          alpha: 0.35,
          duration: 0.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      } else {
        gsap.to(gfx.glow, { alpha: 0.7, duration: 0.4 });
      }
      // Container subtle red/orange tint via Pixi container.tint
      gfx.container.tint = tint === 0x6b7280 ? 0x7a7f8a : tint === 0xef4444 ? 0xffb4b4 : 0xffd28a;
    } else {
      gsap.killTweensOf(gfx.glow);
      gsap.to(gfx.glow, { alpha: 0, duration: 0.4 });
      gfx.container.tint = 0xffffff;
    }
  }

  function spawnAlertPulse(gfx: StructureGfx, colorHex: string) {
    const color = parseInt(colorHex.replace("#", ""), 16);
    const def = STRUCTURE_DEFS[gfx.structure.kind];
    const pulse = new Graphics();
    const offsetY = -def.height * TILE_H - 28;
    pulse.circle(0, offsetY, 5).fill({ color });
    pulse.circle(0, offsetY, 9).stroke({ color, width: 1.5, alpha: 0.85 });
    pulse.zIndex = 200;
    gfx.container.addChild(pulse);

    const tl = gsap.timeline({
      onComplete: () => {
        gfx.container.removeChild(pulse);
        pulse.destroy();
      },
    });
    tl.fromTo(pulse, { alpha: 0 }, { alpha: 1, duration: 0.16 })
      .to(pulse.scale, { x: 1.5, y: 1.5, duration: 0.4, yoyo: true, repeat: 5, ease: "sine.inOut" }, 0)
      .to(pulse, { alpha: 0, duration: 0.4 }, "-=0.4");
  }

  function updateGhost(
    hoverCell: { col: number; row: number } | null,
    brush: ReturnType<typeof useLayoutStore.getState>["brush"],
    isBuildMode: boolean,
  ) {
    const layer = hoverLayerRef.current;
    if (!layer) return;

    // Remove existing
    if (ghostRef.current) {
      layer.removeChild(ghostRef.current);
      ghostRef.current.destroy({ children: true });
      ghostRef.current = null;
    }
    if (hoverDiamondRef.current) {
      layer.removeChild(hoverDiamondRef.current);
      hoverDiamondRef.current.destroy({ children: true });
      hoverDiamondRef.current = null;
    }

    if (!hoverCell) return;
    const p = cellToScreen(hoverCell);

    // ─── View mode: show the cell of the structure under the cursor (if any) ───
    if (!isBuildMode) {
      const layout = useLayoutStore.getState().layout;
      const structureAtCell = findStructureAt(layout.structures, hoverCell.col, hoverCell.row);
      if (structureAtCell) {
        const def = STRUCTURE_DEFS[structureAtCell.kind];
        const anchor = cellToScreen({ col: structureAtCell.col, row: structureAtCell.row });
        const far = cellToScreen({
          col: structureAtCell.col + def.footprint.w - 1,
          row: structureAtCell.row + def.footprint.h - 1,
        });
        const outline = new Graphics();
        drawFootprintOutline(outline, def.footprint.w, def.footprint.h, 0x9aa6bf, 0.06);
        outline.x = (anchor.x + far.x) / 2;
        outline.y = (anchor.y + far.y) / 2;
        outline.zIndex = 5;
        layer.addChild(outline);
        hoverDiamondRef.current = outline;
      } else {
        const dia = new Graphics();
        drawHoverDiamond(dia, 0x9aa6bf);
        dia.x = p.x;
        dia.y = p.y;
        dia.zIndex = 5;
        layer.addChild(dia);
        hoverDiamondRef.current = dia;
      }
      return;
    }

    // ─── Build mode ───
    if (!brush) {
      const dia = new Graphics();
      drawHoverDiamond(dia, 0xc9a85a);
      dia.x = p.x;
      dia.y = p.y;
      dia.zIndex = 5;
      layer.addChild(dia);
      hoverDiamondRef.current = dia;
      return;
    }

    if (brush.type === "erase") {
      const layout = useLayoutStore.getState().layout;
      const target = findStructureAt(layout.structures, hoverCell.col, hoverCell.row);
      if (target) {
        const def = STRUCTURE_DEFS[target.kind];
        const anchor = cellToScreen({ col: target.col, row: target.row });
        const far = cellToScreen({
          col: target.col + def.footprint.w - 1,
          row: target.row + def.footprint.h - 1,
        });
        const outline = new Graphics();
        drawFootprintOutline(outline, def.footprint.w, def.footprint.h, 0xef4444, 0.18);
        outline.x = (anchor.x + far.x) / 2;
        outline.y = (anchor.y + far.y) / 2;
        outline.zIndex = 5;
        layer.addChild(outline);
        hoverDiamondRef.current = outline;
      }
      const x = new Graphics();
      x.moveTo(-8, -8).lineTo(8, 8).stroke({ color: 0xef4444, width: 2 });
      x.moveTo(-8, 8).lineTo(8, -8).stroke({ color: 0xef4444, width: 2 });
      x.x = p.x;
      x.y = p.y - 6;
      x.zIndex = 60;
      layer.addChild(x);
      ghostRef.current = x as unknown as Container;
      return;
    }

    if (brush.type === "ground") {
      const dia = new Graphics();
      drawHoverDiamond(dia, 0xc9a85a);
      dia.x = p.x;
      dia.y = p.y;
      dia.zIndex = 5;
      layer.addChild(dia);
      hoverDiamondRef.current = dia;

      const g = new Graphics();
      drawGroundTile(g, brush.kind);
      g.x = p.x;
      g.y = p.y;
      g.alpha = 0.7;
      g.zIndex = 6;
      layer.addChild(g);
      ghostRef.current = g as unknown as Container;
      return;
    }

    if (brush.type === "structure") {
      const def = STRUCTURE_DEFS[brush.kind];
      const anchor = cellToScreen(hoverCell);
      const farP = cellToScreen({
        col: hoverCell.col + def.footprint.w - 1,
        row: hoverCell.row + def.footprint.h - 1,
      });
      const cx = (anchor.x + farP.x) / 2;
      const cy = (anchor.y + farP.y) / 2;

      const layout = useLayoutStore.getState().layout;
      // No bounds — world is unbounded. Just check for blocking overlap with linked devices.
      const fits = true;
      let blocked = false;
      for (let r = hoverCell.row; r < hoverCell.row + def.footprint.h && !blocked; r++) {
        for (let c = hoverCell.col; c < hoverCell.col + def.footprint.w && !blocked; c++) {
          const occ = findStructureAt(layout.structures, c, r);
          if (occ && occ.deviceId) blocked = true;
        }
      }

      // Footprint outline (always shown so the user sees the cells they'll cover)
      const outline = new Graphics();
      drawFootprintOutline(
        outline,
        def.footprint.w,
        def.footprint.h,
        !fits || blocked ? 0xef4444 : 0xc9a85a,
        !fits || blocked ? 0.2 : 0.12,
      );
      outline.x = cx;
      outline.y = cy;
      outline.zIndex = 5;
      layer.addChild(outline);
      hoverDiamondRef.current = outline;

      // Ghost body
      const container = new Container();
      container.x = cx;
      container.y = cy;
      const body = new Graphics();
      drawStructure(body, brush.kind);
      container.addChild(body);
      container.alpha = 0.7;
      container.tint = !fits || blocked ? 0xff6b6b : 0x9affb1;
      container.zIndex = 6;
      layer.addChild(container);
      ghostRef.current = container;
    }
  }

  function attachInteractions(app: Application, world: Container) {
    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;

    const DRAG_THRESHOLD = 5;
    let pointerDown = false;
    let dragMoved = false;
    let downAt = { x: 0, y: 0 };
    let last = { x: 0, y: 0 };

    // Throttle ground-render updates to avoid rebuilding every pointermove
    let groundRenderQueued = false;
    const scheduleGroundUpdate = () => {
      if (groundRenderQueued) return;
      groundRenderQueued = true;
      requestAnimationFrame(() => {
        groundRenderQueued = false;
        updateVisibleGround();
      });
    };

    app.stage.on("pointerdown", (e: FederatedPointerEvent) => {
      pointerDown = true;
      dragMoved = false;
      downAt = { x: e.global.x, y: e.global.y };
      last = { x: e.global.x, y: e.global.y };
    });
    app.stage.on("pointerup", () => (pointerDown = false));
    app.stage.on("pointerupoutside", () => (pointerDown = false));
    app.stage.on("pointermove", (e: FederatedPointerEvent) => {
      if (pointerDown) {
        const totalDx = e.global.x - downAt.x;
        const totalDy = e.global.y - downAt.y;
        if (!dragMoved && Math.hypot(totalDx, totalDy) > DRAG_THRESHOLD) {
          dragMoved = true;
        }
        if (dragMoved) {
          world.x += e.global.x - last.x;
          world.y += e.global.y - last.y;
          scheduleGroundUpdate();
        }
        last = { x: e.global.x, y: e.global.y };
      }
      const localX = (e.global.x - world.x) / world.scale.x;
      const localY = (e.global.y - world.y) / world.scale.y;
      const cell = pickCellAt(localX, localY);
      const prev = useLayoutStore.getState().hoverCell;
      if (!prev || prev.col !== cell.col || prev.row !== cell.row) {
        useLayoutStore.getState().setHoverCell(cell);
      }
    });

    app.stage.on("pointertap", () => {
      if (dragMoved) return;
      handleWorldClick();
    });

    app.canvas.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.94 : 1.06;
        const nextScale = Math.max(0.4, Math.min(2.5, world.scale.x * delta));
        world.scale.set(nextScale);
        scheduleGroundUpdate();
      },
      { passive: false },
    );
  }

  function centerWorld() {
    const app = appRef.current;
    const world = worldRef.current;
    if (!app || !world) return;
    const { layout } = useLayoutStore.getState();

    // Compute bbox of structures (in cell coords) + 4-tile padding
    let minC = Infinity, maxC = -Infinity, minR = Infinity, maxR = -Infinity;
    for (const s of layout.structures) {
      const def = STRUCTURE_DEFS[s.kind];
      if (s.col < minC) minC = s.col;
      if (s.row < minR) minR = s.row;
      if (s.col + def.footprint.w - 1 > maxC) maxC = s.col + def.footprint.w - 1;
      if (s.row + def.footprint.h - 1 > maxR) maxR = s.row + def.footprint.h - 1;
    }
    if (!isFinite(minC)) {
      // Empty layout — fall back to a sensible default frame
      minC = 0; minR = 0; maxC = 15; maxR = 15;
    }
    const pad = 4;
    minC -= pad; minR -= pad; maxC += pad; maxR += pad;

    // Project bbox corners to screen space (iso)
    const cornerScreens = [
      { col: minC, row: minR },
      { col: maxC, row: minR },
      { col: maxC, row: maxR },
      { col: minC, row: maxR },
    ].map((c) => cellToScreen(c));
    const minX = Math.min(...cornerScreens.map((p) => p.x));
    const maxX = Math.max(...cornerScreens.map((p) => p.x));
    const minY = Math.min(...cornerScreens.map((p) => p.y));
    const maxY = Math.max(...cornerScreens.map((p) => p.y));
    const bboxW = maxX - minX + TILE_W;
    const bboxH = maxY - minY + TILE_H;
    const bboxCx = (minX + maxX) / 2;
    const bboxCy = (minY + maxY) / 2;

    // Available area = viewport minus HUD chrome (header top + bottom HUD)
    const availW = app.screen.width - 40;
    const availH = app.screen.height - 240; // leaves space for bottom HUD
    const fitScale = Math.min(availW / bboxW, availH / bboxH);
    const scale = Math.max(0.4, Math.min(1.8, fitScale));
    world.scale.set(scale);

    world.x = app.screen.width / 2 - bboxCx * scale;
    world.y = (app.screen.height - 220) / 2 + 60 - bboxCy * scale;
  }

  function addAmbientFX(world: Container) {
    // Soft atmospheric glow — anchored at a fixed offset above the central pad.
    const glow = new Graphics();
    const gx = -800;
    const gy = -600;
    glow.circle(0, 0, 220).fill({ color: 0xfde4a4, alpha: 0.05 });
    glow.circle(0, 0, 140).fill({ color: 0xfde4a4, alpha: 0.07 });
    glow.circle(0, 0, 80).fill({ color: 0xffdca8, alpha: 0.12 });
    glow.circle(0, 0, 32).fill({ color: 0xffe0a6, alpha: 0.18 });
    glow.x = gx;
    glow.y = gy;
    glow.zIndex = -1;
    glow.eventMode = "none";
    world.addChild(glow);

    // Subtle static cloud shadows near the central pad — no movement
    const cloudsLayer = new Container();
    cloudsLayer.zIndex = 1;
    cloudsLayer.eventMode = "none";
    world.addChild(cloudsLayer);
    for (const [x, y, w] of [[-200, 100, 160], [400, 250, 200]] as const) {
      const c = new Graphics();
      c.ellipse(0, 0, w / 2, w / 7).fill({ color: 0x000000, alpha: 0.1 });
      c.x = x;
      c.y = y;
      cloudsLayer.addChild(c);
    }
  }
}

/** Pick the cell under a local-coordinate point inside the iso world. */
function pickCellAt(x: number, y: number): { col: number; row: number } {
  // Inverse of cellToScreen: x = (col - row) * W/2, y = (col + row) * H/2
  const col = Math.floor(x / (TILE_W / 2) + y / (TILE_H / 2)) / 2;
  const row = Math.floor(y / (TILE_H / 2) - x / (TILE_W / 2)) / 2;
  return { col: Math.floor(col + 0.5), row: Math.floor(row + 0.5) };
}

// Force-import to keep DEVICE_BY_ID typing in scope (used by future selection enhancements)
export const _devices = DEVICE_BY_ID;
