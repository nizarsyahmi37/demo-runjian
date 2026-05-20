"use client";

import { create } from "zustand";
import type { GroundKind, StructureKind } from "@/components/world/isometric/tileKinds";
import { STRUCTURE_DEFS } from "@/components/world/isometric/tileKinds";
import { PRIMARY_DEVICES, DEVICES } from "@/lib/mock/devices";
import { PLANTS, PRIMARY_PLANT_ID } from "@/lib/mock/plants";

export type Structure = {
  id: string;
  kind: StructureKind;
  /** Any integer — positive, negative, or zero. The world is unbounded. */
  col: number;
  row: number;
  rotation?: 0 | 90 | 180 | 270;
  deviceId?: string;
  tag?: string;
};

export type Tile = {
  ground: GroundKind;
};

/** Unlimited 2D world.
 *  Ground tiles are sparse — any cell not present defaults to grass.
 *  Structures live at arbitrary integer (col, row), including negative. */
export type Layout = {
  tiles: Map<string, Tile>;
  structures: Structure[];
};

export type Brush =
  | { type: "ground"; kind: GroundKind }
  | { type: "structure"; kind: StructureKind }
  | { type: "erase" }
  | null;

type LayoutState = {
  layouts: Record<string, Layout>;
  currentPlantId: string;
  layout: Layout;
  isBuildMode: boolean;
  brush: Brush;
  hoverCell: { col: number; row: number } | null;

  switchToPlant: (plantId: string) => void;

  toggleBuildMode: () => void;
  setBuildMode: (on: boolean) => void;
  setBrush: (b: Brush) => void;
  setHoverCell: (cell: { col: number; row: number } | null) => void;

  setGround: (col: number, row: number, kind: GroundKind) => void;
  placeStructure: (col: number, row: number, kind: StructureKind) => string | null;
  removeStructureAt: (col: number, row: number) => void;
  removeStructureById: (id: string) => void;

  save: () => void;
  load: () => boolean;
  reset: () => void;
};

export const DEFAULT_GROUND: GroundKind = "grass";

export function tileKey(col: number, row: number) {
  return `${col},${row}`;
}

export function getGroundAt(layout: Layout, col: number, row: number): GroundKind {
  return layout.tiles.get(tileKey(col, row))?.ground ?? DEFAULT_GROUND;
}

// ───────────────────────── seeding ─────────────────────────

function deviceKindToStructure(dType: string): StructureKind | null {
  switch (dType) {
    case "panel_array": return "panel_array_ns";
    case "inverter": return "inverter";
    case "transformer": return "transformer";
    case "tower": return "tower";
    case "meter": return "meter";
    case "combiner": return "combiner";
    default: return null;
  }
}

/** Stamp a concrete pad of cells into a tiles Map. */
function stampPad(tiles: Map<string, Tile>, lo: number, hi: number, opts?: { coastal?: boolean }) {
  for (let r = lo; r < hi; r++) {
    for (let c = lo; c < hi; c++) {
      // Outer ring asphalt; rest concrete
      const ground: GroundKind =
        c === lo || c === hi - 1 || r === lo || r === hi - 1 ? "asphalt" : "concrete";
      tiles.set(tileKey(c, r), { ground });
    }
  }
  if (opts?.coastal) {
    // Water + sand strip along the west edge of the pad
    for (let r = lo - 4; r < hi + 4; r++) {
      tiles.set(tileKey(lo - 5, r), { ground: "water" });
      tiles.set(tileKey(lo - 4, r), { ground: "water" });
      tiles.set(tileKey(lo - 3, r), { ground: "sand" });
      tiles.set(tileKey(lo - 2, r), { ground: "sand" });
    }
  }
}

function makeJohorLayout(): Layout {
  const PAD_LO = 0;
  const PAD_HI = 16;
  const tiles = new Map<string, Tile>();
  stampPad(tiles, PAD_LO, PAD_HI);

  const structures: Structure[] = [];
  let i = 0;

  // Seed devices using their existing logical coords (offset into the pad)
  const OX = 1;
  const OY = 1;
  for (const d of PRIMARY_DEVICES) {
    if (!d.layout) continue;
    const kind = deviceKindToStructure(d.type);
    if (!kind) continue;
    structures.push({
      id: `S-${i++}-${d.id}`,
      kind,
      col: d.layout.col + OX,
      row: d.layout.row + OY,
      deviceId: d.id,
    });
  }

  // Trees + light poles around the pad perimeter (on grass)
  const decor: Array<[number, number, StructureKind]> = [
    [-2, -2, "tree"], [-1, -2, "tree"], [-2, -1, "tree"],
    [PAD_HI + 1, -2, "tree"], [PAD_HI + 2, -1, "tree"],
    [-2, PAD_HI + 1, "tree"], [-1, PAD_HI + 2, "tree"],
    [PAD_HI + 1, PAD_HI + 1, "tree"], [PAD_HI + 2, PAD_HI + 2, "tree"],
    [4, -1, "light_pole"], [12, -1, "light_pole"],
    [4, PAD_HI, "light_pole"], [12, PAD_HI, "light_pole"],
    [-1, 4, "light_pole"], [-1, 12, "light_pole"],
    [PAD_HI, 4, "light_pole"], [PAD_HI, 12, "light_pole"],
    [PAD_HI - 3, PAD_HI - 3, "depot"],
  ];
  for (const [col, row, kind] of decor) {
    structures.push({ id: `S-${i++}-${kind}`, kind, col, row });
  }

  return { tiles, structures };
}

function makePrng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  let state = Math.abs(h) || 1;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function makeProceduralLayout(plantId: string): Layout {
  const plant = PLANTS.find((p) => p.id === plantId);
  if (!plant) return makeJohorLayout();

  const rng = makePrng(plantId);
  const PAD_LO = 0;
  const PAD_HI = 16;
  const tiles = new Map<string, Tile>();
  const isCoastal = plant.region === "Penang" || plant.region === "Melaka";
  stampPad(tiles, PAD_LO, PAD_HI, { coastal: isCoastal });

  const clusterCount = Math.max(1, Math.min(8, Math.round(plant.capacityKWp / 500)));
  const structures: Structure[] = [];
  let nextId = 0;
  const used = new Set<string>();
  const reserve = (col: number, row: number, w: number, h: number) => {
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) used.add(`${c},${r}`);
    }
  };
  const isFree = (col: number, row: number, w: number, h: number, insidePad = true) => {
    if (insidePad && (col < PAD_LO + 1 || row < PAD_LO + 1 || col + w > PAD_HI - 1 || row + h > PAD_HI - 1)) {
      return false;
    }
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        if (used.has(`${c},${r}`)) return false;
      }
    }
    return true;
  };

  const plantDevices = DEVICES.filter((d) => d.plantId === plantId);
  let deviceIdx = 0;
  const nextDeviceId = (): string | undefined => {
    while (deviceIdx < plantDevices.length) {
      const d = plantDevices[deviceIdx++];
      if (d.type === "inverter") return d.id;
    }
    return undefined;
  };

  const innerStart = PAD_LO + 2;
  const innerW = PAD_HI - PAD_LO - 4;
  const clusterPitch = 6;
  for (let i = 0; i < clusterCount; i++) {
    const xSlot = (i * clusterPitch) % innerW;
    const ySlot = Math.floor((i * clusterPitch) / innerW) * 4;
    const baseCol = innerStart + xSlot;
    const baseRow = innerStart + ySlot;
    if (baseRow + 3 > PAD_HI - 1) break;

    if (isFree(baseCol, baseRow, 4, 1)) {
      structures.push({ id: `S-${plantId}-${nextId++}`, kind: "panel_array_ns", col: baseCol, row: baseRow, deviceId: nextDeviceId() });
      reserve(baseCol, baseRow, 4, 1);
    }
    if (isFree(baseCol, baseRow + 2, 4, 1)) {
      structures.push({ id: `S-${plantId}-${nextId++}`, kind: "panel_array_ns", col: baseCol, row: baseRow + 2, deviceId: nextDeviceId() });
      reserve(baseCol, baseRow + 2, 4, 1);
    }
    if (isFree(baseCol + 4, baseRow + 1, 1, 1)) {
      structures.push({ id: `S-${plantId}-${nextId++}`, kind: "inverter", col: baseCol + 4, row: baseRow + 1, deviceId: nextDeviceId() });
      reserve(baseCol + 4, baseRow + 1, 1, 1);
    }
  }

  for (let r = PAD_HI - 2; r >= PAD_LO + 1; r--) {
    if (isFree(PAD_HI - 2, r, 1, 1)) {
      structures.push({ id: `S-${plantId}-${nextId++}`, kind: "tower", col: PAD_HI - 2, row: r });
      reserve(PAD_HI - 2, r, 1, 1);
      break;
    }
  }
  for (let r = PAD_LO + 1; r < PAD_HI - 1; r++) {
    if (isFree(PAD_HI - 3, r, 1, 1)) {
      structures.push({ id: `S-${plantId}-${nextId++}`, kind: "transformer", col: PAD_HI - 3, row: r });
      reserve(PAD_HI - 3, r, 1, 1);
      break;
    }
  }
  if (isFree(PAD_HI - 4, PAD_HI - 4, 2, 2)) {
    structures.push({ id: `S-${plantId}-${nextId++}`, kind: "depot", col: PAD_HI - 4, row: PAD_HI - 4 });
    reserve(PAD_HI - 4, PAD_HI - 4, 2, 2);
  }

  const treeCount = 14 + Math.floor(rng() * 6);
  for (let i = 0; i < treeCount; i++) {
    const edge = Math.floor(rng() * 4);
    let c: number, r: number;
    if (edge === 0) { c = -3 + Math.floor(rng() * 22); r = -3 + Math.floor(rng() * 2); }
    else if (edge === 1) { c = PAD_HI + Math.floor(rng() * 3); r = -3 + Math.floor(rng() * 22); }
    else if (edge === 2) { c = -3 + Math.floor(rng() * 22); r = PAD_HI + Math.floor(rng() * 3); }
    else { c = -3 + Math.floor(rng() * 2); r = -3 + Math.floor(rng() * 22); }
    if (used.has(`${c},${r}`)) continue;
    structures.push({ id: `S-${plantId}-${nextId++}`, kind: "tree", col: c, row: r });
    reserve(c, r, 1, 1);
  }

  for (const [c, r] of [
    [PAD_LO + 1, PAD_LO + 1],
    [PAD_HI - 2, PAD_LO + 1],
    [PAD_LO + 1, PAD_HI - 2],
    [PAD_HI - 2, PAD_HI - 2],
  ] as const) {
    if (!used.has(`${c},${r}`)) {
      structures.push({ id: `S-${plantId}-${nextId++}`, kind: "light_pole", col: c, row: r });
      reserve(c, r, 1, 1);
    }
  }

  return { tiles, structures };
}

function makeLayoutForPlant(plantId: string): Layout {
  return plantId === PRIMARY_PLANT_ID ? makeJohorLayout() : makeProceduralLayout(plantId);
}

// ───────────────────────── persistence ─────────────────────────

const STORAGE_KEY_PREFIX = "irun.layout.v3";
const storageKey = (plantId: string) => `${STORAGE_KEY_PREFIX}.${plantId}`;

type SerializedLayout = {
  tiles: [string, Tile][];
  structures: Structure[];
};

function serializeLayout(l: Layout): string {
  const obj: SerializedLayout = {
    tiles: Array.from(l.tiles.entries()),
    structures: l.structures,
  };
  return JSON.stringify(obj);
}

function deserializeLayout(raw: string): Layout | null {
  try {
    const obj = JSON.parse(raw) as SerializedLayout;
    if (!Array.isArray(obj.tiles) || !Array.isArray(obj.structures)) return null;
    return {
      tiles: new Map(obj.tiles),
      structures: obj.structures,
    };
  } catch {
    return null;
  }
}

function initialLayouts(): Record<string, Layout> {
  return { [PRIMARY_PLANT_ID]: makeJohorLayout() };
}

// ───────────────────────── store ─────────────────────────

export const useLayoutStore = create<LayoutState>((set, get) => {
  const initialPlant = PRIMARY_PLANT_ID;
  const seed = initialLayouts();

  function updateActive(updater: (l: Layout) => Layout) {
    set((s) => {
      const next = updater(s.layout);
      return {
        layout: next,
        layouts: { ...s.layouts, [s.currentPlantId]: next },
      };
    });
  }

  return {
    layouts: seed,
    currentPlantId: initialPlant,
    layout: seed[initialPlant],
    isBuildMode: false,
    brush: null,
    hoverCell: null,

    switchToPlant: (plantId) => {
      const s = get();
      if (s.currentPlantId === plantId) return;
      const target = s.layouts[plantId] ?? (() => {
        if (typeof window !== "undefined") {
          try {
            const raw = window.localStorage.getItem(storageKey(plantId));
            if (raw) {
              const parsed = deserializeLayout(raw);
              if (parsed) return parsed;
            }
          } catch { /* */ }
        }
        return makeLayoutForPlant(plantId);
      })();
      set({
        currentPlantId: plantId,
        layout: target,
        layouts: { ...s.layouts, [plantId]: target },
        hoverCell: null,
      });
    },

    toggleBuildMode: () =>
      set((s) => ({ isBuildMode: !s.isBuildMode, brush: !s.isBuildMode ? s.brush : null })),
    setBuildMode: (on) => set({ isBuildMode: on, brush: on ? get().brush : null }),
    setBrush: (b) => set({ brush: b }),
    setHoverCell: (cell) => set({ hoverCell: cell }),

    setGround: (col, row, kind) => {
      updateActive((l) => {
        const tiles = new Map(l.tiles);
        tiles.set(tileKey(col, row), { ground: kind });
        return { ...l, tiles };
      });
    },

    placeStructure: (col, row, kind) => {
      const def = STRUCTURE_DEFS[kind];
      const l = get().layout;
      if (isFootprintOccupied(l.structures, col, row, def.footprint.w, def.footprint.h)) {
        return null;
      }
      const id = `S-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const newStructure: Structure = { id, kind, col, row };
      updateActive((curr) => ({ ...curr, structures: [...curr.structures, newStructure] }));
      return id;
    },

    removeStructureAt: (col, row) => {
      updateActive((l) => {
        const target = findStructureAt(l.structures, col, row);
        if (!target) return l;
        return { ...l, structures: l.structures.filter((x) => x.id !== target.id) };
      });
    },

    removeStructureById: (id) => {
      updateActive((l) => ({ ...l, structures: l.structures.filter((x) => x.id !== id) }));
    },

    save: () => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(storageKey(get().currentPlantId), serializeLayout(get().layout));
      } catch { /* */ }
    },

    load: () => {
      if (typeof window === "undefined") return false;
      try {
        const raw = window.localStorage.getItem(storageKey(get().currentPlantId));
        if (!raw) return false;
        const parsed = deserializeLayout(raw);
        if (!parsed) return false;
        updateActive(() => parsed);
        return true;
      } catch {
        return false;
      }
    },

    reset: () => {
      const plantId = get().currentPlantId;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(storageKey(plantId));
        } catch { /* */ }
      }
      const fresh = makeLayoutForPlant(plantId);
      set((s) => ({ layout: fresh, layouts: { ...s.layouts, [plantId]: fresh } }));
    },
  };
});

// ───────────────────────── helpers ─────────────────────────

export function findStructureAt(structures: Structure[], col: number, row: number): Structure | null {
  for (let i = structures.length - 1; i >= 0; i--) {
    const s = structures[i];
    const def = STRUCTURE_DEFS[s.kind];
    if (
      col >= s.col &&
      col < s.col + def.footprint.w &&
      row >= s.row &&
      row < s.row + def.footprint.h
    ) {
      return s;
    }
  }
  return null;
}

export function isFootprintOccupied(
  structures: Structure[],
  col: number,
  row: number,
  w: number,
  h: number,
): boolean {
  for (let r = row; r < row + h; r++) {
    for (let c = col; c < col + w; c++) {
      if (findStructureAt(structures, c, r)) return true;
    }
  }
  return false;
}
