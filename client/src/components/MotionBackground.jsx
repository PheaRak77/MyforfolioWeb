import React, { useMemo } from "react";

/**
 * MotionBackground
 * Generates an iconic Motion.dev-inspired ASCII / geometric wave pattern
 * with luminous amber, lime, cyan, and violet aurora gradients.
 */
export default function MotionBackground() {
  // Generate rows of geometric wave characters
  const patternRows = useMemo(() => {
    const characters = ["/", "\\", "|", "+", "-", "=", "~", "\\", "/"];
    const rows = [];
    const numRows = 16;
    const numCols = 60;

    for (let r = 0; r < numRows; r++) {
      let rowStr = "";
      for (let c = 0; c < numCols; c++) {
        // Wave function to create organic flowing motion
        const wave = Math.sin(c * 0.15 + r * 0.3) + Math.cos(c * 0.08 - r * 0.2);
        const charIndex = Math.abs(Math.floor((wave + 2) * 2.2)) % characters.length;
        rowStr += characters[charIndex] + " ";
      }
      rows.push(rowStr);
    }
    return rows;
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      {/* Top Banner Glowing Gradients (Motion.dev Inspired: Vibrant Amber / Lime / Cyan / Purple) */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[140%] max-w-[1600px] h-[550px] opacity-70 dark:opacity-80">
        {/* Amber / Yellow Sunburst (Center Top) */}
        <div className="absolute top-0 left-[20%] w-[500px] sm:w-[700px] h-[350px] rounded-full bg-gradient-to-br from-amber-400/30 via-yellow-500/25 to-lime-400/20 blur-[90px] animate-aurora-1" />

        {/* Lime / Emerald Radiant Glow (Center-Right) */}
        <div className="absolute top-10 right-[15%] w-[450px] sm:w-[600px] h-[380px] rounded-full bg-gradient-to-bl from-lime-400/25 via-emerald-500/20 to-teal-400/15 blur-[100px] animate-aurora-2" />

        {/* Deep Cyan / Indigo Ambient Fill */}
        <div className="absolute -top-10 left-[5%] w-[400px] sm:w-[550px] h-[400px] rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-indigo-600/15 blur-[110px]" />

        {/* Violet / Fuchsia Depth Glow (Bottom Right) */}
        <div className="absolute top-36 right-[5%] w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-purple-600/20 via-fuchsia-500/15 to-transparent blur-[100px]" />
      </div>

      {/* Mid & Bottom Ambient Glows for Smooth Page Transitions */}
      <div className="absolute top-[45%] -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/5 blur-[120px]" />
      <div className="absolute bottom-10 right-[-10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-indigo-600/10 via-purple-600/10 to-emerald-500/5 blur-[130px]" />

      {/* Motion-style Parametric ASCII Matrix Banner Overlay */}
      <div className="absolute top-0 inset-x-0 h-[480px] overflow-hidden flex flex-col justify-start items-center opacity-[0.22] dark:opacity-[0.28] [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]">
        <div className="font-mono text-[11px] sm:text-xs leading-[1.35] tracking-[0.22em] text-amber-500/90 dark:text-amber-300/80 whitespace-nowrap overflow-hidden text-center w-full scale-105 origin-top">
          {patternRows.map((row, idx) => (
            <div
              key={idx}
              className="transition-transform duration-700 select-none font-bold"
              style={{
                opacity: 0.5 + Math.sin(idx * 0.4) * 0.4,
              }}
            >
              {row}
            </div>
          ))}
        </div>
      </div>

      {/* Subtle Dot Mesh Pattern */}
      <div className="absolute inset-0 bg-grid-mesh opacity-50 dark:opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />
    </div>
  );
}
