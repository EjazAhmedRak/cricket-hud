import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useLiveScores } from "../../src/hooks/useLiveScores";
import { useAppStore } from "../../src/store/appStore";
import type { Match } from "../../src/api/types";

vi.mock("../../src/api/client", () => ({
  cricketClient: { get: vi.fn() },
}));

import { cricketClient } from "../../src/api/client";
const mockGet = vi.mocked(cricketClient.get);

const MATCHES: Match[] = [
  {
    id: "m1",
    name: "MI vs CSK",
    matchType: "t20",
    status: "live",
    venue: "Wankhede",
    date: "2026-04-21",
    teams: ["Mumbai Indians", "Chennai Super Kings"],
    score: [{ r: 180, w: 7, o: 20, inning: "MI Inning 1" }],
    series_id: "s1",
  },
  {
    id: "m2",
    name: "RCB vs DC",
    matchType: "t20",
    status: "live",
    venue: "Chinnaswamy",
    date: "2026-04-21",
    teams: ["Royal Challengers Bengaluru", "Delhi Capitals"],
    score: [],
    series_id: "s1",
  },
];

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  useAppStore.setState({ pollInterval: 150_000 });
  vi.clearAllMocks();
});

describe("useLiveScores", () => {
  it("fetches and returns live matches", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: MATCHES } });
    const { result } = renderHook(() => useLiveScores(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].id).toBe("m1");
  });

  it("returns match with correct score fields", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: MATCHES } });
    const { result } = renderHook(() => useLiveScores(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const score = result.current.data?.[0].score[0];
    expect(score?.r).toBe(180);
    expect(score?.w).toBe(7);
    expect(score?.o).toBe(20);
  });

  it("sets isLoading true initially", () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: MATCHES } });
    const { result } = renderHook(() => useLiveScores(), { wrapper: makeWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it("sets isError on API failure", async () => {
    vi.useFakeTimers();
    mockGet.mockRejectedValue(new Error("Network Error"));
    const { result } = renderHook(() => useLiveScores(), { wrapper: makeWrapper() });
    // Advance past retry:5 delays (1s+2s+4s+8s+16s = 31s)
    await act(() => vi.advanceTimersByTimeAsync(35_000));
    expect(result.current.isError).toBe(true);
    vi.useRealTimers();
  });

  it("returns empty array when API data is empty", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: [] } });
    const { result } = renderHook(() => useLiveScores(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(0);
  });
});
