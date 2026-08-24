import { useEffect, useState } from "react";
import {
  getFullImageUrl,
  isBrokenImageUrl,
} from "../utils/imageUrl";
import { getImagePlaceholder } from "../utils/imagePlaceholder";

/**
 * High-performance, resilient image component:
 * - Smart WebP / AVIF CDN optimization
 * - Smooth skeleton loading & fade-in (no layout shifts)
 * - Skips legacy broken URLs gracefully with beautiful SVG fallback
 */
export default function PortfolioImage({
  src,
  alt = "",
  className = "",
  fallback = null,
  variant = "default",
  loading = "lazy",
  decoding = "async",
  fetchPriority,
  priority = false,
  onError: externalOnError,
  onLoad: externalOnLoad,
  ...props
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  if (!src || typeof src !== "string" || !src.trim()) {
    return fallback;
  }

  // Legacy disk URLs on production — show placeholder image
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

  const effectiveLoading = priority ? "eager" : loading;
  const effectiveDecoding = priority ? "sync" : decoding;
  const effectiveFetchPriority = priority ? "high" : fetchPriority;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading={effectiveLoading}
      decoding={effectiveDecoding}
      fetchPriority={effectiveFetchPriority}
      referrerPolicy="no-referrer"
      className={`${className} transition-opacity duration-300 ${
        loaded ? "opacity-100" : "opacity-90"
      }`}
      onLoad={(event) => {
        setLoaded(true);
        externalOnLoad?.(event);
      }}
      onError={(event) => {
        setFailed(true);
        externalOnError?.(event);
      }}
      {...props}
    />
  );
}

