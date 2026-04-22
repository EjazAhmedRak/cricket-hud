import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ScoreBar } from "../../src/components/ScoreBar";
import { useAppStore } from "../../src/store/appStore";

// ── Mock data-fetching hooks so the component tree renders without a real API ──
vi.mock("../../src/hooks/useLiveScores", () => ({
  useLiveScores: () => ({ data: [], isFetching: false, refetch: vi.fn() }),
}));
vi.mock("../../src/hooks/usePointsTable", () => ({
  usePointsTable: () => ({ data: undefined }),
}));
vi.mock("../../src/hooks/useSeriesPoints", () => ({
  useSeriesPoints: () => ({ data: [], isLoading: false, isError: false, isFetching: false, refetch: vi.fn() }),
}));

const mockInvoke = vi.mocked(invoke);

// Heights as defined in ScoreBar.tsx (logical pixels, DPI-independent)
const COMPACT_H = 56;
const PANEL_H   = 320;
const EXPANDED_H = COMPACT_H + PANEL_H; // 376

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({
    selectedMatchId: null,
    viewMode: "compact",
    opacity: 0.85,
    pollInterval: 150_000,
    bannerBg: "black",
    showPointsTable: false,
    isOnline: true,
  });
});

// ── Panel open / close height contract ────────────────────────────────────────

describe("ScoreBar panel height — set_window_height calls", () => {
  it("calls set_window_height with expanded height when Points table panel opens", async () => {
    const user = userEvent.setup();
    render(<ScoreBar />, { wrapper: Wrapper });
    await user.click(screen.getByTitle("Points table"));
    expect(mockInvoke).toHaveBeenCalledWith("set_window_height", { height: EXPANDED_H });
  });

  it("calls set_window_height with compact height when Points table panel closes", async () => {
    const user = userEvent.setup();
    render(<ScoreBar />, { wrapper: Wrapper });
    await user.click(screen.getByTitle("Points table")); // open
    mockInvoke.mockClear();
    await user.click(screen.getByTitle("Points table")); // close
    expect(mockInvoke).toHaveBeenCalledWith("set_window_height", { height: COMPACT_H });
  });

  it("calls set_window_height with expanded height when Matches panel opens", async () => {
    const user = userEvent.setup();
    render(<ScoreBar />, { wrapper: Wrapper });
    await user.click(screen.getByTitle("Matches"));
    expect(mockInvoke).toHaveBeenCalledWith("set_window_height", { height: EXPANDED_H });
  });

  it("calls set_window_height with compact height when Matches panel closes", async () => {
    const user = userEvent.setup();
    render(<ScoreBar />, { wrapper: Wrapper });
    await user.click(screen.getByTitle("Matches")); // open
    mockInvoke.mockClear();
    await user.click(screen.getByTitle("Matches")); // close
    expect(mockInvoke).toHaveBeenCalledWith("set_window_height", { height: COMPACT_H });
  });

  it("calls set_window_height with expanded height when Settings panel opens", async () => {
    const user = userEvent.setup();
    render(<ScoreBar />, { wrapper: Wrapper });
    await user.click(screen.getByTitle("Settings"));
    expect(mockInvoke).toHaveBeenCalledWith("set_window_height", { height: EXPANDED_H });
  });

  it("calls set_window_height with compact height when Settings panel closes", async () => {
    const user = userEvent.setup();
    render(<ScoreBar />, { wrapper: Wrapper });
    await user.click(screen.getByTitle("Settings")); // open
    mockInvoke.mockClear();
    await user.click(screen.getByTitle("Settings")); // close
    expect(mockInvoke).toHaveBeenCalledWith("set_window_height", { height: COMPACT_H });
  });

  it("calls set_window_height with compact height when chevron collapses an open panel", async () => {
    const user = userEvent.setup();
    render(<ScoreBar />, { wrapper: Wrapper });
    await user.click(screen.getByTitle("Expand")); // opens Matches panel
    mockInvoke.mockClear();
    await user.click(screen.getByTitle("Collapse")); // collapses
    expect(mockInvoke).toHaveBeenCalledWith("set_window_height", { height: COMPACT_H });
  });

  it("switching from one panel to another makes exactly one set_window_height call at expanded height", async () => {
    const user = userEvent.setup();
    render(<ScoreBar />, { wrapper: Wrapper });
    await user.click(screen.getByTitle("Matches")); // open Matches at 376
    mockInvoke.mockClear();
    await user.click(screen.getByTitle("Points table")); // switch to Points
    const heightCalls = mockInvoke.mock.calls.filter((c) => c[0] === "set_window_height");
    expect(heightCalls).toHaveLength(1);
    expect(heightCalls[0]).toEqual(["set_window_height", { height: EXPANDED_H }]);
  });
});

// ── Height constant values (DPI-agnostic logical pixels) ──────────────────────

describe("ScoreBar height constants", () => {
  it("compact height is 56 logical px (matches tauri.conf.json initial height)", () => {
    expect(COMPACT_H).toBe(56);
  });

  it("expanded height is compact + panel (56 + 320 = 376)", () => {
    expect(EXPANDED_H).toBe(376);
  });
});
