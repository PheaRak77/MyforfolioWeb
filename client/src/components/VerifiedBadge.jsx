import { useId } from "react";

const SIZE_MAP = {
  xs: "w-[16px] h-[16px] min-w-[16px]",
  sm: "w-[20px] h-[20px] min-w-[20px]",
  md: "w-[22px] h-[22px] min-w-[22px]",
  lg: "w-[26px] h-[26px] min-w-[26px]",
  xl: "w-[32px] h-[32px] min-w-[32px]",
  "2xl": "w-[40px] h-[40px] min-w-[40px]",
};

/**
 * Facebook / Instagram / Telegram style blue verified badge.
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
        className="w-full h-full drop-shadow-[0_1px_3px_rgba(24,119,242,0.55)]"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={gradientId} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#5BBAFF" />
            <stop offset="55%" stopColor="#2196F3" />
            <stop offset="100%" stopColor="#1877F2" />
          </radialGradient>
        </defs>
        <path
          d="M12.001 2.002c-1.047 0-1.875.76-2.583 1.41-.535.492-1.025.942-1.63 1.106-.998.272-1.78.96-2.186 1.93-.245.586-.425 1.196-.867 1.638-.727.727-1.233 1.572-1.233 2.614 0 1.042.506 1.887 1.233 2.614.442.442.622 1.052.867 1.638.406.97 1.188 1.658 2.186 1.93.605.164 1.095.614 1.63 1.106.708.65 1.536 1.41 2.583 1.41s1.875-.76 2.583-1.41c.535-.492 1.025-.942 1.63-1.106.998-.272 1.78-.96 2.186-1.93.245-.586.425-1.196.867-1.638.727-.727 1.233-1.572 1.233-2.614 0-1.042-.506-1.887-1.233-2.614-.442-.442-.622-1.052-.867-1.638-.406-.97-1.188-1.658-2.186-1.93-.605-.164-1.095-.614-1.63-1.106-.708-.65-1.536-1.41-2.583-1.41z"
          fill={`url(#${gradientId})`}
        />
        <path
          d="M7.2 12.5L10.4 15.7L16.8 9.3"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export const isVerifiedUser = (user) => Boolean(user?.name || user?.role);

/** Inline name with blue verified badge — use next to profile names */
export function VerifiedName({
  name,
  badgeSize = "md",
  className = "",
  nameClassName = "",
}) {
  if (!name) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}>
      <span className={`truncate ${nameClassName}`}>{name}</span>
      <VerifiedBadge size={badgeSize} className="flex-shrink-0" />
    </span>
  );
}
