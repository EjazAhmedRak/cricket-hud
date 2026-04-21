# Cricket HUD

A macOS desktop app that displays live cricket scores in an always-on-top transparent floating banner. Targets IPL, franchise leagues, and international matches (Test, ODI, T20I).

## Features

- Always-on-top glassmorphism HUD overlay
- Live scores polled every 60–120s from CricketData.org
- Compact (56px) and expanded (376px) view modes
- Full batting/bowling scorecard on match select
- Points table for active tournaments
- macOS native notifications for wickets and match-start events
- Offline-tolerant — shows cached data when network is unavailable

## Prerequisites

| Dependency | Version | Notes |
|---|---|---|
| macOS | 12+ | Required for vibrancy/private API |
| Node.js | 20.19+ or 22.12+ | Vite requirement |
| Rust | stable | Install via [rustup](https://rustup.rs) |
| Xcode Command Line Tools | latest | `xcode-select --install` |

## Environment Setup

Copy `.env.example` to `.env` and set your API key:

```
VITE_CRICKET_API_KEY=your_key_here
```

Get a free key at [CricketData.org](https://cricketdata.org). Free tier allows 100 calls/day; the paid M plan ($12.99/mo) provides 10,000 calls/day and is needed for production use at 90s polling.

## Install Dependencies

```bash
npm install
```

## Development

```bash
# Start dev server with hot reload (Vite frontend + Rust backend)
npm run tauri dev

# Frontend-only (no Tauri window — faster for UI iteration)
npm run dev
```

## Build

```bash
# Production build — outputs .app bundle + DMG in src-tauri/target/release/
npm run tauri build
```

## Tech Stack

| Layer | Technology |
|---|---|
| Shell | Rust + Tauri v2 |
| Frontend | React 19 + TypeScript |
| Styling | TailwindCSS v4 |
| State | Zustand (persisted to localStorage) |
| Data fetching | TanStack Query v5 |
| HTTP | Axios |
| Build | Vite 7 |

## Project Structure

```
src/
  api/client.ts          Axios instance with API key injection
  hooks/                 TanStack Query wrappers (useLiveScores, useMatchDetail, usePointsTable)
  components/            HUD panel components
  store/appStore.ts      Zustand store — single source of truth for UI state
  lib/formatScore.ts     Cricket utilities (team abbreviations, CRR/RRR, formatting)
src-tauri/src/
  main.rs                Window setup (always-on-top, transparent, vibrancy)
  commands.rs            IPC commands exposed to frontend
  notifications.rs       macOS native notifications
```