import { useEffect } from "react";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { ScoreBar } from "./components/ScoreBar";
import { useAppStore } from "./store/appStore";
import { createLogger } from "./lib/logger";

const log = createLogger("Query");

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) =>
      log.error(`failed [${String(query.queryKey[0])}]`, error.message),
    onSuccess: (_data, query) =>
      log.info(`success [${String(query.queryKey[0])}]`),
  }),
  defaultOptions: {
    queries: {
      gcTime: 10 * 60_000,
    },
  },
});

const appLog = createLogger("App");

function AppInner() {
  const setIsOnline = useAppStore((s) => s.setIsOnline);

  useEffect(() => {
    appLog.info("mounted");
    const handleOnline  = () => { appLog.info("network online");  setIsOnline(true); };
    const handleOffline = () => { appLog.warn("network offline"); setIsOnline(false); };
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOnline]);

  return <ScoreBar />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
