import { useTheme } from "../context/ThemeContext";

function ThemeIcons({ isDark }) {
  return (
    <div className="relative w-5 h-5 flex items-center justify-center">
      {/* Sun — visible in dark mode (tap to go light) */}
      <svg
        className={`absolute inset-0 m-auto w-[18px] h-[18px] text-amber-300 transition-[transform,opacity,filter] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isDark
            ? "rotate-0 scale-100 opacity-100 drop-shadow-[0_0_10px_rgba(252,211,77,0.75)]"
            : "rotate-[100deg] scale-0 opacity-0"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <g className={isDark ? "theme-sun-rays" : ""}>
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.1"
            d="M12 2.4v1.7M12 19.9v1.7M4.93 4.93l1.2 1.2M17.87 17.87l1.2 1.2M2.4 12h1.7M19.9 12h1.7M4.93 19.07l1.2-1.2M17.87 6.13l1.2-1.2"
          />
        </g>
        <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.28" stroke="currentColor" strokeWidth="2" />
      </svg>

      {/* Moon — visible in light mode (tap to go dark) */}
      <svg
        className={`absolute inset-0 m-auto w-[18px] h-[18px] text-indigo-950 transition-[transform,opacity,filter] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          !isDark
            ? "rotate-0 scale-100 opacity-100 drop-shadow-[0_2px_6px_rgba(49,46,129,0.25)]"
            : "-rotate-[80deg] -translate-x-1 scale-0 opacity-0"
        }`}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </div>
  );
}

/**
 * Theme toggle — sun/moon morph; page uses a soft color fade (no circular wipe).
 */
export default function ThemeToggle({
  className = "",
  size = "md",
  variant = "icon",
}) {
  const { isDark, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-9 h-9 sm:w-10 sm:h-10",
    lg: "w-11 h-11",
  };

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={(e) => toggleTheme(e)}
        className={`w-full py-3 px-4 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center justify-between border border-black/[0.06] dark:border-white/[0.08] active:scale-[0.98] transition-all duration-300 shadow-sm group ${className}`}
        aria-label="Toggle Dark and Light Mode"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-neutral-500 dark:text-neutral-400">Theme</span>
          <span className="font-bold text-neutral-900 dark:text-white">
            {isDark ? "Dark Charcoal" : "Clean Light"}
          </span>
        </div>
        <div className="relative w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center overflow-hidden">
          <span
            aria-hidden="true"
            className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
              isDark ? "bg-amber-400/20" : "bg-indigo-500/15"
            }`}
          />
          <ThemeIcons isDark={isDark} />
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => toggleTheme(e)}
      className={`relative group rounded-full bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/[0.14] border border-black/[0.06] dark:border-white/[0.12] transition-all duration-300 flex items-center justify-center shadow-sm active:scale-90 hover:scale-105 overflow-hidden ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Dark and Light Mode"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-full transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${
          isDark ? "bg-amber-400/20 blur-[3px]" : "bg-indigo-500/20 blur-[3px]"
        }`}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full border border-transparent group-active:animate-theme-ring-burst pointer-events-none"
      />
      <ThemeIcons isDark={isDark} />
    </button>
  );
}
