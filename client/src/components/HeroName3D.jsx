import { useEffect, useRef } from "react";
import VerifiedBadge from "./VerifiedBadge";
import { startViewportRafLoop } from "../utils/viewportRaf";

// Stepped palette from crisp bright front-adjacent highlight down to deep shadow
const DEPTH_LAYERS = [
  { light: "#4f46e5", dark: "#c4b5fd" },
  { light: "#6366f1", dark: "#a78bfa" },
  { light: "#7c3aed", dark: "#8b5cf6" },
  { light: "#8b5cf6", dark: "#7c3aed" },
  { light: "#a78bfa", dark: "#6d28d9" },
  { light: "#c4b5fd", dark: "#5b21b6" },
  { light: "#ddd6fe", dark: "#4c1d95" },
  { light: "#ede9fe", dark: "#2e1065" },
];

/**
 * Interactive Layered Depth Text hero name (inspired by ReactBits Depth Text).
 * - Multi-layer stepped 3D extruded typography whose shadow stack shifts smoothly
 *   in parallax against the cursor/touch pointer (with gentle idle float).
 * - Uses direct DOM transform updates in requestAnimationFrame (0 React re-renders).
 */
export default function HeroName3D({ name = "Yorn Pheareak" }) {
  const stageRef = useRef(null);
  const frontRef = useRef(null);
  const layerRefs = useRef([]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const pointer = {
      active: false,
      x: 0,
      y: 0,
      lastMovedAt: 0,
    };

    const current = { dx: 0.35, dy: 0.45 };

    const updatePointer = (clientX, clientY) => {
      const node = stageRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = Math.max(-1.2, Math.min(1.2, (clientX - cx) / Math.max(rect.width * 0.6, 220)));
      const ny = Math.max(-1.2, Math.min(1.2, (clientY - cy) / Math.max(rect.height * 2, 160)));
      pointer.x = nx;
      pointer.y = ny;
      pointer.active = true;
      pointer.lastMovedAt = performance.now();
    };

    const handleMouseMove = (e) => updatePointer(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
      const t = e.touches?.[0];
      if (t) updatePointer(t.clientX, t.clientY);
    };
    const handleLeave = () => {
      pointer.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("mouseleave", handleLeave);

    const stopRaf = startViewportRafLoop(stageRef.current, (now, dt) => {
      const isFreshPointer = pointer.active && now - pointer.lastMovedAt < 2600;

      let targetDx = 0.25;
      let targetDy = 0.35;

      if (isFreshPointer) {
        targetDx = pointer.x;
        targetDy = pointer.y;
      } else if (!prefersReducedMotion) {
        targetDx = Math.sin(now * 0.0013) * 0.55;
        targetDy = 0.25 + Math.cos(now * 0.001) * 0.35;
      }

      const blend = 1 - Math.pow(0.88, dt);
      current.dx += (targetDx - current.dx) * blend;
      current.dy += (targetDy - current.dy) * blend;

      if (frontRef.current) {
        const fx = current.dx * 3.5;
        const fy = current.dy * 2.5;
        frontRef.current.style.transform = `translate3d(${fx.toFixed(2)}px, ${fy.toFixed(2)}px, 0)`;
      }

      for (let i = 0; i < DEPTH_LAYERS.length; i += 1) {
        const layer = layerRefs.current[i];
        if (!layer) continue;
        const depth = i + 1;
        // Shift against pointer while maintaining a crisp elevated downward drop
        const lx = -current.dx * depth * 1.65 + depth * 0.45;
        const ly = -current.dy * depth * 1.15 + depth * 1.15;
        layer.style.transform = `translate3d(${lx.toFixed(2)}px, ${ly.toFixed(2)}px, 0)`;
      }
    });

    return () => {
      stopRaf();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const textSizeClass =
    "font-black text-[1.95rem] min-[400px]:text-[2.25rem] sm:text-5xl lg:text-[3.45rem] xl:text-[4.2rem] tracking-tight leading-[1.08] whitespace-nowrap";

  return (
    <span
      ref={stageRef}
      className="relative inline-flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 flex-wrap sm:flex-nowrap justify-center lg:justify-start select-none cursor-default"
    >
      {/* Soft ambient violet/indigo halo beneath elevated text */}
      <span
        aria-hidden="true"
        className="absolute -inset-x-4 -inset-y-2 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-violet-500/25 to-purple-500/20 blur-2xl -z-20 pointer-events-none"
      />

      <span className="relative inline-block">
        {/* Stacked Parallax Extrusion Layers (rendered back-to-front) */}
        {[...DEPTH_LAYERS]
          .map((colors, idx) => ({ colors, idx }))
          .reverse()
          .map(({ colors, idx }) => (
            <span
              key={idx}
              ref={(el) => {
                layerRefs.current[idx] = el;
              }}
              aria-hidden="true"
              style={{
                "--depth-light-color": colors.light,
                "--depth-dark-color": colors.dark,
                zIndex: DEPTH_LAYERS.length - idx,
              }}
              className={`depth-text-layer ${textSizeClass}`}
            >
              {name}
            </span>
          ))}

        {/* Crisp Front Face */}
        <span
          ref={frontRef}
          style={{ zIndex: DEPTH_LAYERS.length + 2 }}
          className={`depth-text-front relative block ${textSizeClass}`}
        >
          {name}
        </span>
      </span>

      <span className="inline-flex flex-shrink-0 relative z-20">
        <VerifiedBadge
          size="2xl"
          className="inline-block flex-shrink-0 drop-shadow-[0_0_14px_rgba(56,189,248,0.65)]"
        />
      </span>
    </span>
  );
}
