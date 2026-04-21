import { useQuery } from "@tanstack/react-query";
import { cricketClient } from "../api/client";
import type { ApiResponse, SeriesInfo } from "../api/types";

export function usePointsTable(seriesId: string | null) {
  return useQuery<SeriesInfo, Error>({
    queryKey: ["pointsTable", seriesId],
    queryFn: async ({ signal }) => {
      const res = await cricketClient.get<ApiResponse<SeriesInfo>>(
        "/series_info",
        { params: { id: seriesId }, signal }
      );
      return res.data.data;
    },
    enabled: !!seriesId,
    staleTime: 5 * 60_000,
    retry: 3,
    retryDelay: (n) => Math.min(1_000 * 2 ** n, 15_000),
    networkMode: "always",
  });
}
