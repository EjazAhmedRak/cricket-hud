import { useQuery } from "@tanstack/react-query";
import { cricketClient } from "../api/client";
import type { ApiResponse, Scorecard } from "../api/types";

export function useMatchDetail(matchId: string | null) {
  return useQuery<Scorecard, Error>({
    queryKey: ["matchDetail", matchId],
    queryFn: async ({ signal }) => {
      const res = await cricketClient.get<ApiResponse<Scorecard>>(
        "/match_scorecard",
        { params: { id: matchId }, signal }
      );
      return res.data.data;
    },
    enabled: !!matchId,
    staleTime: 60_000,
    retry: 3,
    retryDelay: (n) => Math.min(1_000 * 2 ** n, 15_000),
    networkMode: "always",
  });
}
