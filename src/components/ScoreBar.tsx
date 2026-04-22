import { invoke } from "@tauri-apps/api/core";
import {
  ChevronDown,
  ChevronUp,
  Settings,
  List,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { createLogger } from "../lib/logger";
import { useLiveScores } from "../hooks/useLiveScores";
import { usePointsTable } from "../hooks/usePointsTable";
import { useAppStore } from "../store/appStore";
import {
  formatInnings,
  teamAbbr,
  teamFromInning,
  liveInnings,
  getTarget,
  calcCRR,
  calcRRR,
} from "../lib/formatScore";
import { MatchList } from "./MatchList";
import { PointsTable } from "./PointsTable";
import { SettingsPanel } from "./SettingsPanel";
import { OfflineBanner } from "./OfflineBanner";
import type { Match } from "../api/types";

type Panel = "none" | "matches" | "points" | "settings";

const log = createLogger("ScoreBar");

// Heights in logical pixels (DPI-independent, matches tauri.conf.json)
const COMPACT_H  = 56;
const PANEL_H    = 320;

export function ScoreBar() {
  const [panel, setPanel] = useState<Panel>("none");
  const {
    selectedMatchId,
    setSelectedMatchId,
    isOnline,
    bannerBg,
  } = useAppStore();

  const BG_STYLES: Record<string, string> = {
    "black":      "rgba(12,12,12,0.86)",
    "white":      "rgba(255,255,255,0.92)",
    "neon-green": "rgba(57,255,20,0.92)",
  };
  const bgStyle = BG_STYLES[bannerBg] ?? BG_STYLES["black"];
  const textOnLight = bannerBg === "white" || bannerBg === "neon-green";

  const { data: matches, isFetching, refetch } = useLiveScores();

  // Resolve displayed match
  const activeMatch: Match | undefined =
    matches?.find((m) => m.id === selectedMatchId) ?? matches?.[0];

  const innings      = activeMatch?.score ?? [];
  const live         = activeMatch ? liveInnings(activeMatch) : null;
  const target       = activeMatch ? getTarget(activeMatch) : null;
  const crr          = live ? calcCRR(live.r, live.o) : null;
  const rrr          = target && live ? calcRRR(target, live.r, live.o === 0 ? 0.1 : live.o) : null;
  const seriesId     = activeMatch?.series_id ?? null;

  const { data: seriesInfo } = usePointsTable(seriesId);
  const tournamentName = seriesInfo?.info?.name ?? null;

  const togglePanel = (p: Panel) => {
    const next = panel === p ? "none" : p;
    log.debug(`panel → ${next}`);
    setPanel(next);
    const h = next === "none" ? COMPACT_H : COMPACT_H + PANEL_H;
    invoke("set_window_height", { height: h }).catch((e) => log.error("set_window_height failed", e));
  };

  const selectMatch = (id: string) => {
    log.info(`match selected from list: ${id}`);
    setSelectedMatchId(id);
    setPanel("none");
    invoke("set_window_height", { height: COMPACT_H }).catch((e) => log.error("set_window_height failed", e));
  };

  return (
    <div
      className="flex flex-col w-full h-full rounded-hud overflow-hidden select-none"
      style={{ background: bgStyle, color: textOnLight ? "rgba(0,0,0,0.85)" : undefined }}
    >
      {/* ── Drag region + score strip ────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 h-14 shrink-0 cursor-move"
        onMouseDown={(e) => {
          // Only drag on direct hits on the bar (not button clicks bubbling up)
          if ((e.target as HTMLElement).closest("button")) return;
          log.debug("drag started");
          invoke("start_dragging").catch((e) => log.error("start_dragging failed", e));
        }}
      >
        {/* Tournament / series badge */}
        {activeMatch && (
          <span
            className="shrink-0 text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded max-w-[120px] truncate"
            title={tournamentName ?? activeMatch.matchType.toUpperCase()}
            style={{
              background: textOnLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
              color:      textOnLight ? "rgba(0,0,0,0.5)"  : "rgba(255,255,255,0.5)",
            }}
          >
            {tournamentName ?? activeMatch.matchType.toUpperCase()}
          </span>
        )}

        {/* Score content — fills remaining space */}
        <div className="flex-1 flex items-center gap-3 overflow-hidden">
          {!activeMatch ? (
            <span
              className="text-[11px] italic"
              style={{ color: textOnLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)" }}
            >
              No live matches
            </span>
          ) : innings.length === 0 ? (
            <span
              className="text-[11px] truncate"
              style={{ color: textOnLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)" }}
            >
              {activeMatch.status}
            </span>
          ) : (
            innings.map((inn, i) => (
              <div key={i} className="flex items-baseline gap-1 shrink-0">
                <span
                  className="text-[10px] font-medium"
                  style={{ color: textOnLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)" }}
                >
                  {teamAbbr(teamFromInning(inn.inning))}
                </span>
                <span
                  className="text-hud-score tabular font-semibold"
                  style={{ color: textOnLight ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,1)" }}
                >
                  {formatInnings(inn)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Run rates */}
        {crr && (
          <div className="shrink-0 flex gap-2 text-[10px] tabular">
            <span style={{ color: textOnLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.4)" }}>
              CRR <span className="font-semibold" style={{ color: textOnLight ? "#0066cc" : undefined }}>{crr}</span>
            </span>
            {rrr && (
              <span style={{ color: textOnLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.4)" }}>
                RRR <span className="font-semibold" style={{ color: textOnLight ? "#cc6600" : undefined }}>{rrr}</span>
              </span>
            )}
          </div>
        )}

        {/* Action buttons — opt out of drag */}
        <div
          className="shrink-0 flex items-center gap-0.5"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <IconBtn onClick={() => refetch()} title="Refresh" active={isFetching} light={textOnLight}>
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          </IconBtn>
          <IconBtn onClick={() => togglePanel("matches")} title="Matches" active={panel === "matches"} light={textOnLight}>
            <List size={13} />
          </IconBtn>
          <IconBtn onClick={() => togglePanel("points")} title="Points table" active={panel === "points"} light={textOnLight}>
            <Trophy size={13} />
          </IconBtn>
          <IconBtn onClick={() => togglePanel("settings")} title="Settings" active={panel === "settings"} light={textOnLight}>
            <Settings size={13} />
          </IconBtn>
          <IconBtn onClick={() => togglePanel(panel === "none" ? "matches" : "none")} title={panel === "none" ? "Expand" : "Collapse"} light={textOnLight}>
            {panel === "none" ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </IconBtn>
        </div>
      </div>

      {/* ── Expanded panel ───────────────────────────────────────── */}
      {panel !== "none" && (
        <div
          className="flex-1 border-t border-white/10 overflow-hidden animate-slide-down"
          style={{ background: "rgba(8,8,8,0.92)" }}
        >
          {!isOnline && (
            <div className="flex justify-center pt-2">
              <OfflineBanner />
            </div>
          )}

          {panel === "matches" && (
            <MatchList onSelect={selectMatch} />
          )}

          {panel === "points" && (
            <PointsTable seriesId={seriesId} />
          )}

          {panel === "settings" && (
            <SettingsPanel />
          )}
        </div>
      )}
    </div>
  );
}

// ── Small icon button ────────────────────────────────────────────────────────
interface IconBtnProps {
  onClick: () => void;
  title: string;
  active?: boolean;
  light?: boolean;
  children: React.ReactNode;
}

function IconBtn({ onClick, title, active, light, children }: IconBtnProps) {
  const activeStyle  = light ? "rgba(0,0,0,0.15)"  : "rgba(255,255,255,0.2)";
  const defaultColor = light ? "rgba(0,0,0,0.45)"  : "rgba(255,255,255,0.5)";
  const hoverBg      = light ? "rgba(0,0,0,0.08)"  : "rgba(255,255,255,0.1)";

  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded flex items-center justify-center transition-colors"
      style={{
        background: active ? activeStyle : undefined,
        color: active ? (light ? "rgba(0,0,0,0.9)" : "white") : defaultColor,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = active ? activeStyle : ""; }}
    >
      {children}
    </button>
  );
}
