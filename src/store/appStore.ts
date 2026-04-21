import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createLogger } from "../lib/logger";

const log = createLogger("Store");

export type ViewMode = "compact" | "expanded";
export type BannerBg = "black" | "white" | "neon-green";

interface AppState {
  // ── Selected match ────────────────────────────────────────
  selectedMatchId: string | null;
  setSelectedMatchId: (id: string | null) => void;

  // ── View mode ─────────────────────────────────────────────
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;

  // ── Settings ──────────────────────────────────────────────
  opacity: number;         // 0.5 – 1.0
  setOpacity: (v: number) => void;

  pollInterval: number;    // ms — 30_000 to 150_000
  setPollInterval: (ms: number) => void;

  showPointsTable: boolean;
  setShowPointsTable: (v: boolean) => void;

  bannerBg: BannerBg;
  setBannerBg: (bg: BannerBg) => void;

  // ── Online state ──────────────────────────────────────────
  isOnline: boolean;
  setIsOnline: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, _get) => ({
      // Selected match
      selectedMatchId: null,
      setSelectedMatchId: (id) => { log.info(`match selected: ${id ?? "none"}`); set({ selectedMatchId: id }); },

      // View mode
      viewMode: "compact",
      setViewMode: (mode) => { log.debug(`viewMode → ${mode}`); set({ viewMode: mode }); },
      toggleViewMode: () =>
        set((s) => {
          const next = s.viewMode === "compact" ? "expanded" : "compact";
          log.debug(`viewMode toggled → ${next}`);
          return { viewMode: next };
        }),

      // Settings
      opacity: 0.85,
      setOpacity: (v) => { const clamped = Math.max(0.5, Math.min(1, v)); log.debug(`opacity → ${clamped}`); set({ opacity: clamped }); },

      pollInterval: 150_000,
      setPollInterval: (ms) => { const clamped = Math.max(30_000, Math.min(150_000, ms)); log.info(`pollInterval → ${clamped}ms`); set({ pollInterval: clamped }); },

      showPointsTable: false,
      setShowPointsTable: (v) => { log.debug(`showPointsTable → ${v}`); set({ showPointsTable: v }); },

      bannerBg: "black",
      setBannerBg: (bg) => { log.info(`bannerBg → ${bg}`); set({ bannerBg: bg }); },

      // Online state (not persisted — runtime only)
      isOnline: navigator.onLine,
      setIsOnline: (v) => set({ isOnline: v }),
    }),
    {
      name: "cricket-hud-settings",
      // Only persist user preferences, not runtime state
      partialize: (state) => ({
        opacity: state.opacity,
        pollInterval: state.pollInterval,
        selectedMatchId: state.selectedMatchId,
        bannerBg: state.bannerBg,
      }),
    }
  )
);
