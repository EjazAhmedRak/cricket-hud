import { describe, it, expect } from "vitest";
import {
  formatOvers,
  formatInnings,
  teamAbbr,
  teamFromInning,
  calcCRR,
  calcRRR,
  liveInnings,
  getTarget,
  formatNRR,
  shortMatchName,
} from "../../src/lib/formatScore";
import type { Match } from "../../src/api/types";

// ── formatOvers ───────────────────────────────────────────────────────────────
describe("formatOvers", () => {
  it("returns integer overs without decimal", () => {
    expect(formatOvers(20)).toBe("20");
  });

  it("returns fractional overs with one decimal place", () => {
    expect(formatOvers(14.4)).toBe("14.4");
  });
});

// ── formatInnings ─────────────────────────────────────────────────────────────
describe("formatInnings", () => {
  it("formats a complete innings", () => {
    expect(formatInnings({ r: 190, w: 7, o: 20, inning: "MI Inning 1" })).toBe("190/7 (20)");
  });

  it("formats fractional overs", () => {
    expect(formatInnings({ r: 85, w: 3, o: 12.3, inning: "CSK Inning 1" })).toBe("85/3 (12.3)");
  });
});

// ── teamAbbr ──────────────────────────────────────────────────────────────────
describe("teamAbbr", () => {
  it("returns known IPL abbreviations", () => {
    expect(teamAbbr("Mumbai Indians")).toBe("MI");
    expect(teamAbbr("Chennai Super Kings")).toBe("CSK");
    expect(teamAbbr("Royal Challengers Bengaluru")).toBe("RCB");
    expect(teamAbbr("Royal Challengers Bangalore")).toBe("RCB");
  });

  it("returns known international abbreviations", () => {
    expect(teamAbbr("India")).toBe("IND");
    expect(teamAbbr("Australia")).toBe("AUS");
    expect(teamAbbr("West Indies")).toBe("WI");
  });

  it("generates initials for unknown multi-word teams", () => {
    expect(teamAbbr("United Arab Emirates")).toBe("UAE");
    expect(teamAbbr("New South Wales")).toBe("NSW");
  });

  it("truncates to 3 chars for single-word unknown teams", () => {
    expect(teamAbbr("Nepal")).toBe("NEP");
  });
});

// ── teamFromInning ────────────────────────────────────────────────────────────
describe("teamFromInning", () => {
  it("strips 'Inning N' suffix", () => {
    expect(teamFromInning("Mumbai Indians Inning 1")).toBe("Mumbai Indians");
  });

  it("strips 'Innings N' suffix", () => {
    expect(teamFromInning("India Innings 2")).toBe("India");
  });

  it("returns string unchanged when no suffix", () => {
    expect(teamFromInning("Australia")).toBe("Australia");
  });
});

// ── calcCRR ───────────────────────────────────────────────────────────────────
describe("calcCRR", () => {
  it("returns 0.00 when no overs bowled", () => {
    expect(calcCRR(0, 0)).toBe("0.00");
  });

  it("calculates run rate correctly", () => {
    expect(calcCRR(180, 20)).toBe("9.00");
    expect(calcCRR(100, 12.4)).toBe("8.06");
  });
});

// ── calcRRR ───────────────────────────────────────────────────────────────────
describe("calcRRR", () => {
  it("returns ∞ when no overs left", () => {
    expect(calcRRR(200, 150, 0)).toBe("∞");
  });

  it("returns 0.00 when target already met", () => {
    expect(calcRRR(180, 181, 5)).toBe("0.00");
  });

  it("calculates required rate correctly", () => {
    expect(calcRRR(200, 100, 10)).toBe("10.00");
    expect(calcRRR(185, 80, 8)).toBe("13.13");
  });
});

// ── liveInnings ───────────────────────────────────────────────────────────────
describe("liveInnings", () => {
  const base: Match = {
    id: "1", name: "Test", matchType: "t20", status: "live",
    venue: "Eden Gardens", date: "2026-04-21", teams: [], score: [],
  };

  it("returns null for a match with no score", () => {
    expect(liveInnings(base)).toBeNull();
  });

  it("returns the last innings entry", () => {
    const match: Match = {
      ...base,
      score: [
        { r: 180, w: 10, o: 20, inning: "MI Inning 1" },
        { r: 95,  w: 3,  o: 10, inning: "CSK Inning 1" },
      ],
    };
    expect(liveInnings(match)).toEqual({ r: 95, w: 3, o: 10, inning: "CSK Inning 1" });
  });
});

// ── getTarget ─────────────────────────────────────────────────────────────────
describe("getTarget", () => {
  const base: Match = {
    id: "1", name: "Test", matchType: "t20", status: "live",
    venue: "Eden Gardens", date: "2026-04-21", teams: [], score: [],
  };

  it("returns null when only one innings", () => {
    expect(getTarget({ ...base, score: [{ r: 180, w: 10, o: 20, inning: "MI Inning 1" }] })).toBeNull();
  });

  it("returns first innings runs + 1", () => {
    const match: Match = {
      ...base,
      score: [
        { r: 180, w: 10, o: 20, inning: "MI Inning 1" },
        { r: 50,  w: 2,  o: 8,  inning: "CSK Inning 1" },
      ],
    };
    expect(getTarget(match)).toBe(181);
  });

  it("returns null for Test matches", () => {
    const match: Match = {
      ...base,
      matchType: "test",
      score: [
        { r: 400, w: 10, o: 100, inning: "IND Innings 1" },
        { r: 250, w: 10, o: 80,  inning: "AUS Innings 1" },
      ],
    };
    expect(getTarget(match)).toBeNull();
  });
});

// ── formatNRR ─────────────────────────────────────────────────────────────────
describe("formatNRR", () => {
  it("prefixes positive NRR with +", () => {
    expect(formatNRR("0.812")).toBe("+0.812");
    expect(formatNRR(1.2)).toBe("+1.200");
  });

  it("formats negative NRR without extra sign", () => {
    expect(formatNRR("-0.450")).toBe("-0.450");
  });

  it("returns — for invalid values", () => {
    expect(formatNRR("N/A")).toBe("—");
  });
});

// ── shortMatchName ────────────────────────────────────────────────────────────
describe("shortMatchName", () => {
  it("returns the name unchanged if within limit", () => {
    expect(shortMatchName("India vs Australia")).toBe("India vs Australia");
  });

  it("truncates with ellipsis when over the limit", () => {
    const long = "India vs Australia, 1st T20I, India tour of Australia 2026";
    const result = shortMatchName(long, 36);
    expect(result.length).toBe(36);
    expect(result.endsWith("…")).toBe(true);
  });
});
