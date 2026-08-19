import { useId } from "react";

const SIZE_MAP = {
  xs: "w-[16px] h-[16px] min-w-[16px]",
  sm: "w-[18px] h-[18px] min-w-[18px]",
  md: "w-[22px] h-[22px] min-w-[22px]",
  lg: "w-[26px] h-[26px] min-w-[26px]",
  xl: "w-[32px] h-[32px] min-w-[32px]",
  "2xl": "w-[40px] h-[40px] min-w-[40px]",
};

/**
 * Twitter / Telegram / Meta style blue scalloped verified badge with checkmark.
 */
export default function VerifiedBadge({
  size = "md",
  className = "",
  title = "Verified account",
}) {
  const gradientId = useId();

  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center align-middle ${
        SIZE_MAP[size] || SIZE_MAP.md
      } ${className}`}
      title={title}
      aria-label={title}
      role="img"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_1px_3px_rgba(29,155,240,0.6)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="45%" stopColor="#1d9bf0" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        {/* Scalloped badge flower outline */}
        <path
          d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
          fill={`url(#${gradientId})`}
        />
        {/* Crisp white checkmark */}
        <path
          d="M10.54 16.2L6.8 12.46l1.41-1.42 2.33 2.33 5.3-5.77 1.47 1.36-6.77 7.24z"
          fill="#FFFFFF"
        />
      </svg>
    </span>
  );
}

export const isVerifiedUser = (user) => Boolean(user?.name || user?.role);

/** Inline name with blue verified badge */
export function VerifiedName({
  name,
  badgeSize = "md",
  badgePosition = "after", // "after" or "before"
  className = "",
  nameClassName = "",
}) {
  if (!name) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}>
      {badgePosition === "before" && (
        <VerifiedBadge size={badgeSize} className="flex-shrink-0" />
      )}
      <span className={`truncate ${nameClassName}`}>{name}</span>
      {badgePosition === "after" && (
        <VerifiedBadge size={badgeSize} className="flex-shrink-0" />
      )}
    </span>
  );
}

