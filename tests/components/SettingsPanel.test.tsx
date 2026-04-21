import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPanel } from "../../src/components/SettingsPanel";
import { useAppStore } from "../../src/store/appStore";

beforeEach(() => {
  useAppStore.setState({
    opacity: 0.85,
    pollInterval: 150_000,
    bannerBg: "black",
    selectedMatchId: null,
    viewMode: "compact",
    showPointsTable: false,
    isOnline: true,
  });
});

describe("SettingsPanel", () => {
  it("renders poll interval options", () => {
    render(<SettingsPanel />);
    expect(screen.getByText("30s")).toBeInTheDocument();
    expect(screen.getByText("60s")).toBeInTheDocument();
    expect(screen.getByText("90s")).toBeInTheDocument();
    expect(screen.getByText("2m")).toBeInTheDocument();
    expect(screen.getByText("2.5m")).toBeInTheDocument();
  });

  it("renders banner colour options", () => {
    render(<SettingsPanel />);
    expect(screen.getByText("Black")).toBeInTheDocument();
    expect(screen.getByText("White")).toBeInTheDocument();
    expect(screen.getByText("Neon Green")).toBeInTheDocument();
  });

  it("renders the opacity slider", () => {
    render(<SettingsPanel />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("updates pollInterval in store when a button is clicked", async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    await user.click(screen.getByText("60s"));
    expect(useAppStore.getState().pollInterval).toBe(60_000);
  });

  it("updates bannerBg in store when a colour is selected", async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    await user.click(screen.getByText("White"));
    expect(useAppStore.getState().bannerBg).toBe("white");
  });

  it("updates opacity in store when slider changes", () => {
    render(<SettingsPanel />);
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "70" } });
    expect(useAppStore.getState().opacity).toBeCloseTo(0.7, 5);
  });
});
