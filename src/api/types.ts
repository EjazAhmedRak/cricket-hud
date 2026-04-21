// ── CricketData.org API types ────────────────────────────────────────────────

export interface InningsScore {
  r: number;       // runs
  w: number;       // wickets
  o: number;       // overs
  inning: string;  // e.g. "Mumbai Indians Inning 1"
}

export interface Match {
  id: string;
  name: string;
  matchType: "t20" | "odi" | "test" | string;
  status: string;
  venue: string;
  date: string;
  dateTimeGMT?: string;
  teams: string[];
  score: InningsScore[];
  series_id?: string;
  fantasyEnabled?: boolean;
}

// ── Scorecard types ──────────────────────────────────────────────────────────

export interface BatsmanRow {
  batsman: string;
  dismissal?: string;
  r: number;   // runs
  b: number;   // balls
  "4s": number;
  "6s": number;
  sr: number;  // strike rate
}

export interface BowlerRow {
  bowler: string;
  o: number;   // overs
  m: number;   // maidens
  r: number;   // runs
  w: number;   // wickets
  eco: number; // economy
}

export interface ScorecardInnings {
  inning: string;
  r: number;
  w: number;
  o: number;
  batting: BatsmanRow[];
  bowling: BowlerRow[];
}

export interface Scorecard {
  id: string;
  name: string;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  teams: string[];
  scorecard: ScorecardInnings[];
}

// ── Series / Points Table types ──────────────────────────────────────────────

export interface Series {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  odi: number;
  t20: number;
  test: number;
  matches: number;
}

// Field names as returned by /series_points
export interface PointsTableRow {
  team: string;
  teamId?: string;
  matchesPlayed: number;
  won: number;
  lost: number;
  nr?: number;        // no result
  points: number;
  nrr: string;        // net run rate as string e.g. "+0.812"
}

// Raw shape from /series_points before normalisation (actual API fields confirmed from logs)
export interface RawPointsRow {
  team?: string;
  teamname?: string;   // confirmed actual field name
  teamName?: string;
  shortname?: string;
  teamId?: string;
  matches?: number;    // confirmed actual field name
  matchesPlayed?: number;
  wins?: number;       // confirmed actual field name
  won?: number;
  matchesWon?: number;
  loss?: number;       // confirmed actual field name
  lost?: number;
  matchesLost?: number;
  ties?: number;
  nr?: number;
  noResult?: number;
  points?: number;
  pts?: number;
  nrr?: string;
}

export interface SeriesPoints {
  id?: string;
  name?: string;
  pointsTable: RawPointsRow[];
}

export interface SeriesDetails {
  id: string;
  name: string;
  enddate?: string;
  odi: number;
  t20: number;
  test: number;
  matches: number;
}

// Actual shape of /series_info response: { info: {...}, matchList: [...], pointsTable?: [...] }
export interface SeriesInfo {
  info: SeriesDetails;
  matchList?: { id: string; name: string }[];
  pointsTable?: PointsTableRow[];
}

// ── API response envelope ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  apikey: string;
  data: T;
  status: "success" | "failure";
  reason?: string;
  info?: {
    hitsToday: number;
    hitsLimit: number;
    credits: number;
    server: number;
    offsetRows: number;
    totalRows: number;
    queryTime: number;
    s: number;
    cache: number;
  };
}
