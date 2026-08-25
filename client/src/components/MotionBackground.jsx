import React, { useMemo } from "react";

/**
 * MotionBackground
 * Generates an iconic Motion.dev + Rombo.co inspired ASCII geometric wave pattern
 * with FULL-WIDTH luminous yellow, amber, and golden-lime glow across the entire top banner.
 */
export default function MotionBackground() {
  // Generate rows of geometric wave characters across full screen width
  const patternRows = useMemo(() => {
    const characters = ["/", "\\", "|", "+", "-", "=", "~", "\\", "/"];
    const rows = [];
    const numRows = 18;
    const numCols = 90;

    for (let r = 0; r < numRows; r++) {
      let rowStr = "";
      for (let c = 0; c < numCols; c++) {
        // Wave function to create organic flowing motion
        const wave = Math.sin(c * 0.12 + r * 0.28) + Math.cos(c * 0.06 - r * 0.18);
        const charIndex = Math.abs(Math.floor((wave + 2) * 2.2)) % characters.length;
        rowStr += characters[charIndex] + " ";
      }
      rows.push(rowStr);
    }
    return rows;
  }, []);

  return (
    <div className="portfolio-motion-bg fixed inset-0 z-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      {/* 1. FULL WIDTH Vibrant Yellow / Amber Top Banner Glow (Edge-to-Edge 100vw) */}
      <div className="motion-top-glow absolute top-0 inset-x-0 w-full h-[540px] overflow-hidden">
        {/* Full-width continuous Golden Yellow radiant horizon */}
        <div className="absolute -top-28 inset-x-0 w-full h-[400px] bg-gradient-to-b from-amber-300/40 via-yellow-400/30 via-amber-500/15 to-transparent blur-[80px] sm:blur-[110px]" />

        {/* Left Yellow/Amber Aurora Orb */}
        <div className="motion-aurora absolute -top-20 -left-[10%] w-[55vw] h-[440px] rounded-full bg-gradient-to-br from-yellow-400/40 via-amber-400/30 to-transparent blur-[100px] animate-aurora-1" />

        {/* Center Golden Sunburst Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[75vw] h-[460px] rounded-full bg-gradient-to-b from-amber-300/45 via-yellow-400/35 to-transparent blur-[90px]" />

        {/* Right Yellow/Lime Aurora Orb */}
        <div className="motion-aurora absolute -top-20 -right-[10%] w-[55vw] h-[440px] rounded-full bg-gradient-to-bl from-yellow-300/40 via-amber-400/30 to-lime-400/20 blur-[100px] animate-aurora-2" />
      </div>

      {/* 2. Motion-style Parametric ASCII Matrix Banner (Full Width 100vw) */}
      <div className="motion-matrix absolute top-0 inset-x-0 w-full h-[480px] overflow-hidden flex flex-col justify-start items-center opacity-[0.24] dark:opacity-[0.32] [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]">
        <div className="font-mono text-[10px] sm:text-xs leading-[1.32] tracking-[0.25em] text-amber-500 dark:text-yellow-300 whitespace-nowrap overflow-hidden text-center w-[120vw] scale-105 origin-top font-bold">
          {patternRows.map((row, idx) => (
            <div
              key={idx}
              className="transition-transform duration-700 select-none"
              style={{
                opacity: 0.4 + Math.sin(idx * 0.35) * 0.5,
              }}
            >
              {row}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Mid & Bottom Ambient Glows for Smooth Page Balance */}
      <div className="motion-deep-glow absolute top-[48%] -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent blur-[120px]" />
      <div className="motion-deep-glow absolute bottom-10 -right-20 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-indigo-600/10 via-purple-600/10 to-amber-500/5 blur-[130px]" />

      {/* 4. Subtle Tech Dot Grid Overlay */}
      <div className="motion-grid absolute inset-0 bg-grid-mesh opacity-35 dark:opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)]" />
    </div>
  );
}
