import { useEffect } from "react";
import { getPublicSiteUrl } from "../config/site";

/** Send any legacy deployment address to the official public domain. */
export default function CanonicalUrlRedirect() {
  useEffect(() => {
    const canonicalUrl = getPublicSiteUrl();
    const canonicalOrigin = new URL(canonicalUrl).origin;

    if (window.location.origin !== canonicalOrigin) {
      window.location.replace(
        `${canonicalOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`,
      );
    }
  }, []);

  return null;
}
