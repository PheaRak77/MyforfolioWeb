import { useTheme } from "../context/ThemeContext";

/**
 * Premium Apple-Grade Theme Toggle Button:
 * - Ultra-smooth spring morphing between Sun & Moon
 * - Glowing aura flare
 * - View Transition API support (smooth circular ripple)
 * - Micro-bounce interaction physics
 */
export default function ThemeToggle({ className = "", size = "md", showLabel = false }) {
  const { isDark, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-9 h-9 sm:w-10 sm:h-10",
    lg: "w-11 h-11",
  };

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
      {/* Ambient background glow on hover */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-full transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${
          isDark
            ? "bg-amber-400/15 blur-sm"
            : "bg-indigo-500/15 blur-sm"
        }`}
      />

      {/* Animated Icon Container */}
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun Icon (shown in Dark Mode to switch to Light) */}
        <svg
          className={`absolute w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300 transition-all duration-500 transform ${
            isDark
              ? "rotate-0 scale-100 opacity-100 drop-shadow-[0_0_10px_rgba(252,211,77,0.7)]"
              : "rotate-90 scale-0 opacity-0"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="4" strokeWidth="2.2" stroke="currentColor" fill="currentColor" fillOpacity="0.2" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.2}
            d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
          />
        </svg>

        {/* Moon Icon (shown in Light Mode to switch to Dark) */}
        <svg
          className={`absolute w-4 h-4 sm:w-4.5 sm:h-4.5 text-neutral-800 transition-all duration-500 transform ${
            !isDark
              ? "rotate-0 scale-100 opacity-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
              : "-rotate-90 scale-0 opacity-0"
          }`}
          fill="currentColor"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>

      {showLabel && (
        <span className="ml-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
}
