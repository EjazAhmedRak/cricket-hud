import { useQuery } from "@tanstack/react-query";
import { cricketClient } from "../api/client";
import type { ApiResponse, Match } from "../api/types";
import { useAppStore } from "../store/appStore";

export function useLiveScores() {
  const pollInterval = useAppStore((s) => s.pollInterval);

  return useQuery<Match[], Error>({
    queryKey: ["liveScores"],
    queryFn: async ({ signal }) => {
      const res = await cricketClient.get<ApiResponse<Match[]>>(
        "/currentMatches",
        { params: { offset: 0 }, signal }
      );
      return res.data.data;
    },
    refetchInterval: pollInterval,
    staleTime: pollInterval * 0.6,          // keep cache fresh for 60% of interval
    retry: 5,
    retryDelay: (n) => Math.min(1_000 * 2 ** n, 30_000),
    networkMode: "always",                  // show cached data when offline
  });
}
