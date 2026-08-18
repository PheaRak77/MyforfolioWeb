import { useState } from "react";
import { getFullImageUrl } from "../utils/imageUrl";

/**
 * Resilient image component with lazy loading, HTTPS normalization,
 * and graceful fallback when legacy Render disk files are missing (404).
 */
export default function PortfolioImage({
  src,
  alt = "",
  className = "",
  fallback = null,
  loading = "lazy",
  decoding = "async",
  onError: externalOnError,
  ...props
}) {
  const [failed, setFailed] = useState(false);

  const resolvedSrc = getFullImageUrl(src);

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
