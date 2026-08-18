import { useEffect, useState } from "react";
import {
  getFullImageUrl,
  isBrokenImageUrl,
} from "../utils/imageUrl";
import { getImagePlaceholder } from "../utils/imagePlaceholder";

/**
 * Resilient image — skips dead Render /uploads/ URLs and shows fallback or SVG placeholder.
 */
export default function PortfolioImage({
  src,
  alt = "",
  className = "",
  fallback = null,
  variant = "default",
  loading = "lazy",
  decoding = "async",
  onError: externalOnError,
  ...props
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || typeof src !== "string" || !src.trim()) {
    return fallback;
  }

  // Legacy Render disk files are gone — never fetch them (avoids black broken img box)
  if (isBrokenImageUrl(src)) {
    if (fallback) return fallback;
    return (
      <img
        src={getImagePlaceholder(alt, variant)}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        {...props}
      />
    );
  }

  const resolvedSrc = getFullImageUrl(src, { label: alt, variant });

  if (!resolvedSrc || failed) {
    return fallback;
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      referrerPolicy="no-referrer"
      className={className}
      onError={(event) => {
        setFailed(true);
        externalOnError?.(event);
      }}
      {...props}
    />
  );
}
