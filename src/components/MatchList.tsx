import { useLiveScores } from "../hooks/useLiveScores";
import { useAppStore } from "../store/appStore";
import { formatInnings, teamAbbr, teamFromInning } from "../lib/formatScore";

interface MatchListProps {
  onSelect: (matchId: string) => void;
}

export function MatchList({ onSelect }: MatchListProps) {
  const { data: matches, isLoading, isError } = useLiveScores();
  const selectedMatchId = useAppStore((s) => s.selectedMatchId);

  if (isLoading) {
    return (
      <div className="px-4 py-3 text-[11px] text-white/40 text-center">
        Loading matches…
      </div>
    );
  }

  if (isError || !matches || matches.length === 0) {
    return (
      <div className="px-4 py-3 text-[11px] text-white/40 text-center">
        No live matches right now
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-64 overflow-y-auto hud-scroll">
      {matches.map((match) => {
        const isSelected = match.id === selectedMatchId;
        const innings = match.score ?? [];

        return (
          <button
            key={match.id}
            onClick={() => onSelect(match.id)}
            className={[
              "flex flex-col gap-0.5 px-4 py-2.5 text-left transition-colors",
              "hover:bg-white/10 active:bg-white/15",
              isSelected ? "bg-white/10 border-l-2 border-hud-accent" : "border-l-2 border-transparent",
            ].join(" ")}
          >
            {/* Match type badge + teams */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-semibold tracking-widest text-hud-muted bg-white/10 px-1.5 py-0.5 rounded">
                {match.matchType}
              </span>
              <span className="text-[11px] text-white font-medium leading-tight truncate max-w-[280px]">
                {match.teams.map(teamAbbr).join(" vs ")}
              </span>
            </div>

            {/* Score lines */}
            {innings.length > 0 ? (
              <div className="flex flex-col gap-0.5 pl-0.5">
                {innings.map((inn, i) => (
                  <span key={i} className="text-[10px] text-white/70 tabular">
                    <span className="text-white/50 mr-1">
                      {teamAbbr(teamFromInning(inn.inning))}
                    </span>
                    {formatInnings(inn)}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-white/40 italic">
                {match.status}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
