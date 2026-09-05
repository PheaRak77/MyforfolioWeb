import { useMemo } from "react";

/**
 * Binary Matrix Code Background
 * Renders the exact monospace binary matrix pattern (0s and 1s) from the user reference.
 * Tiles seamlessly across the entire screen on Mobile, Tablet, and Desktop in Dark & Light mode.
 */
const BINARY_CHUNKS = [
  "0 1 0 0 1 1 1 0 1 1 0 1 1 1 0 0 0 1 1 0 1 1 1 1 1 0 1 1 1 1 0",
  "1 0 0 0 0 0 1 0 0 1 0 0 1 0 1 1 1 0 0 0 1 1 1 0 1 0 0 1 0 0",
  "0 0 0 0 1 0 1 0 0 0 0 1 1 1 1 0 1 1 1 1 1 0 0 0 1 1 0 1 1 0",
  "1 1 1 1 0 0 1 0 0 1 0 0 1 0 0 1 0 0 1 0 0 1 0 0 0 0 0 1 1 1",
  "0 1 0 0 0 1 1 0 0 1 0 1 0 1 1 0 1 0 1 1 1 0 0 0 1 0 1 0 0 1",
  "0 0 0 1 1 1 1 1 0 1 0 1 0 0 0 0 1 0 1 0 1 0 0 1 1 1 1 0 0 1",
  "0 0 1 1 1 1 1 0 0 0 0 1 0 0 1 0 0 1 0 0 1 1 0 1 1 1 0 0 1 1",
  "1 1 1 1 0 1 1 0 0 1 1 1 1 1 0 1 1 0 1 0 1 1 1 1 1 0 1 1 1 0",
  "1 0 0 1 1 0 1 0 1 0 0 0 0 1 0 0 1 0 0 1 1 0 0 0 1 1 0 0 0 0",
  "0 1 0 0 1 0 0 0 1 1 1 1 0 1 0 1 1 0 1 1 0 1 0 0 1 0 1 1 1 0",
  "0 1 1 1 0 1 1 0 0 1 1 1 0 0 1 1 1 0 0 0 1 0 0 0 0 1 0 1 0 1",
  "0 1 0 0 1 0 0 0 1 0 0 0 1 1 0 0 0 1 0 0 1 1 0 0 1 1 0 0 1 0",
  "0 1 1 1 0 1 1 0 1 1 0 1 1 0 0 1 0 0 0 0 1 0 0 1 1 0 1 0 1 1",
  "1 0 1 0 0 0 0 0 0 1 1 0 1 0 0 1 1 0 1 1 1 1 0 1 0 1 1 1 0 0 1",
  "0 0 1 1 1 1 0 0 0 0 1 1 0 0 0 1 1 0 1 1 1 1 1 0 0 1 1 1 1 1 0",
  "1 1 0 0 0 1 1 0 0 0 1 0 1 1 1 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0",
  "1 1 0 0 1 1 1 0 1 0 1 1 0 1 0 1 0 1 0 1 0 0 1 1 1 0 0 0 1 1",
  "1 0 0 0 1 1 1 1 1 0 1 0 0 1 1 0 1 0 1 0 0 0 0 0 0 0 1 0 1 0",
  "0 1 0 0 0 1 0 0 0 0 0 1 0 1 1 1 0 1 1 0 0 0 0 0 0 0 0 1 0 1 0",
  "0 1 1 0 1 0 0 0 1 0 0 1 0 1 1 1 1 0 1 0 0 1 0 0 1 1 0 0 1 0",
  "1 1 1 0 0 0 1 0 1 0 1 0 0 0 0 0 1 0 1 1 1 0 0 0 1 0 1 0 1 0",
  "0 1 0 0 1 0 1 1 0 1 1 0 1 0 0 1 1 1 1 0 1 0 1 0 0 0 0 1 0 0",
  "1 0 0 1 0 0 1 0 1 0 0 0 0 0 1 1 1 0 1 0 1 0 0 1 1 0 0 0 0 1",
  "0 1 0 0 1 1 0 1 0 0 0 1 1 1 0 0 0 1 1 1 0 1 0 1 0 1 0 1 1 1",
  "0 1 0 1 0 1 1 0 1 0 1 1 1 1 0 0 0 1 1 0 1 0 0 1 1 0 1 1 1 1",
  "0 1 0 0 1 1 1 0 0 0 0 1 0 0 1 0 1 0 1 1 1 0 0 0 0 0 0 0 1 1",
  "1 0 0 1 0 0 0 1 1 1 0 0 0 0 0 0 1 0 1 0 0 1 1 1 0 1 1 0 0 1",
];

export default function MotionBackground() {
  // Tile binary strings horizontally to fill any ultra-wide or 4K screen
  const tiledRows = useMemo(() => {
    const rows = [];
    // Repeat vertically 4 times (108 lines) to cover entire viewport height
    for (let loop = 0; loop < 4; loop++) {
      for (let i = 0; i < BINARY_CHUNKS.length; i++) {
        const single = BINARY_CHUNKS[i];
        // Repeat horizontally 4 times so line fills full screen width
        rows.push(`${single}  ${single}  ${single}  ${single}`);
      }
    }
    return rows;
  }, []);

  return (
    <div
      className="portfolio-motion-bg fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Full-Screen Monospace Binary Code Matrix Grid */}
      <div className="binary-matrix-layer absolute inset-0 flex flex-col justify-start items-center overflow-hidden opacity-90">
        <div className="font-mono text-[11px] sm:text-[13px] md:text-[14px] lg:text-[15px] leading-[1.7] sm:leading-[1.8] tracking-[0.32em] sm:tracking-[0.42em] whitespace-nowrap text-slate-800/[0.18] dark:text-slate-400/[0.32] w-[140vw] text-center font-medium select-none">
          {tiledRows.map((row, idx) => (
            <div
              key={idx}
              className={`select-none ${
                idx % 3 === 0
                  ? "text-slate-900/[0.22] dark:text-slate-300/[0.42]"
                  : idx % 3 === 1
                  ? "text-slate-800/[0.16] dark:text-slate-400/[0.30]"
                  : "text-slate-700/[0.12] dark:text-slate-500/[0.22]"
              }`}
            >
              {row}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Gentle ambient lighting depth (Subtle glow, no harsh yellow washout) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50/60 dark:to-[#070b14]/75 pointer-events-none" />
    </div>
  );
}


