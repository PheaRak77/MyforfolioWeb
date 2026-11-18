import { useLayoutEffect, useRef, useState } from "react";
import {
  getFullImageUrl,
  getCloudinarySrcSet,
  isBrokenImageUrl,
} from "../utils/imageUrl";
import { getImagePlaceholder } from "../utils/imagePlaceholder";

/**
 * High-performance, resilient image component:
 * - Smart WebP / AVIF CDN optimization
 * - Smooth fade-in once decoded (zero jarring scanline pop-in)
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
  const [loadedSource, setLoadedSource] = useState(null);
  const imgRef = useRef(null);

  const isValidSource = Boolean(src && typeof src === "string" && src.trim());
  const brokenLegacy = isValidSource && isBrokenImageUrl(src);
  const resolvedSrc =
    isValidSource && !brokenLegacy
      ? getFullImageUrl(src, { label: alt, variant })
      : null;

  useLayoutEffect(() => {
    if (
      resolvedSrc &&
      imgRef.current?.complete &&
      imgRef.current.naturalWidth > 0
    ) {
      setLoadedSource(resolvedSrc);
    }
  }, [resolvedSrc]);

  if (!isValidSource) {
    return fallback;
  }

  // Legacy disk URLs on production — show placeholder image
  if (brokenLegacy) {
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

  if (!resolvedSrc || failedSource === resolvedSrc) {
    return fallback;
  }

  const effectiveLoading = priority ? "eager" : loading;
  const effectiveDecoding = priority ? "sync" : decoding;
  const effectiveFetchPriority = priority ? "high" : fetchPriority;
  const isLoaded = loadedSource === resolvedSrc;
  // Never hide lazy or priority LCP images with opacity-0 (Safari/Brave skip
  // offscreen lazy loads if opacity starts at 0, and priority hero affects LCP).
  const fadeClass =
    effectiveLoading === "eager" && !priority
      ? `transition-opacity duration-200 ${isLoaded ? "opacity-100" : "opacity-0"}`
      : "";

  return (
    <img
      ref={imgRef}
      src={resolvedSrc}
      srcSet={getCloudinarySrcSet(src, { variant })}
      sizes={props.sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"}
      alt={alt}
      loading={effectiveLoading}
      decoding={effectiveDecoding}
      fetchPriority={effectiveFetchPriority}
      referrerPolicy="no-referrer"
      className={`${className} ${fadeClass}`.trim()}
      onLoad={(event) => {
        setLoadedSource(resolvedSrc);
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
