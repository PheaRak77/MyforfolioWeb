import { useId } from "react";

const SIZE_MAP = {
  xs: "w-3.5 h-3.5 min-w-[14px]",
  sm: "w-4 h-4 min-w-[16px]",
  md: "w-5 h-5 min-w-[20px]",
  lg: "w-6 h-6 min-w-[24px]",
  xl: "w-7 h-7 sm:w-8 sm:h-8 min-w-[28px]",
  "2xl": "w-10 h-10 min-w-[40px]",
};

/**
 * Official Facebook / Meta / Instagram Blue Verified Badge
 * Exactly matches the 12-lobed scalloped rosette with rounded checkmark.
 */
export default function VerifiedBadge({
  size = "md",
  className = "",
  title = "Verified Account",
}) {
  const gradientId = useId();

  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center align-middle relative select-none ${
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
        className="w-full h-full relative z-10 transition-transform duration-200 hover:scale-110 drop-shadow-[0_1px_2px_rgba(24,119,242,0.4)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4599FF" />
            <stop offset="100%" stopColor="#1877F2" />
          </linearGradient>
        </defs>

        {/* 12-Petal Scalloped Meta / Facebook / Instagram Rosette */}
        <path
          d="M12.001 2.002c-1.047 0-1.875.76-2.583 1.41-.535.492-1.025.942-1.63 1.106-.998.272-1.78.96-2.186 1.93-.245.586-.425 1.196-.867 1.638-.727.727-1.233 1.572-1.233 2.614 0 1.042.506 1.887 1.233 2.614.442.442.622 1.052.867 1.638.406.97 1.188 1.658 2.186 1.93.605.164 1.095.614 1.63 1.106.708.65 1.536 1.41 2.583 1.41s1.875-.76 2.583-1.41c.535-.492 1.025-.942 1.63-1.106.998-.272 1.78-.96 2.186-1.93.245-.586.425-1.196.867-1.638.727-.727 1.233-1.572 1.233-2.614 0-1.042-.506-1.887-1.233-2.614-.442-.442-.622-1.052-.867-1.638-.406-.97-1.188-1.658-2.186-1.93-.605-.164-1.095-.614-1.63-1.106-.708-.65-1.536-1.41-2.583-1.41z"
          fill={`url(#${gradientId})`}
        />

        {/* Thick Rounded White Checkmark */}
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

/** Always returns true for the portfolio owner/admin */
export const isVerifiedUser = () => true;
