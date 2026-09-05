import { memo } from "react";

/**
 * Biometric Fingerprint Scanner Loading Component
 * Matches the user reference design: Circular scanner with glowing rotating arc,
 * biometric fingerprint ridges with illuminated dashes, and tracked 'L O A D I N G' text.
 */
function FingerprintLoader({ className = "", size = "md", label = "L O A D I N G" }) {
  const sizeMap = {
    sm: "w-28 h-28",
    md: "w-44 h-44 sm:w-48 sm:h-48",
    lg: "w-56 h-56 sm:w-64 sm:h-64",
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Outer Scanner Wrapper with Rotating Golden Arc */}
      <div className={`relative ${sizeMap[size] || sizeMap.md} flex items-center justify-center`}>
        {/* Outer Circular Base Ring */}
        <div className="absolute inset-0 rounded-full border-[2.5px] border-neutral-700/60 dark:border-neutral-700/50" />

        {/* High-speed Rotating Glowing Arc (matching reference screenshot) */}
        <div 
          className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-[#fef08a] border-r-[#fef08a]/80 shadow-[0_0_12px_rgba(254,240,138,0.7)] animate-spin" 
          style={{ animationDuration: "1.6s", animationTimingFunction: "linear" }} 
        />

        {/* Subtle Ambient Radial Flare */}
        <div className="absolute inset-2 rounded-full bg-yellow-400/5 dark:bg-yellow-300/5 blur-lg pointer-events-none" />

        {/* Biometric Fingerprint Graphic */}
        <svg
          className="w-[68%] h-[68%] text-neutral-400/80 dark:text-neutral-300/85"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Fingerprint Ridges */}
          <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            {/* Outer Ridge 1 */}
            <path d="M50 16 C28 16 16 32 16 50 C16 70 28 82 36 88" strokeOpacity="0.45" />
            <path d="M64 88 C72 82 84 70 84 50 C84 32 72 16 50 16" strokeOpacity="0.45" />

            {/* Ridge 2 */}
            <path d="M50 24 C34 24 23 36 23 50 C23 65 31 75 39 80" strokeOpacity="0.65" />
            <path d="M61 80 C69 75 77 65 77 50 C77 36 66 24 50 24" strokeOpacity="0.65" />

            {/* Ridge 3 */}
            <path d="M50 32 C39 32 31 40 31 50 C31 60 38 68 44 73" strokeOpacity="0.8" />
            <path d="M56 73 C62 68 69 60 69 50 C69 40 61 32 50 32" strokeOpacity="0.8" />

            {/* Ridge 4 */}
            <path d="M50 40 C43 40 38 44 38 50 C38 56 42 62 47 66" strokeOpacity="0.9" />
            <path d="M53 66 C58 62 62 56 62 50 C62 44 57 40 50 40" strokeOpacity="0.9" />

            {/* Center Loop Ridge */}
            <path d="M50 48 C47 48 45 50 45 52 C45 55 48 58 50 60" strokeOpacity="1" />
            <path d="M50 60 C52 58 55 55 55 52 C55 50 53 48 50 48" strokeOpacity="1" />
          </g>

          {/* Glowing Illuminated Dashes & Dots (Scanner active readout) */}
          <g stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" className="animate-pulse">
            <path d="M44 24 C47 24 52 24 55 24" />
            <path d="M30 38 C32 35 36 33 39 32" />
            <path d="M63 33 C66 35 69 39 70 42" />
            <path d="M24 50 C24 54 26 58 28 61" />
            <path d="M76 53 C75 58 73 63 70 67" />
            <path d="M42 74 C46 76 50 77 54 77" />
            <path d="M47 50 C48 49 50 49 51 50" />
          </g>

          <g fill="#fef08a">
            <circle cx="33" cy="42" r="1.8" className="animate-ping" style={{ animationDuration: "2s" }} />
            <circle cx="68" cy="46" r="1.8" className="animate-ping" style={{ animationDuration: "2.2s", animationDelay: "0.4s" }} />
            <circle cx="50" cy="24" r="1.5" />
            <circle cx="58" cy="33" r="1.5" />
            <circle cx="43" cy="67" r="1.5" />
            <circle cx="56" cy="62" r="1.5" />
          </g>
        </svg>
      </div>

      {/* Tracked Monospace L O A D I N G Text */}
      {label && (
        <div className="text-[11px] sm:text-[13px] font-mono font-medium tracking-[0.45em] sm:tracking-[0.55em] text-neutral-300 dark:text-neutral-200 mt-6 uppercase select-none opacity-90">
          {label}
        </div>
      )}
    </div>
  );
}

export default memo(FingerprintLoader);
