/**
 * Shared viewport-aware requestAnimationFrame loop helper.
 * Automatically pauses animations when the target element scrolls off-screen
 * or when the browser tab is hidden, preventing wasted CPU/battery across devices.
 *
 * @param {HTMLElement|null} element - Observed DOM node controlling visibility
 * @param {(now: number, dt: number) => void} onFrame - Frame callback (dt normalized to 60fps = 1.0)
 * @returns {() => void} Cleanup function
 */
export function startViewportRafLoop(element, onFrame) {
  let rafId = 0;
  let isInView = true;
  let isTabVisible = typeof document === "undefined" ? true : !document.hidden;
  let prevTime = performance.now();

  const stop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const loop = (now) => {
    const dt = Math.min((now - prevTime) / 16.6667, 2.2);
    prevTime = now;
    onFrame(now, dt);
    if (isInView && isTabVisible) {
      rafId = requestAnimationFrame(loop);
    } else {
      rafId = 0;
    }
  };

  const syncState = () => {
    if (isInView && isTabVisible) {
      if (!rafId) {
        prevTime = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    } else {
      stop();
    }
  };

  let observer = null;
  if (element && typeof IntersectionObserver !== "undefined") {
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isInView = entry.isIntersecting;
        syncState();
      },
      { rootMargin: "160px 0px" },
    );
    observer.observe(element);
  }

  const handleVisibilityChange = () => {
    isTabVisible = !document.hidden;
    syncState();
  };

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  syncState();

  return () => {
    stop();
    observer?.disconnect();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  };
}
