import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] text-yellow-400/90 bg-yellow-400/10 rounded-full border border-yellow-400/20">
      <WifiOff size={11} />
      <span>Offline — showing last known scores</span>
    </div>
  );
}
