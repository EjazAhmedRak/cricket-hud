import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Tauri IPC — not available in jsdom
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

// Mock Tauri log plugin
vi.mock("@tauri-apps/plugin-log", () => ({
  trace: vi.fn().mockResolvedValue(undefined),
  debug: vi.fn().mockResolvedValue(undefined),
  info:  vi.fn().mockResolvedValue(undefined),
  warn:  vi.fn().mockResolvedValue(undefined),
  error: vi.fn().mockResolvedValue(undefined),
}));
