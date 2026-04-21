# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cricket HUD is a private macOS desktop app (not distributed publicly) that displays live cricket scores in an always-on-top transparent floating banner. It targets IPL, franchise leagues, and international matches (Test, ODI, T20I). The app runs only on the developer's MacBook — no code signing, notarization, or CI/CD is in scope.

## Development Commands

```bash
# Start dev server with hot reload (Vite frontend + Rust backend together)
npm run tauri dev

# Frontend-only dev server (no Tauri window — useful for UI iteration)
npm run dev

# Production build → produces .app bundle + DMG in src-tauri/target/release/
npm run tauri build

# TypeScript type check
npx tsc --noEmit
```

**Prerequisites**: Rust toolchain + Xcode Command Line Tools. macOS 12+ required (uses macOS Private API for HUD vibrancy).

**Environment**: Copy `.env.example` → `.env` and set `VITE_CRICKET_API_KEY` with a key from CricketData.org (free tier: 100 calls/day; paid M plan: 10,000 calls/day at $12.99/mo — needed for production at 90s polling).

## Architecture

The app is split into a thin Rust shell and a React frontend that communicate over Tauri's IPC bridge.

```
CricketData.org REST API  (polled every 60–120s)
  └─ src/api/client.ts       Axios instance, ?apikey= injection
       └─ src/hooks/          TanStack Query wrappers (never call API directly from components)
            ├─ useLiveScores.ts    → GET /currentMatches  (poll interval, ~90s stale)
            ├─ useMatchDetail.ts   → GET /match_scorecard (1m stale, on match select)
            └─ usePointsTable.ts   → GET /series_info     (5m stale)
                 └─ src/components/   Consume hooks, render HUD panels
```

**Hooks are the API boundary** — components never call the API directly. Swapping the data source means changing one hook file.

### Rust shell (`src-tauri/src/`)

| File | Responsibility |
|------|---------------|
| `main.rs` | App entry, window setup (always-on-top, transparent, vibrancy, skip taskbar) |
| `lib.rs` / `commands.rs` | IPC commands exposed to frontend via `#[tauri::command]` |
| `notifications.rs` | macOS native notifications for wickets and match-start events |

Current IPC commands: `set_window_height(height: f64)` (compact 56px ↔ expanded 376px), `start_dragging()`. To add a command: define `#[tauri::command]` fn, add to `generate_handler![]`, call `invoke("name", args)` in TypeScript.

### State (`src/store/appStore.ts`)

Zustand store persisted to `localStorage` key `cricket-hud-settings`. Holds: selected match ID, view mode (compact/expanded), window opacity, poll interval (30–120s), online status. Single source of truth for all UI state.

### Styling

TailwindCSS v4 with custom HUD tokens in `tailwind.config.ts`: `hud-score`, `hud-label`, `hud-meta` text sizes; macOS-themed green/amber/red palette; monospace font for tabular score digits. `backdrop-blur` + transparency gives the glassmorphism overlay effect.

### Cricket utilities (`src/lib/formatScore.ts`)

All cricket-specific formatting: 20+ team abbreviations (IPL + international), innings display, CRR/RRR calculations, NRR formatting. Add new team mappings here.

## API Reference (CricketData.org)

Base URL: `https://api.cricapi.com/v1/` — every request requires `?apikey={key}`.

| Endpoint | Used for | Polling |
|----------|----------|---------|
| `GET /currentMatches?offset=0` | Live scores for HUD banner | Every 60–120s |
| `GET /match_scorecard?id={matchId}` | Full batting/bowling detail when match selected | On demand, 1m stale |
| `GET /series?offset=0` | Resolve series names, populate tournament filter | On demand, 5m stale |
| `GET /series_info?id={seriesId}` | Points table standings | On demand, 5m stale |

Key fields from `/currentMatches`: `id` (UUID for scorecard lookup), `matchType` ("t20"/"odi"/"test"), `score[].r/.w/.o` (runs/wickets/overs per innings), `series_id` (for points table).

## Key Design Decisions

- **No websockets** — REST polling at 60–120s is sufficient given the 5-minute data delay tolerance of the API
- **`networkMode: "always"`** — React Query shows cached data when offline; `OfflineBanner` displays on network loss, app never crashes without internet
- **shadcn/ui** — copy-in only components that are needed; no unused code ships
- **Rust kept minimal** — window config, tray, notification dispatch only; all cricket logic is TypeScript
- **Out of scope**: player stats, match schedules, social features, App Store distribution, mobile/web

## Known Build Issues

### `Permission opener:default not found` (fixed)

The Tauri scaffold template adds `"opener:default"` to `src-tauri/capabilities/default.json`, but `tauri-plugin-opener` is not included as a Rust dependency in `Cargo.toml` and the permission does not exist in this build. This causes the Rust build script to fail with:

```
Permission opener:default not found
```

**Fix**: Remove `"opener:default"` from the `permissions` array in `src-tauri/capabilities/default.json`. The app does not use shell/opener functionality.

## Performance Targets

- RAM: < 100 MB (idle target 30–50 MB using WKWebView, not bundled Chromium)
- App bundle: ~3–10 MB DMG
- Data latency: < 5 seconds (API is inherently a few minutes behind real-time)
