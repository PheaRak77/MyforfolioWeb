import { useEffect, useMemo, useRef } from "react";
import VerifiedBadge from "./VerifiedBadge";

/**
 * Interactive Text Pressure hero name animation (inspired by ReactBits Text Pressure).
 * - Uses the Roboto Flex variable font (`wght` 150..1000, `wdth` 72..125) to morph each letter's
 *   weight, width, and subtle stretch dynamically based on pointer proximity.
 * - Gently animates an ambient pressure wave when idle so it stays alive on mobile & desktop,
 *   while snapping smoothly to follow the real mouse/touch cursor with 0 React re-renders.
 */
export default function HeroName3D({ name = "Yorn Pheareak" }) {
  const containerRef = useRef(null);
  const charRefs = useRef([]);

  const chars = useMemo(() => Array.from(name), [name]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const total = chars.length;
    const weights = new Array(total).fill(700);
    const widths = new Array(total).fill(100);

    const pointer = {
      active: false,
      x: 0,
      y: 0,
      lastMovedAt: 0,
    };

    const handlePointerMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      pointer.lastMovedAt = performance.now();
    };

    const handleTouchMove = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      pointer.x = t.clientX;
      pointer.y = t.clientY;
      pointer.active = true;
      pointer.lastMovedAt = performance.now();
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("mouseleave", handlePointerLeave);

    let rafId = 0;

    const tick = (now) => {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const radius = Math.max(rect.width * 0.42, 160);

        // Fall back to a smooth sweeping focal wave if user hasn't moved mouse recently
        const isPointerFresh =
          pointer.active && now - pointer.lastMovedAt < 2400;

        let focalX = rect.left + rect.width * 0.5;
        let focalY = rect.top + rect.height * 0.5;

        if (isPointerFresh) {
          focalX = pointer.x;
          focalY = pointer.y;
        } else if (!prefersReducedMotion) {
          const wave = (Math.sin(now * 0.0016) + 1) * 0.5;
          focalX = rect.left + wave * rect.width;
          focalY = rect.top + rect.height * 0.5;
        }

        const stepWidth = rect.width / Math.max(total, 1);

        for (let i = 0; i < total; i += 1) {
          const el = charRefs.current[i];
          if (!el) continue;

          if (chars[i] === " ") continue;

          const charX = rect.left + (i + 0.5) * stepWidth;
          const charY = rect.top + rect.height * 0.5;
          const dist = Math.hypot(focalX - charX, (focalY - charY) * 0.65);

          // Pressure ranges from 0 (far -> hairline thin) to 1 (near -> heavy bold)
          const pressure = prefersReducedMotion
            ? 0.72
            : Math.max(0, 1 - dist / radius);
          const eased = pressure * pressure * (3 - 2 * pressure);

          const targetWght = 140 + eased * 860;
          const targetWdth = 72 + eased * 54;

          weights[i] += (targetWght - weights[i]) * 0.16;
          widths[i] += (targetWdth - widths[i]) * 0.16;

          const w = weights[i].toFixed(0);
          const wd = widths[i].toFixed(1);
          const scaleY = (1 + eased * 0.08).toFixed(3);

          el.style.fontVariationSettings = `'wght' ${w}, 'wdth' ${wd}, 'opsz' 72`;
          el.style.transform = `scaleY(${scaleY})`;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseleave", handlePointerLeave);
    };
  }, [chars]);

  return (
    <span className="relative inline-flex items-center gap-2.5 sm:gap-4 mt-2 sm:mt-3 flex-wrap sm:flex-nowrap justify-center lg:justify-start select-none cursor-default">
      {/* Ambient glow behind text */}
      <span
        aria-hidden="true"
        className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-sky-400/20 via-indigo-500/20 to-amber-400/20 blur-3xl -z-10 pointer-events-none"
      />

      <span
        ref={containerRef}
        aria-label={name}
        className="text-pressure-font inline-flex items-baseline text-[1.75rem] min-[400px]:text-[2.05rem] sm:text-5xl lg:text-[3.35rem] xl:text-[4.1rem] tracking-tight leading-[1.08] whitespace-nowrap"
      >
        {chars.map((char, index) => (
          <span
            key={`${index}-${char}`}
            ref={(el) => {
              charRefs.current[index] = el;
            }}
            aria-hidden="true"
            className={char === " " ? "inline-block w-[0.28em]" : "text-pressure-char"}
            style={
              char === " "
                ? undefined
                : { fontVariationSettings: "'wght' 700, 'wdth' 100, 'opsz' 72" }
            }
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>

      <span className="inline-flex flex-shrink-0">
        <VerifiedBadge
          size="2xl"
          className="inline-block flex-shrink-0 drop-shadow-[0_0_14px_rgba(56,189,248,0.65)]"
        />
      </span>
    </span>
  );
}
