import axios from "axios";
import { createLogger } from "../lib/logger";

const log = createLogger("API");

const API_KEY = import.meta.env.VITE_CRICKET_API_KEY ?? "";

if (!API_KEY) {
  log.warn("VITE_CRICKET_API_KEY is not set — create .env with VITE_CRICKET_API_KEY=<key>");
}

export const cricketClient = axios.create({
  baseURL: "https://api.cricapi.com/v1",
  timeout: 10_000,
  params: { apikey: API_KEY },
});

cricketClient.interceptors.request.use((config) => {
  log.debug(`→ ${config.method?.toUpperCase()} ${config.url}`, config.params);
  return config;
});

cricketClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data?.status === "failure") {
      const err = new Error(`CricketData API error: ${data.reason ?? "unknown"}`);
      log.error(`✗ ${response.config.url}`, err.message);
      return Promise.reject(err);
    }
    log.debug(`✓ ${response.config.url} (${response.status})`);
    return response;
  },
  (error) => {
    log.error(`✗ ${error.config?.url ?? "unknown"}`, error.message);
    return Promise.reject(error);
  }
);
