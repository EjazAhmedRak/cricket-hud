import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "../../src/store/appStore";

beforeEach(() => {
  // Reset store to initial state between tests
  useAppStore.setState({
    selectedMatchId: null,
    viewMode: "compact",
    opacity: 0.85,
    pollInterval: 150_000,
    showPointsTable: false,
    bannerBg: "black",
    isOnline: true,
  });
});

describe("selectedMatchId", () => {
  it("starts as null", () => {
    expect(useAppStore.getState().selectedMatchId).toBeNull();
  });

  it("updates on setSelectedMatchId", () => {
    useAppStore.getState().setSelectedMatchId("match-123");
    expect(useAppStore.getState().selectedMatchId).toBe("match-123");
  });

  it("can be cleared back to null", () => {
    useAppStore.getState().setSelectedMatchId("match-123");
    useAppStore.getState().setSelectedMatchId(null);
    expect(useAppStore.getState().selectedMatchId).toBeNull();
  });
});

describe("opacity", () => {
  it("clamps values below 0.5 to 0.5", () => {
    useAppStore.getState().setOpacity(0.1);
    expect(useAppStore.getState().opacity).toBe(0.5);
  });

  it("clamps values above 1.0 to 1.0", () => {
    useAppStore.getState().setOpacity(1.5);
    expect(useAppStore.getState().opacity).toBe(1.0);
  });

  it("accepts valid values within range", () => {
    useAppStore.getState().setOpacity(0.75);
    expect(useAppStore.getState().opacity).toBe(0.75);
  });
});

describe("pollInterval", () => {
  it("clamps values below 30s to 30s", () => {
    useAppStore.getState().setPollInterval(5_000);
    expect(useAppStore.getState().pollInterval).toBe(30_000);
  });

  it("clamps values above 150s to 150s", () => {
    useAppStore.getState().setPollInterval(300_000);
    expect(useAppStore.getState().pollInterval).toBe(150_000);
  });

  it("accepts valid values within range", () => {
    useAppStore.getState().setPollInterval(90_000);
    expect(useAppStore.getState().pollInterval).toBe(90_000);
  });
});

describe("bannerBg", () => {
  it("defaults to black", () => {
    expect(useAppStore.getState().bannerBg).toBe("black");
  });

  it("updates on setBannerBg", () => {
    useAppStore.getState().setBannerBg("neon-green");
    expect(useAppStore.getState().bannerBg).toBe("neon-green");
  });
});

describe("viewMode", () => {
  it("defaults to compact", () => {
    expect(useAppStore.getState().viewMode).toBe("compact");
  });

  it("toggles between compact and expanded", () => {
    useAppStore.getState().toggleViewMode();
    expect(useAppStore.getState().viewMode).toBe("expanded");
    useAppStore.getState().toggleViewMode();
    expect(useAppStore.getState().viewMode).toBe("compact");
  });
});

describe("isOnline", () => {
  it("updates on setIsOnline", () => {
    useAppStore.getState().setIsOnline(false);
    expect(useAppStore.getState().isOnline).toBe(false);
    useAppStore.getState().setIsOnline(true);
    expect(useAppStore.getState().isOnline).toBe(true);
  });
});
