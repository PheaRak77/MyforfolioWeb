import { useState } from "react";
import {
  getFullImageUrl,
  getCloudinarySrcSet,
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
  const [failedSource, setFailedSource] = useState(null);

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

  if (!resolvedSrc || failedSource === resolvedSrc) {
    return fallback;
  }

  const effectiveLoading = priority ? "eager" : loading;
  const effectiveDecoding = priority ? "sync" : decoding;
  const effectiveFetchPriority = priority ? "high" : fetchPriority;

  return (
    <img
      src={resolvedSrc}
      srcSet={getCloudinarySrcSet(src, { variant })}
      sizes={props.sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 900px"}
      alt={alt}
      loading={effectiveLoading}
      decoding={effectiveDecoding}
      fetchPriority={effectiveFetchPriority}
      referrerPolicy="no-referrer"
      className={className}
      onLoad={(event) => {
        externalOnLoad?.(event);
      }}
      onError={(event) => {
        setFailedSource(resolvedSrc);
        externalOnError?.(event);
      }}
      {...props}
    />
  );
}
