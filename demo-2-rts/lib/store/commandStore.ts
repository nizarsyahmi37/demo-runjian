"use client";

import { create } from "zustand";
import type { AgentId } from "@/lib/mock/agents";

export type CommandSheetId =
  | "overview"
  | "alarms"
  | "tickets"
  | "analytics"
  | "map"
  | "comms"
  | "safety"
  | "search";

type CommandState = {
  activeSheet: CommandSheetId | null;
  activeAgent: AgentId | null;
  open: (id: CommandSheetId) => void;
  openAgent: (id: AgentId) => void;
  close: () => void;
  toggle: (id: CommandSheetId) => void;
  toggleAgent: (id: AgentId) => void;
};

export const useCommandStore = create<CommandState>((set, get) => ({
  activeSheet: null,
  activeAgent: null,
  open: (id) => set({ activeSheet: id, activeAgent: null }),
  openAgent: (id) => set({ activeAgent: id, activeSheet: null }),
  close: () => set({ activeSheet: null, activeAgent: null }),
  toggle: (id) =>
    set({
      activeSheet: get().activeSheet === id ? null : id,
      activeAgent: null,
    }),
  toggleAgent: (id) =>
    set({
      activeAgent: get().activeAgent === id ? null : id,
      activeSheet: null,
    }),
}));
