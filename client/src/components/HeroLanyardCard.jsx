import { memo, useEffect, useId, useRef, useState } from "react";
import PortfolioImage from "./PortfolioImage";
import { startViewportRafLoop } from "../utils/viewportRaf";

/**
 * Interactive 3D Swinging Lanyard Photo Badge (inspired by ReactBits Lanyard).
 * - Full-bleed large portrait card hanging from a stretchy woven SVG lanyard band
 *   and chrome swivel clasp anchored directly into the punched slot.
 * - Spring-pendulum physics with drag, throw velocity, and click-to-flip 3D pass.
 */
const HeroLanyardCard = memo(function HeroLanyardCard({
  user,
  loading = false,
  profileImgError = false,
  onImageError,
}) {
  const uid = useId().replace(/:/g, "");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const stageRef = useRef(null);
  const cardPivotRef = useRef(null);
  const cardFlipRef = useRef(null);
  const strapPathRef = useRef(null);
  const strapWeaveRef = useRef(null);
  const strapLogoRef = useRef(null);
  const claspGroupRef = useRef(null);
  const glareRef = useRef(null);

  const physicsRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotZ: 0,
    rotX: 0,
    rotY: 0,
    flipAngle: 0,
    targetFlip: 0,
    dragging: false,
    startPointerX: 0,
    startPointerY: 0,
    startCardX: 0,
    startCardY: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    lastTime: 0,
    movedDistance: 0,
  });

  useEffect(() => {
    physicsRef.current.targetFlip = isFlipped ? 180 : 0;
  }, [isFlipped]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const ANCHOR_X = 190;
    const ANCHOR_Y = -16;
    const BASE_STRAP_LENGTH = 100;

    return startViewportRafLoop(stageRef.current, (now, dt) => {
      const p = physicsRef.current;

      if (!p.dragging) {
        const idleWindX = prefersReducedMotion
          ? 0
          : Math.sin(now * 0.0014) * 5.5 + Math.cos(now * 0.00085) * 2.5;
        const idleBobY = prefersReducedMotion ? 0 : Math.sin(now * 0.0021) * 1.8;

        const stiffness = 0.085;
        const damping = 0.885;

        const ax = (idleWindX - p.x) * stiffness;
        const ay = (idleBobY - p.y) * (stiffness * 1.25);

        p.vx = (p.vx + ax * dt) * Math.pow(damping, dt);
        p.vy = (p.vy + ay * dt) * Math.pow(damping, dt);

        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      const targetRotZ = Math.max(-24, Math.min(24, -p.x * 0.14 - p.vx * 0.55));
      const targetRotY = Math.max(-24, Math.min(24, p.x * 0.12 + p.vx * 0.65));
      const targetRotX = Math.max(-18, Math.min(18, -p.y * 0.11 - p.vy * 0.45));

      p.rotZ += (targetRotZ - p.rotZ) * Math.min(1, 0.22 * dt);
      p.rotY += (targetRotY - p.rotY) * Math.min(1, 0.2 * dt);
      p.rotX += (targetRotX - p.rotX) * Math.min(1, 0.2 * dt);
      p.flipAngle += (p.targetFlip - p.flipAngle) * Math.min(1, 0.16 * dt);

      if (cardPivotRef.current) {
        cardPivotRef.current.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotateZ(${p.rotZ.toFixed(2)}deg) rotateX(${p.rotX.toFixed(2)}deg) rotateY(${p.rotY.toFixed(2)}deg)`;
      }

      if (cardFlipRef.current) {
        cardFlipRef.current.style.transform = `rotateY(${p.flipAngle.toFixed(2)}deg)`;
      }

      if (glareRef.current) {
        const gx = Math.max(10, Math.min(90, 50 + p.x * 0.25 + p.rotY * 1.1));
        const gy = Math.max(10, Math.min(90, 35 - p.y * 0.25 - p.rotX * 1.1));
        glareRef.current.style.background = `radial-gradient(circle at ${gx.toFixed(1)}% ${gy.toFixed(1)}%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.06) 38%, transparent 72%)`;
      }

      // 1:1 SVG coordinate space matching 380x120 wrapper so clasp hooks directly into slot
      const endX = ANCHOR_X + p.x;
      const endY = Math.max(32, BASE_STRAP_LENGTH + p.y);
      const ctrlX = ANCHOR_X + p.x * 0.35 - p.vx * 0.6;
      const ctrlY = endY * 0.52;

      const d = `M ${ANCHOR_X} ${ANCHOR_Y} Q ${ctrlX.toFixed(2)} ${ctrlY.toFixed(2)} ${endX.toFixed(2)} ${endY.toFixed(2)}`;
      if (strapPathRef.current) strapPathRef.current.setAttribute("d", d);
      if (strapWeaveRef.current) strapWeaveRef.current.setAttribute("d", d);

      // Keep woven emblem centered along midpoint of the Bézier curve
      if (strapLogoRef.current) {
        const midX = 0.25 * ANCHOR_X + 0.5 * ctrlX + 0.25 * endX;
        const midY = 0.25 * ANCHOR_Y + 0.5 * ctrlY + 0.25 * endY;
        strapLogoRef.current.setAttribute(
          "transform",
          `translate(${midX.toFixed(2)}, ${midY.toFixed(2)}) rotate(${(p.rotZ * 0.4).toFixed(2)})`,
        );
      }

      if (claspGroupRef.current) {
        const claspAngle = p.rotZ * 0.85;
        claspGroupRef.current.setAttribute(
          "transform",
          `translate(${endX.toFixed(2)}, ${endY.toFixed(2)}) rotate(${claspAngle.toFixed(2)})`,
        );
      }
    });
  }, []);

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);

    const p = physicsRef.current;
    p.dragging = true;
    p.startPointerX = e.clientX;
    p.startPointerY = e.clientY;
    p.startCardX = p.x;
    p.startCardY = p.y;
    p.lastPointerX = e.clientX;
    p.lastPointerY = e.clientY;
    p.lastTime = performance.now();
    p.movedDistance = 0;
    p.vx = 0;
    p.vy = 0;
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    const p = physicsRef.current;
    if (!p.dragging) return;

    const now = performance.now();
    const dt = Math.max(4, now - p.lastTime);
    const dx = e.clientX - p.startPointerX;
    const dy = e.clientY - p.startPointerY;

    p.movedDistance = Math.hypot(dx, dy);

    const rawX = p.startCardX + dx;
    const rawY = p.startCardY + dy;
    const clampedX = Math.max(-145, Math.min(145, rawX));
    const clampedY = Math.max(-44, Math.min(115, rawY));

    const stepX = e.clientX - p.lastPointerX;
    const stepY = e.clientY - p.lastPointerY;
    p.vx = Math.max(-28, Math.min(28, (stepX / dt) * 16));
    p.vy = Math.max(-24, Math.min(24, (stepY / dt) * 16));

    p.x = clampedX;
    p.y = clampedY;
    p.lastPointerX = e.clientX;
    p.lastPointerY = e.clientY;
    p.lastTime = now;
  };

  const handlePointerUp = (e) => {
    const p = physicsRef.current;
    if (!p.dragging) return;
    p.dragging = false;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);

    if (p.movedDistance < 8) {
      setIsFlipped((prev) => !prev);
      p.vy += 2.2;
    }
  };

  const displayName = user?.name || "Yorn Pheareak";

  return (
    <div
      ref={stageRef}
      style={{ contain: "layout style" }}
      className="relative flex flex-col items-center select-none w-[320px] sm:w-[380px] mx-auto"
    >
      {/* Subtle ambient glow behind badge */}
      <div
        aria-hidden="true"
        className="absolute top-24 inset-x-4 h-80 rounded-full bg-gradient-to-tr from-sky-400/20 via-indigo-500/15 to-amber-400/20 blur-3xl pointer-events-none"
      />

      {/* Elastic Woven Lanyard Band + Chrome Clasp (1:1 SVG coordinate mapping) */}
      <svg
        viewBox="0 0 380 120"
        preserveAspectRatio="xMidYMin meet"
        className="relative z-20 w-[380px] max-w-none h-[120px] overflow-visible pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={`metalGrad-${uid}`}
            gradientUnits="userSpaceOnUse"
            x1="-17"
            y1="-11"
            x2="17"
            y2="25"
          >
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="45%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* Layered Solid SVG Strap Paths (immune to Chromium objectBoundingBox stroke clipping) */}
        <path
          ref={strapPathRef}
          d="M 190 -16 Q 190 50 190 100"
          fill="none"
          stroke="#0f172a"
          strokeWidth="28"
          strokeLinecap="butt"
        />
        <path
          ref={strapWeaveRef}
          d="M 190 -16 Q 190 50 190 100"
          fill="none"
          stroke="#1e293b"
          strokeWidth="20"
          strokeLinecap="butt"
        />

        {/* Woven Emblem Centered on Strap */}
        <g ref={strapLogoRef} transform="translate(190, 50)">
          <circle
            cx="0"
            cy="0"
            r="6.5"
            fill="none"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="1.5"
          />
          <circle cx="0" cy="0" r="2" fill="#38bdf8" />
        </g>

        {/* Metallic Clamp & Swivel Ring directly hooking the card slot */}
        <g ref={claspGroupRef} transform="translate(190, 100)">
          <rect
            x="-17"
            y="-11"
            width="34"
            height="16"
            rx="4.5"
            fill={`url(#metalGrad-${uid})`}
            stroke="#334155"
            strokeWidth="1"
          />
          <rect x="-12" y="-6.5" width="24" height="3.2" rx="1.6" fill="rgba(255,255,255,0.5)" />
          <path
            d="M 0 5 C 8.5 5 10.5 22 0 25 C -10.5 22 -8.5 5 0 5 Z"
            fill="none"
            stroke={`url(#metalGrad-${uid})`}
            strokeWidth="3.6"
          />
          <rect x="-4" y="2" width="8" height="5.5" rx="2" fill="#cbd5e1" />
        </g>
      </svg>

      {/* Large 3D Interactive Photo Badge Card (zero text clutter on image) */}
      <div className="lanyard-perspective relative z-10 -mt-[22px]">
        <div
          ref={cardPivotRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="button"
          tabIndex={0}
          aria-label="Interactive 3D photo badge. Drag to swing or click to flip."
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsFlipped((prev) => !prev);
            }
          }}
          style={{ transformOrigin: "50% -20px", touchAction: "none" }}
          className={`lanyard-pivot relative w-[290px] sm:w-[335px] lg:w-[360px] h-[395px] sm:h-[455px] lg:h-[490px] ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          } focus:outline-none`}
        >
          <div
            ref={cardFlipRef}
            className="lanyard-card-3d relative w-full h-full"
          >
            {/* FRONT FACE — Pure Large Edge-to-Edge Portrait */}
            <div className="lanyard-face lanyard-front absolute inset-0 rounded-[28px] overflow-hidden border border-black/15 dark:border-white/25 bg-slate-100 dark:bg-slate-900 shadow-[0_28px_70px_-15px_rgba(15,23,42,0.5)] dark:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.88)]">
              {/* Dynamic Specular Sheen */}
              <div
                ref={glareRef}
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none z-20 rounded-[28px]"
              />

              {/* Punched Lanyard Slot at Top Center */}
              <div
                aria-hidden="true"
                className="absolute top-3.5 left-1/2 -translate-x-1/2 z-30 w-16 h-4 rounded-full bg-slate-200/90 dark:bg-slate-950/90 border border-black/20 dark:border-white/25 shadow-inner backdrop-blur-sm"
              />

              {/* Full-Bleed Profile Photo */}
              {user?.profile_image && !profileImgError ? (
                <PortfolioImage
                  src={user.profile_image}
                  alt={displayName}
                  variant="profile"
                  priority={true}
                  sizes="(max-width: 640px) 300px, 380px"
                  onError={onImageError}
                  draggable={false}
                  className="w-full h-full object-cover object-center pointer-events-none select-none"
                  fallback={
                    <img
                      src="/profile-framed.png"
                      alt={displayName}
                      draggable={false}
                      className="w-full h-full object-cover object-center pointer-events-none"
                    />
                  }
                />
              ) : loading && !profileImgError ? (
                <div
                  aria-hidden="true"
                  className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 animate-pulse"
                />
              ) : (
                <img
                  src="/profile-framed.png"
                  alt={displayName}
                  draggable={false}
                  className="w-full h-full object-cover object-center pointer-events-none select-none"
                />
              )}
            </div>

            {/* BACK FACE (Clean Minimal Frosted Glass Back on Flip) */}
            <div className="lanyard-face lanyard-back absolute inset-0 rounded-[28px] overflow-hidden border border-black/15 dark:border-white/25 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 shadow-[0_28px_70px_-15px_rgba(15,23,42,0.55)] flex items-center justify-center">
              <div
                aria-hidden="true"
                className="absolute top-3.5 left-1/2 -translate-x-1/2 z-30 w-16 h-4 rounded-full bg-slate-800 border border-white/25 shadow-inner"
              />
              <div className="relative w-24 h-24 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center shadow-2xl">
                <span className="text-3xl font-black tracking-tighter bg-gradient-to-tr from-sky-400 via-indigo-400 to-amber-300 bg-clip-text text-transparent">
                  YP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default HeroLanyardCard;
