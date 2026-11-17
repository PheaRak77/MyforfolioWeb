import { useEffect, useRef } from "react";
import VerifiedBadge from "./VerifiedBadge";

/**
 * 3D GPU-composited animated hero name ("Yorn Pheareak").
 * - Multi-layer Z-depth extrusion (transform-style: preserve-3d)
 * - Smooth autonomous 3D float on all devices + cursor 3D tilt on desktop
 * - Direct DOM style mutation via requestAnimationFrame (0 React re-renders)
 */
export default function HeroName3D({ name = "Yorn Pheareak" }) {
  const stageRef = useRef(null);
  const rafRef = useRef(0);
  const targetRef = useRef({ rx: 0, ry: 0 });

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const applyTilt = () => {
    rafRef.current = 0;
    const node = stageRef.current;
    if (!node) return;
    node.style.setProperty("--name-rx", `${targetRef.current.rx.toFixed(2)}deg`);
    node.style.setProperty("--name-ry", `${targetRef.current.ry.toFixed(2)}deg`);
  };

  const handlePointerMove = (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    const node = stageRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    targetRef.current = {
      rx: -ny * 14,
      ry: nx * 18,
    };

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(applyTilt);
    }
  };

  const handlePointerLeave = () => {
    targetRef.current = { rx: 0, ry: 0 };
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(applyTilt);
    }
  };

  return (
    <span
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="hero-name-3d-stage relative inline-flex items-center gap-2.5 sm:gap-4 mt-2 sm:mt-3 flex-wrap sm:flex-nowrap justify-center lg:justify-start select-none cursor-default"
    >
      {/* Ambient 3D Refraction Glow Behind Text */}
      <span
        aria-hidden="true"
        className="hero-name-3d-glow absolute -inset-4 rounded-3xl bg-gradient-to-r from-sky-400/25 via-indigo-500/25 to-amber-400/25 blur-3xl -z-10 animate-aurora-1 pointer-events-none"
      />

      {/* 3D Rotatable Inner Plane */}
      <span className="hero-name-3d-plane relative inline-flex items-center gap-2.5 sm:gap-4">
        <span className="relative inline-block">
          {/* Deep Extruded Back Layer (Z = -14px) */}
          <span
            aria-hidden="true"
            className="hero-name-3d-depth-2 font-black text-[2.15rem] sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight whitespace-nowrap pointer-events-none"
          >
            {name}
          </span>

          {/* Mid Extruded Layer (Z = -7px) */}
          <span
            aria-hidden="true"
            className="hero-name-3d-depth-1 font-black text-[2.15rem] sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight whitespace-nowrap pointer-events-none"
          >
            {name}
          </span>

          {/* Primary Luminous Gradient Front Face (Z = +16px) */}
          <span className="hero-name-3d-front relative block font-black text-[2.15rem] sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight whitespace-nowrap">
            {name}
          </span>
        </span>

        {/* Verified Badge floating forward in 3D Z-space */}
        <span className="hero-name-3d-badge inline-flex flex-shrink-0">
          <VerifiedBadge
            size="2xl"
            className="inline-block flex-shrink-0 drop-shadow-[0_0_14px_rgba(56,189,248,0.65)]"
          />
        </span>
      </span>
    </span>
  );
}
