"use client";

import { create } from "zustand";
import { PRIMARY_DEVICES } from "@/lib/mock/devices";
import { PRIMARY_PLANT_ID } from "@/lib/mock/plants";
import type { DeviceState } from "@/lib/mock/devices";

type WorldState = {
  activePlantId: string;
  selectedDeviceId: string | null;
  hoveredDeviceId: string | null;
  deviceStates: Record<string, DeviceState>;
  zoom: number;
  pan: { x: number; y: number };
  /** Imperative command — WorldCanvas pans to this cell and clears it. */
  cameraTarget: { col: number; row: number; bump: number } | null;
  /** Live viewport bounds in cell coords — pushed from WorldCanvas on pan/zoom. */
  cameraView: { minCol: number; maxCol: number; minRow: number; maxRow: number } | null;

  setActivePlant: (id: string) => void;
  selectDevice: (id: string | null) => void;
  hoverDevice: (id: string | null) => void;
  setDeviceState: (id: string, state: DeviceState) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  panToCell: (col: number, row: number) => void;
  clearCameraTarget: () => void;
  setCameraView: (v: WorldState["cameraView"]) => void;
};

const initialDeviceStates: Record<string, DeviceState> = Object.fromEntries(
  PRIMARY_DEVICES.map((d) => [d.id, d.state]),
);

export const useWorldStore = create<WorldState>((set) => ({
  activePlantId: PRIMARY_PLANT_ID,
  selectedDeviceId: null,
  hoveredDeviceId: null,
  deviceStates: initialDeviceStates,
  zoom: 1,
  pan: { x: 0, y: 0 },
  cameraTarget: null,
  cameraView: null,

  setActivePlant: (id) => set({ activePlantId: id, selectedDeviceId: null }),
  selectDevice: (id) => set({ selectedDeviceId: id }),
  hoverDevice: (id) => set({ hoveredDeviceId: id }),
  setDeviceState: (id, state) =>
    set((s) => ({ deviceStates: { ...s.deviceStates, [id]: state } })),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2.5, zoom)) }),
  setPan: (pan) => set({ pan }),
  panToCell: (col, row) =>
    set({ cameraTarget: { col, row, bump: Date.now() } }),
  clearCameraTarget: () => set({ cameraTarget: null }),
  setCameraView: (v) => set({ cameraView: v }),
}));
