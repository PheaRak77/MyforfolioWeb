import { useId } from "react";

const SIZE_MAP = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-7 h-7",
};

/**
 * Blue verified checkmark badge (portfolio owner / admin).
 */
export default function VerifiedBadge({ size = "sm", className = "" }) {
  const gradientId = useId();

  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center ${SIZE_MAP[size] || SIZE_MAP.sm} ${className}`}
      title="Verified"
      aria-label="Verified account"
      role="img"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <circle cx="12" cy="12" r="11" fill="#3B82F6" />
        <circle cx="12" cy="12" r="11" fill={`url(#${gradientId})`} opacity="0.35" />
        <path
          d="M7.5 12.2l2.8 2.8 6.2-6.4"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id={gradientId} x1="4" y1="4" x2="20" y2="20">
            <stop stopColor="white" stopOpacity="0.5" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}
