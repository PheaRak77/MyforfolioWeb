const ROUTE_LOADERS = {
  "/login": () => import("../pages/Login"),
  "/register": () => import("../pages/Register"),
  "/forgot-password": () => import("../pages/ForgotPassword"),
  "/reset-password": () => import("../pages/ResetPassword"),
  "/dashboard": () => import("../pages/Dashboard"),
  "/projects": () => import("../pages/Projects"),
  "/certificates": () => import("../pages/Certificates"),
  "/skills": () => import("../pages/Skills"),
  "/messages": () => import("../pages/Messages"),
  "/profile": () => import("../pages/Profile"),
};

const prefetched = new Set();

/** Warm a lazy route chunk on hover/touch so page transitions feel instant. */
export function prefetchRoute(path) {
  if (!path || prefetched.has(path)) return;
  const loader = ROUTE_LOADERS[path];
  if (!loader) return;
  prefetched.add(path);
  loader().catch(() => {
    prefetched.delete(path);
  });
}
