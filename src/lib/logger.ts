import log from "loglevel";
import * as tauriLog from "@tauri-apps/plugin-log";

// Colour palette — each namespace gets a stable colour
const NS_COLORS = [
  "#0A84FF", "#BF5AF2", "#FF9F0A", "#34C759",
  "#FF453A", "#5AC8FA", "#FF6B6B", "#FFD60A",
];
const LEVEL_STYLES: Record<string, string> = {
  TRACE: "color:#555",
  DEBUG: "color:#888",
  INFO:  "color:#34C759;font-weight:bold",
  WARN:  "color:#FF9F0A;font-weight:bold",
  ERROR: "color:#FF453A;font-weight:bold",
};

let colorIndex = 0;
const colorMap = new Map<string, string>();
function pickColor(ns: string): string {
  if (!colorMap.has(ns)) colorMap.set(ns, NS_COLORS[colorIndex++ % NS_COLORS.length]);
  return colorMap.get(ns)!;
}

// Map loglevel method names to tauri-plugin-log functions
const tauriLogFn: Record<string, (msg: string) => Promise<void>> = {
  trace: (m) => tauriLog.trace(m),
  debug: (m) => tauriLog.debug(m),
  info:  (m) => tauriLog.info(m),
  warn:  (m) => tauriLog.warn(m),
  error: (m) => tauriLog.error(m),
};

const isDebug = import.meta.env.DEV || import.meta.env.VITE_DEBUG === "true";
log.setDefaultLevel(isDebug ? log.levels.DEBUG : log.levels.WARN);

// Track configured loggers so HMR re-evaluation doesn't double-wrap methodFactory
const configured = new Set<string>();

export function createLogger(namespace: string) {
  const logger = log.getLogger(namespace);
  const nsColor = pickColor(namespace);

  if (!configured.has(namespace)) {
    configured.add(namespace);

    const originalFactory = logger.methodFactory;
    logger.methodFactory = (methodName, logLevel, loggerName) => {
      const rawMethod = originalFactory(methodName, logLevel, loggerName);
      const levelKey = methodName.toUpperCase();
      const tauriFn = tauriLogFn[methodName];

      return (...args: unknown[]) => {
        const ts = new Date().toISOString().slice(11, 23);

        // Browser console — colour-coded
        rawMethod(
          `%c${ts}%c [${String(loggerName)}]%c`,
          "color:#555;font-size:10px",
          `color:${nsColor};font-weight:bold`,
          LEVEL_STYLES[levelKey] ?? "",
          ...args,
        );

        // File via Tauri log plugin — plain text, fire-and-forget
        const message = `[${String(loggerName)}] ${args.map((a) =>
          typeof a === "object" ? JSON.stringify(a) : String(a)
        ).join(" ")}`;
        tauriFn?.(message).catch(() => {});
      };
    };

    logger.setLevel(logger.getLevel());
  }

  return logger;
}
