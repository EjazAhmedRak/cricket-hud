import { RefreshCw } from "lucide-react";
import { usePointsTable } from "../hooks/usePointsTable";
import { useSeriesPoints } from "../hooks/useSeriesPoints";
import { formatNRR } from "../lib/formatScore";

interface PointsTableProps {
  seriesId: string | null;
}

export function PointsTable({ seriesId }: PointsTableProps) {
  const { data: seriesInfo } = usePointsTable(seriesId);
  const { data: rows, isLoading, isError, isFetching, refetch } = useSeriesPoints(seriesId);

  if (!seriesId) {
    return (
      <div className="px-4 py-3 text-[11px] text-white/40 text-center">
        Select a match to see standings
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 py-3 text-[11px] text-white/40 text-center">
        Loading standings…
      </div>
    );
  }

  if (isError || !rows || rows.length === 0) {
    return (
      <div className="px-4 py-3 text-[11px] text-white/40 text-center">
        Points table not available
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-64 overflow-y-auto hud-scroll">
      {/* Series name + refresh */}
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5">
        <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold truncate">
          {seriesInfo?.info?.name}
        </span>
        <button
          onClick={() => refetch()}
          title="Refresh standings"
          className="shrink-0 text-white/30 hover:text-white/70 transition-colors ml-2"
        >
          <RefreshCw size={10} className={isFetching ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 px-4 py-1 text-[9px] uppercase tracking-widest text-white/30 font-semibold">
        <span>Team</span>
        <span className="text-right w-6">P</span>
        <span className="text-right w-6">W</span>
        <span className="text-right w-6">L</span>
        <span className="text-right w-8">Pts</span>
        <span className="text-right w-12">NRR</span>
      </div>

      {/* Data rows */}
      {[...rows].sort((a, b) => b.points - a.points || parseFloat(b.nrr) - parseFloat(a.nrr)).map((row, i) => (
        <div
          key={row.team}
          className={[
            "grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3",
            "px-4 py-1.5 text-[11px] tabular",
            i < 4 ? "text-white" : "text-white/60",
            i === 0 ? "bg-hud-accent/10" : "",
          ].join(" ")}
        >
          <span className="font-medium truncate">{row.team}</span>
          <span className="text-right w-6 text-white/50">{row.matchesPlayed}</span>
          <span className="text-right w-6 text-hud-accent">{row.won}</span>
          <span className="text-right w-6 text-hud-danger/80">{row.lost}</span>
          <span className="text-right w-8 font-bold">{row.points}</span>
          <span className={[
            "text-right w-12 text-[10px]",
            parseFloat(row.nrr) >= 0 ? "text-hud-accent" : "text-hud-danger/80",
          ].join(" ")}>
            {formatNRR(row.nrr)}
          </span>
        </div>
      ))}
    </div>
  );
}
