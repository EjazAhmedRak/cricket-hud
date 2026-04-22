import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useSeriesPoints } from "../../src/hooks/useSeriesPoints";
import type { RawPointsRow } from "../../src/api/types";

vi.mock("../../src/api/client", () => ({
  cricketClient: { get: vi.fn() },
}));

import { cricketClient } from "../../src/api/client";
const mockGet = vi.mocked(cricketClient.get);

// Matches actual API field names confirmed from logs
const RAW_ROWS: RawPointsRow[] = [
  { teamname: "Mumbai Indians",              matches: 10, wins: 7, loss: 3, nrr: "+0.812" },
  { teamname: "Chennai Super Kings",         matches: 10, wins: 6, loss: 4, nrr: "+0.350" },
  { teamname: "Royal Challengers Bengaluru", matches: 10, wins: 5, loss: 5, nrr: "-0.120" },
  { teamname: "Delhi Capitals",              matches: 10, wins: 3, loss: 7, nrr: "-0.650" },
];

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe("useSeriesPoints", () => {
  it("does not fetch when seriesId is null", () => {
    const { result } = renderHook(() => useSeriesPoints(null), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("fetches and normalises rows when seriesId is provided", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: RAW_ROWS } });
    const { result } = renderHook(() => useSeriesPoints("s1"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(4);
  });

  it("maps teamname → team", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: RAW_ROWS } });
    const { result } = renderHook(() => useSeriesPoints("s1"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].team).toBe("Mumbai Indians");
  });

  it("maps wins → won and derives points as wins * 2", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: RAW_ROWS } });
    const { result } = renderHook(() => useSeriesPoints("s1"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const mi = result.current.data?.[0];
    expect(mi?.won).toBe(7);
    expect(mi?.points).toBe(14);
  });

  it("maps loss → lost", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: RAW_ROWS } });
    const { result } = renderHook(() => useSeriesPoints("s1"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].lost).toBe(3);
  });

  it("maps matches → matchesPlayed", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: RAW_ROWS } });
    const { result } = renderHook(() => useSeriesPoints("s1"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].matchesPlayed).toBe(10);
  });

  it("preserves nrr string as-is", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: RAW_ROWS } });
    const { result } = renderHook(() => useSeriesPoints("s1"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].nrr).toBe("+0.812");
  });

  it("handles wrapped pointsTable response shape", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: { pointsTable: RAW_ROWS } } });
    const { result } = renderHook(() => useSeriesPoints("s1"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(4);
  });

  it("returns empty array when data has no rows", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: {} } });
    const { result } = renderHook(() => useSeriesPoints("s1"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(0);
  });

  it("sets isError on API failure", async () => {
    vi.useFakeTimers();
    mockGet.mockRejectedValue(new Error("Network Error"));
    const { result } = renderHook(() => useSeriesPoints("s1"), { wrapper: makeWrapper() });
    // Advance past retry:3 delays (1s+2s+4s = 7s)
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(result.current.isError).toBe(true);
    vi.useRealTimers();
  });
});
