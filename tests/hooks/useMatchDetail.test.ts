import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useMatchDetail } from "../../src/hooks/useMatchDetail";
import type { Scorecard } from "../../src/api/types";

vi.mock("../../src/api/client", () => ({
  cricketClient: { get: vi.fn() },
}));

import { cricketClient } from "../../src/api/client";
const mockGet = vi.mocked(cricketClient.get);

const SCORECARD: Scorecard = {
  id: "m1",
  name: "MI vs CSK",
  matchType: "t20",
  status: "MI won by 5 wickets",
  venue: "Wankhede",
  date: "2026-04-21",
  teams: ["Mumbai Indians", "Chennai Super Kings"],
  scorecard: [
    { inning: "CSK Inning 1", r: 175, w: 8, o: 20, batting: [], bowling: [] },
    { inning: "MI Inning 1",  r: 178, w: 5, o: 19.2, batting: [], bowling: [] },
  ],
};

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe("useMatchDetail", () => {
  it("does not fetch when matchId is null", () => {
    const { result } = renderHook(() => useMatchDetail(null), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("fetches scorecard when matchId is provided", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: SCORECARD } });
    const { result } = renderHook(() => useMatchDetail("m1"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("m1");
    expect(result.current.data?.scorecard).toHaveLength(2);
  });

  it("returns correct innings data", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: SCORECARD } });
    const { result } = renderHook(() => useMatchDetail("m1"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const innings = result.current.data?.scorecard[1];
    expect(innings?.inning).toBe("MI Inning 1");
    expect(innings?.r).toBe(178);
    expect(innings?.w).toBe(5);
  });

  it("sets isError on API failure", async () => {
    vi.useFakeTimers();
    mockGet.mockRejectedValue(new Error("Network Error"));
    const { result } = renderHook(() => useMatchDetail("m1"), { wrapper: makeWrapper() });
    // Advance past retry:3 delays (1s+2s+4s = 7s)
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(result.current.isError).toBe(true);
    vi.useRealTimers();
  });
});
