import { useAppStore, type BannerBg } from "../store/appStore";

export function SettingsPanel() {
  const { opacity, setOpacity, pollInterval, setPollInterval, bannerBg, setBannerBg } = useAppStore();

  const BG_OPTIONS: { label: string; value: BannerBg; swatch: string; textClass: string }[] = [
    { label: "Black",      value: "black",      swatch: "#0c0c0c",  textClass: "text-white/70" },
    { label: "White",      value: "white",      swatch: "#ffffff",  textClass: "text-black/70" },
    { label: "Neon Green", value: "neon-green", swatch: "#39ff14",  textClass: "text-black/70" },
  ];

  const POLL_OPTIONS: { label: string; ms: number }[] = [
    { label: "30s",  ms: 30_000 },
    { label: "60s",  ms: 60_000 },
    { label: "90s",  ms: 90_000 },
    { label: "2m",   ms: 120_000 },
    { label: "2.5m", ms: 150_000 },
  ];

  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      {/* Opacity */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
          Opacity — {Math.round(opacity * 100)}%
        </label>
        <input
          type="range"
          min={50}
          max={100}
          value={Math.round(opacity * 100)}
          onChange={(e) => setOpacity(Number(e.target.value) / 100)}
          className="w-full h-1 appearance-none rounded-full bg-white/20 accent-hud-accent cursor-pointer"
        />
      </div>

      {/* Poll interval */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
          Refresh every
        </label>
        <div className="flex gap-1.5">
          {POLL_OPTIONS.map((opt) => (
            <button
              key={opt.ms}
              onClick={() => setPollInterval(opt.ms)}
              className={[
                "flex-1 py-1 rounded text-[11px] font-medium transition-colors",
                pollInterval === opt.ms
                  ? "bg-hud-accent text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Background colour */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
          Banner colour
        </label>
        <div className="flex gap-1.5">
          {BG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBannerBg(opt.value)}
              className={[
                "flex-1 py-1 rounded text-[11px] font-medium transition-all flex items-center justify-center gap-1.5",
                bannerBg === opt.value
                  ? "ring-2 ring-hud-accent ring-offset-1 ring-offset-black"
                  : "opacity-70 hover:opacity-100",
              ].join(" ")}
              style={{ background: opt.swatch }}
            >
              <span className={opt.textClass}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Attribution */}
      <p className="text-[9px] text-white/20 text-center pt-1">
        Data: cricketdata.org · ~5 min delay
      </p>
    </div>
  );
}
