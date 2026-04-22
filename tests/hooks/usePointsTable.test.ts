import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { usePointsTable } from "../../src/hooks/usePointsTable";
import type { SeriesInfo } from "../../src/api/types";

vi.mock("../../src/api/client", () => ({
  cricketClient: { get: vi.fn() },
}));

import { cricketClient } from "../../src/api/client";
const mockGet = vi.mocked(cricketClient.get);

const SERIES_INFO: SeriesInfo = {
  info: {
    id: "s1",
    name: "Indian Premier League 2026",
    odi: 0,
    t20: 74,
    test: 0,
    matches: 74,
  },
  matchList: [{ id: "m1", name: "MI vs CSK" }],
};

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe("usePointsTable", () => {
  it("does not fetch when seriesId is null", () => {
    const { result } = renderHook(() => usePointsTable(null), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("fetches series info when seriesId is provided", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: SERIES_INFO } });
    const { result } = renderHook(() => usePointsTable("s1"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.info.name).toBe("Indian Premier League 2026");
  });

  it("returns series info with correct match count", async () => {
    mockGet.mockResolvedValue({ data: { status: "success", data: SERIES_INFO } });
    const { result } = renderHook(() => usePointsTable("s1"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.info.t20).toBe(74);
    expect(result.current.data?.matchList).toHaveLength(1);
  });

  it("sets isError on API failure", async () => {
    vi.useFakeTimers();
    mockGet.mockRejectedValue(new Error("Network Error"));
    const { result } = renderHook(() => usePointsTable("s1"), { wrapper: makeWrapper() });
    // Advance past retry:3 delays (1s+2s+4s = 7s)
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(result.current.isError).toBe(true);
    vi.useRealTimers();
  });
});
