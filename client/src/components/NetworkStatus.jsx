import { useEffect, useState } from "react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export default function NetworkStatus() {
  const { isOnline, isSlow, slowReason, slowSince, wasOffline } = useNetworkStatus();
  const [dismissed, setDismissed] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isSlow || !slowSince) {
      setElapsed(0);
      return undefined;
    }

    const updateElapsed = () => setElapsed(Math.max(1, Math.floor((Date.now() - slowSince) / 1000)));
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [isSlow, slowSince]);

  useEffect(() => {
    if (isSlow) setDismissed(false);
  }, [isSlow]);

  // 1. Reconnected Banner
  if (wasOffline && isOnline) {
    return (
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] animate-bounce-in">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-emerald-500/90 backdrop-blur-md text-white font-medium text-sm shadow-xl shadow-emerald-500/20 border border-emerald-400/40">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <span>Back online! Reconnected to network.</span>
        </div>
      </div>
    );
  }

  // 2. Offline Mode
  if (!isOnline) {
    return (
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down max-w-[92vw] w-auto">
        <div className="flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-rose-950/80 backdrop-blur-xl text-rose-100 border border-rose-500/30 shadow-2xl shadow-rose-950/50">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-12.728-12.728m12.728 12.728L3 3m5.636 5.636a5 5 0 00-7.072 7.072"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">No Internet Connection</p>
            <p className="text-xs text-rose-300/80">Please check your network settings.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-3 py-1 text-xs font-semibold rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-rose-100 border border-rose-400/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 3. Slow Connection / Server Wakeup Animation
  if (isSlow && !dismissed) {
    return (
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-[9999] animate-slide-up max-w-[380px] w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)]">
        <div className="slow-network-card relative overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 p-4 shadow-2xl shadow-amber-500/15 text-slate-200">
          
          {/* Top animated laser bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 animate-laser-scan" />

          <div className="flex items-start gap-3.5">
            <div className="relative mt-0.5 flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <span className="slow-network-orbit absolute -inset-1 rounded-2xl border border-amber-400/30" />
              <span className="absolute inset-0 rounded-xl bg-amber-400/15 animate-ping opacity-60" />
              <div className="relative flex items-end gap-0.5 h-4">
                <span className="w-1 bg-amber-300 rounded-full animate-signal-1" style={{ height: "40%" }} />
                <span className="w-1 bg-amber-400 rounded-full animate-signal-2" style={{ height: "65%" }} />
                <span className="w-1 bg-orange-400 rounded-full animate-signal-3" style={{ height: "85%" }} />
                <span className="w-1 bg-orange-300 rounded-full animate-signal-4" style={{ height: "100%" }} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="slow-network-dot w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Connecting
                </span>
                <button
                  onClick={() => setDismissed(true)}
                  className="text-slate-400 hover:text-slate-200 text-xs p-1 -mr-1 transition-colors"
                  aria-label="Dismiss notification"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {slowReason || "Connection is slower than usual. Initial data might take a few moments to load."}
              </p>

              <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-amber-200/80">
                <span>Still working</span>
                <span className="slow-network-dots inline-flex gap-0.5"><i /><i /><i /></span>
                {elapsed > 0 && <span className="ml-auto tabular-nums text-slate-400">{elapsed}s</span>}
              </div>

              {/* Shimmer loading track */}
              <div className="mt-2.5 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 rounded-full w-full animate-shimmer-fast" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
