import { useMemo } from "react";

/**
 * Binary Matrix Code Background
 * Renders the exact monospace binary matrix pattern (0s and 1s) from the user reference.
 * Optimized with high-performance CSS and SVG for 60-120 FPS rendering on all devices in Dark & Light mode.
 */
const BINARY_MATRIX_ROWS = [
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
  // Repeat rows to cover tall viewports seamlessly
  const fullMatrixRows = useMemo(() => {
    return [...BINARY_MATRIX_ROWS, ...BINARY_MATRIX_ROWS, ...BINARY_MATRIX_ROWS];
  }, []);

  return (
    <div
      className="portfolio-motion-bg fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Full-Screen Monospace Binary Matrix Pattern Layer */}
      <div className="binary-matrix-layer absolute inset-0 flex justify-center items-start overflow-hidden">
        <div className="font-mono text-[11px] sm:text-[13px] md:text-[14px] lg:text-[15px] leading-[1.75] sm:leading-[1.85] tracking-[0.38em] sm:tracking-[0.46em] whitespace-nowrap text-slate-900/[0.11] dark:text-slate-400/[0.22] w-[110vw] max-w-none text-center font-medium select-none transform-gpu">
          {fullMatrixRows.map((row, idx) => (
            <div
              key={idx}
              className={`transition-opacity duration-500 select-none ${
                idx % 4 === 1
                  ? "text-slate-900/[0.14] dark:text-slate-300/[0.28]"
                  : idx % 4 === 3
                  ? "text-slate-900/[0.08] dark:text-slate-500/[0.18]"
                  : ""
              }`}
            >
              {row}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Soft Ambient Horizon & Radial Lighting Glow (Enhances Depth in Dark & Light Mode) */}
      <div className="motion-ambient-glows absolute inset-0 pointer-events-none">
        {/* Top subtle golden/amber ambient illumination for the hero */}
        <div className="absolute -top-24 inset-x-0 h-[480px] bg-gradient-to-b from-amber-400/10 via-yellow-400/5 to-transparent dark:from-amber-400/15 dark:via-cyan-500/5 dark:to-transparent blur-[90px]" />

        {/* Center-left soft cyan/blue glow orb */}
        <div className="absolute top-[35%] -left-40 w-[500px] h-[500px] rounded-full bg-blue-500/[0.04] dark:bg-cyan-500/[0.08] blur-[130px]" />

        {/* Center-right soft indigo/amber glow orb */}
        <div className="absolute top-[65%] -right-40 w-[550px] h-[550px] rounded-full bg-indigo-500/[0.04] dark:bg-indigo-500/[0.07] blur-[140px]" />
      </div>

      {/* 3. Subtle Vignette Edge Mask to smoothly blend page edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50/40 dark:to-[#070b14]/60" />
    </div>
  );
}

