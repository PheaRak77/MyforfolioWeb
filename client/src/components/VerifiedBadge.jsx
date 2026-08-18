import { useId } from "react";

const SIZE_MAP = {
  xs: "w-3.5 h-3.5 min-w-[14px]",
  sm: "w-4 h-4 min-w-[16px]",
  md: "w-5 h-5 min-w-[20px]",
  lg: "w-6 h-6 min-w-[24px]",
  xl: "w-7 h-7 sm:w-8 sm:h-8 min-w-[28px]",
  "2xl": "w-9 h-9 sm:w-10 sm:h-10 min-w-[36px]",
};

/**
 * Authentic Telegram & Facebook Blue Verified Badge
 * - 8-pointed smooth scalloped star rosette
 * - Pure electric blue gradient (#38bdf8 -> #0088cc -> #0072db)
 * - Crisp centered pure white checkmark (✓)
 * - Soft ambient glow and smooth hover scale
 */
export default function VerifiedBadge({
  size = "md",
  className = "",
  title = "Verified Account",
}) {
  const gradientId = useId();

  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center align-middle relative group/badge select-none ${
        SIZE_MAP[size] || SIZE_MAP.md
      } ${className}`}
      title={title}
      aria-label={title}
      role="img"
    >
      {/* Soft ambient blue glow */}
      <span
        aria-hidden="true"
        className="absolute -inset-0.5 rounded-full bg-blue-500/30 blur-xs pointer-events-none transition-opacity duration-300 group-hover/badge:opacity-100 opacity-60"
      />

      <svg
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_1px_2px_rgba(0,100,200,0.4)] transition-transform duration-200 group-hover/badge:scale-110"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="40%" stopColor="#0088CC" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>

        {/* Telegram / Twitter / Facebook Scalloped Rosette */}
        <path
          fill={`url(#${gradientId})`}
          d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
        />

        {/* Pure White Centered Checkmark */}
        <path
          fill="#FFFFFF"
          d="M10.54 16.2L6.8 12.46l1.41-1.42 2.33 2.33 5.23-5.23 1.42 1.42-6.65 6.64z"
        />
      </svg>
    </span>
  );
}

/** Always returns true for the portfolio owner/admin */
export const isVerifiedUser = () => true;
