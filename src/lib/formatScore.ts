import type { InningsScore, Match } from "../api/types";

// ── Overs formatting ─────────────────────────────────────────────────────────

/** Format overs to one decimal place: 14.4 → "14.4", 20 → "20" */
export function formatOvers(overs: number): string {
  return Number.isInteger(overs) ? String(overs) : overs.toFixed(1);
}

// ── Innings score line ───────────────────────────────────────────────────────

/** "190/7 (20)" */
export function formatInnings(s: InningsScore): string {
  return `${s.r}/${s.w} (${formatOvers(s.o)})`;
}

/** Short team name from a full innings string:
 *  "Mumbai Indians Inning 1" → "MI"  (falls back to first 3 chars)
 */
const TEAM_ABBR: Record<string, string> = {
  "Mumbai Indians": "MI",
  "Chennai Super Kings": "CSK",
  "Royal Challengers Bengaluru": "RCB",
  "Royal Challengers Bangalore": "RCB",
  "Kolkata Knight Riders": "KKR",
  "Delhi Capitals": "DC",
  "Rajasthan Royals": "RR",
  "Punjab Kings": "PBKS",
  "Sunrisers Hyderabad": "SRH",
  "Lucknow Super Giants": "LSG",
  "Gujarat Titans": "GT",
  India: "IND",
  Australia: "AUS",
  England: "ENG",
  "New Zealand": "NZ",
  "South Africa": "SA",
  Pakistan: "PAK",
  "Sri Lanka": "SL",
  Bangladesh: "BAN",
  "West Indies": "WI",
  Zimbabwe: "ZIM",
  Afghanistan: "AFG",
};

export function teamAbbr(teamName: string): string {
  if (TEAM_ABBR[teamName]) return TEAM_ABBR[teamName];
  // Attempt initials from multi-word names
  const words = teamName.split(" ").filter(Boolean);
  if (words.length >= 2) return words.map((w) => w[0]).join("").toUpperCase();
  return teamName.slice(0, 3).toUpperCase();
}

/** Extract team name from innings string:
 *  "Mumbai Indians Inning 1" → "Mumbai Indians"
 */
export function teamFromInning(inning: string): string {
  return inning.replace(/ Inning \d+$/, "").replace(/ Innings \d+$/, "").trim();
}

// ── Run rate ─────────────────────────────────────────────────────────────────

/** Current run rate: runs / overs */
export function calcCRR(runs: number, overs: number): string {
  if (overs === 0) return "0.00";
  return (runs / overs).toFixed(2);
}

/** Required run rate for the chasing team in limited overs */
export function calcRRR(
  target: number,
  currentRuns: number,
  oversLeft: number
): string {
  if (oversLeft <= 0) return "∞";
  const needed = target - currentRuns;
  if (needed <= 0) return "0.00";
  return (needed / oversLeft).toFixed(2);
}

// ── Match status helpers ─────────────────────────────────────────────────────

/** Returns the "live" innings (batting innings) from a match's score array */
export function liveInnings(match: Match): InningsScore | null {
  if (!match.score || match.score.length === 0) return null;
  // The last score entry is the currently batting innings
  return match.score[match.score.length - 1];
}

/** Returns target score for chasing team (second innings) */
export function getTarget(match: Match): number | null {
  if (match.score.length < 2) return null;
  // Only applies to limited-overs formats
  if (match.matchType === "test") return null;
  const firstInnings = match.score[0];
  return firstInnings.r + 1;
}

/** Friendly NRR display: ensures sign prefix */
export function formatNRR(nrr: string | number): string {
  const n = typeof nrr === "string" ? parseFloat(nrr) : nrr;
  if (isNaN(n)) return "—";
  return n >= 0 ? `+${n.toFixed(3)}` : n.toFixed(3);
}

/** Truncate long match names for the banner */
export function shortMatchName(name: string, maxLen = 36): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 1) + "…";
}
