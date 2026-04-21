import { useQuery } from "@tanstack/react-query";
import { cricketClient } from "../api/client";
import { createLogger } from "../lib/logger";
import type { ApiResponse, SeriesPoints, PointsTableRow, RawPointsRow } from "../api/types";

const log = createLogger("SeriesPoints");

function normaliseRow(r: RawPointsRow): PointsTableRow {
  const won  = r.wins ?? r.won ?? r.matchesWon ?? 0;
  return {
    team:          r.teamname ?? r.team ?? r.teamName ?? "Unknown",
    teamId:        r.teamId,
    matchesPlayed: r.matches ?? r.matchesPlayed ?? 0,
    won,
    lost:          r.loss ?? r.lost ?? r.matchesLost ?? 0,
    nr:            r.nr ?? r.noResult ?? 0,
    // API has no points field — IPL T20 awards 2pts per win
    points:        r.points ?? r.pts ?? won * 2,
    nrr:           r.nrr ?? "0.000",
  };
}

export function useSeriesPoints(seriesId: string | null) {
  return useQuery<PointsTableRow[], Error>({
    queryKey: ["seriesPoints", seriesId],
    queryFn: async ({ signal }) => {
      const res = await cricketClient.get<ApiResponse<SeriesPoints>>(
        "/series_points",
        { params: { id: seriesId }, signal }
      );
      const payload = res.data.data as unknown;

      // API returns the rows as a direct array
      let rawRows: RawPointsRow[];
      if (Array.isArray(payload)) {
        rawRows = payload as RawPointsRow[];
      } else {
        const obj = payload as Record<string, unknown>;
        rawRows = (obj["pointsTable"] as RawPointsRow[] | undefined) ?? [];
      }

      log.debug(`series_points: ${rawRows.length} rows`);
      if (rawRows.length > 0) log.debug("row[0] fields:", JSON.stringify(rawRows[0]));

      return rawRows.map(normaliseRow);
    },
    enabled: !!seriesId,
    staleTime: Infinity,        // never auto-refetch — user triggers manually
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: (n) => Math.min(1_000 * 2 ** n, 15_000),
    networkMode: "always",
  });
}
