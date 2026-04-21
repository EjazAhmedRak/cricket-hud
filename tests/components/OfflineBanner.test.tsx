import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OfflineBanner } from "../../src/components/OfflineBanner";

describe("OfflineBanner", () => {
  it("renders the offline message", () => {
    render(<OfflineBanner />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
    expect(screen.getByText(/last known scores/i)).toBeInTheDocument();
  });
});
