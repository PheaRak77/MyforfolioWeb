/**
 * The one public address used when an admin opens the live portfolio.
 *
 * Keep this separate from the address that happens to host the dashboard: an
 * older Vercel deployment can still be used to administer the site, but it
 * must not send visitors back to that old deployment.
 */
export const getPublicSiteUrl = () => {
  if (typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return window.location.origin;
  }

  // Deliberately do not use VITE_PUBLIC_SITE_URL here. A legacy Vercel value
  // in the deployment environment must never send visitors away from the
  // official portfolio domain.
  return "https://www.ypheareak.site";
};

export const getLivePortfolioUrl = () => `${getPublicSiteUrl()}/`;
