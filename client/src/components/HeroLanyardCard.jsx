import { memo, useEffect, useId, useRef, useState } from "react";
import PortfolioImage from "./PortfolioImage";
import VerifiedBadge from "./VerifiedBadge";

/**
 * Interactive 3D Swinging Lanyard ID Badge (inspired by ReactBits Lanyard).
 * - Spring-pendulum physics with drag, throw velocity, stretchy woven SVG strap,
 *   dynamic metallic clasp hook, and click-to-flip 3D double-sided ID pass.
 * - Mutates DOM transforms directly inside requestAnimationFrame for 60fps smoothness
 *   with zero React re-renders and zero heavy WebGL bundle cost.
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
  const strapTextRef = useRef(null);
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

    let rafId = 0;
    let prevTime = performance.now();

    const BASE_STRAP_LENGTH = 84;
    const ANCHOR_X = 180;
    const ANCHOR_Y = 0;

    const tick = (now) => {
      const dt = Math.min((now - prevTime) / 16.6667, 2.2);
      prevTime = now;

      const p = physicsRef.current;

      if (!p.dragging) {
        // Gentle breeze sway + damped spring return to resting hang point
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

      // Compute natural pendulum angle + velocity-driven 3D tilt
      const targetRotZ = Math.max(-24, Math.min(24, -p.x * 0.14 - p.vx * 0.55));
      const targetRotY = Math.max(-24, Math.min(24, p.x * 0.12 + p.vx * 0.65));
      const targetRotX = Math.max(-18, Math.min(18, -p.y * 0.11 - p.vy * 0.45));

      p.rotZ += (targetRotZ - p.rotZ) * Math.min(1, 0.22 * dt);
      p.rotY += (targetRotY - p.rotY) * Math.min(1, 0.2 * dt);
      p.rotX += (targetRotX - p.rotX) * Math.min(1, 0.2 * dt);
      p.flipAngle += (p.targetFlip - p.flipAngle) * Math.min(1, 0.16 * dt);

      // Update Card 3D Pivot (hung from top lanyard slot)
      if (cardPivotRef.current) {
        cardPivotRef.current.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotateZ(${p.rotZ.toFixed(2)}deg) rotateX(${p.rotX.toFixed(2)}deg) rotateY(${p.rotY.toFixed(2)}deg)`;
      }

      if (cardFlipRef.current) {
        cardFlipRef.current.style.transform = `rotateY(${p.flipAngle.toFixed(2)}deg)`;
      }

      // Dynamic holographic glare on badge face
      if (glareRef.current) {
        const gx = Math.max(10, Math.min(90, 50 + p.x * 0.25 + p.rotY * 1.1));
        const gy = Math.max(10, Math.min(90, 35 - p.y * 0.25 - p.rotX * 1.1));
        glareRef.current.style.background = `radial-gradient(circle at ${gx.toFixed(1)}% ${gy.toFixed(1)}%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.08) 38%, transparent 72%)`;
      }

      // Stretchy SVG Woven Strap curve from top center pin down to badge clasp
      const endX = ANCHOR_X + p.x;
      const endY = Math.max(26, BASE_STRAP_LENGTH + p.y);
      const ctrlX = ANCHOR_X + p.x * 0.35 - p.vx * 0.6;
      const ctrlY = endY * 0.52;

      const d = `M ${ANCHOR_X} ${ANCHOR_Y} Q ${ctrlX.toFixed(2)} ${ctrlY.toFixed(2)} ${endX.toFixed(2)} ${endY.toFixed(2)}`;
      if (strapPathRef.current) {
        strapPathRef.current.setAttribute("d", d);
      }
      if (strapTextRef.current) {
        strapTextRef.current.setAttribute("d", d);
      }
      if (claspGroupRef.current) {
        const claspAngle = p.rotZ * 0.85;
        claspGroupRef.current.setAttribute(
          "transform",
          `translate(${endX.toFixed(2)}, ${endY.toFixed(2)}) rotate(${claspAngle.toFixed(2)})`,
        );
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
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

    // Elastic rubber limit so user feels natural strap tension
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

    // Treat short tap/click without drag as a 3D badge flip!
    if (p.movedDistance < 8) {
      setIsFlipped((prev) => !prev);
      p.vy += 2.2;
    }
  };

  const displayName = user?.name || "Yorn Pheareak";

  return (
    <div
      ref={stageRef}
      className="relative flex flex-col items-center select-none w-[320px] sm:w-[360px] mx-auto"
    >
      {/* Subtle ambient glow behind badge */}
      <div
        aria-hidden="true"
        className="absolute top-20 inset-x-6 h-72 rounded-full bg-gradient-to-tr from-sky-400/20 via-indigo-500/15 to-amber-400/20 blur-3xl pointer-events-none"
      />

      {/* Elastic Woven Lanyard Band + Chrome Clasp SVG Overlay */}
      <svg
        viewBox="0 0 360 220"
        className="relative z-20 w-[320px] sm:w-[360px] h-[106px] sm:h-[112px] overflow-visible pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`strapGrad-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="22%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="78%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <pattern
            id={`weave-${uid}`}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
            />
          </pattern>

          <linearGradient id={`metalGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="45%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* Woven Ribbon Strap */}
        <path
          ref={strapPathRef}
          d="M 180 0 Q 180 44 180 84"
          fill="none"
          stroke={`url(#strapGrad-${uid})`}
          strokeWidth="24"
          strokeLinecap="butt"
        />
        <path
          ref={strapTextRef}
          d="M 180 0 Q 180 44 180 84"
          fill="none"
          stroke={`url(#weave-${uid})`}
          strokeWidth="24"
          strokeLinecap="butt"
        />

        {/* Repeating Lanyard Badge Emblem */}
        <circle cx="180" cy="36" r="5" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.4" />
        <circle cx="180" cy="36" r="1.6" fill="#38bdf8" />

        {/* Metallic Clamp & Swivel Ring attaching to ID Slot */}
        <g ref={claspGroupRef} transform="translate(180, 84)">
          <rect
            x="-15"
            y="-10"
            width="30"
            height="14"
            rx="4"
            fill={`url(#metalGrad-${uid})`}
            stroke="#334155"
            strokeWidth="1"
          />
          <rect x="-11" y="-6" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.45)" />
          <path
            d="M 0 4 C 7 4 9 18 0 21 C -9 18 -7 4 0 4 Z"
            fill="none"
            stroke={`url(#metalGrad-${uid})`}
            strokeWidth="3.2"
          />
          <rect x="-3.5" y="1" width="7" height="5" rx="2" fill="#cbd5e1" />
        </g>
      </svg>

      {/* 3D Interactive Double-Sided ID Badge */}
      <div
        className="lanyard-perspective relative z-10 -mt-[22px]"
      >
        <div
          ref={cardPivotRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="button"
          tabIndex={0}
          aria-label="Interactive 3D developer ID badge. Drag to swing or click to flip."
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsFlipped((prev) => !prev);
            }
          }}
          style={{ transformOrigin: "50% -18px", touchAction: "none" }}
          className={`lanyard-pivot relative w-[258px] sm:w-[286px] h-[358px] sm:h-[392px] ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          } focus:outline-none`}
        >
          <div
            ref={cardFlipRef}
            className="lanyard-card-3d relative w-full h-full"
          >
            {/* FRONT FACE */}
            <div className="lanyard-face lanyard-front absolute inset-0 rounded-[26px] p-4 sm:p-5 flex flex-col justify-between overflow-hidden border border-black/10 dark:border-white/20 bg-gradient-to-br from-white/95 via-slate-50/90 to-slate-200/85 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-950/95 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.45)] dark:shadow-[0_28px_70px_-15px_rgba(0,0,0,0.85)] backdrop-blur-xl">
              {/* Dynamic Specular Sheen */}
              <div
                ref={glareRef}
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none z-20 rounded-[26px]"
              />

              {/* Subtle Holographic Top Strip + Lanyard Slot Cutout */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-14 h-3.5 rounded-full bg-slate-200 dark:bg-slate-950 border border-black/15 dark:border-white/15 shadow-inner mb-3" />

                <div className="w-full flex items-center justify-between text-[11px] font-mono">
                  <span className="inline-flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400">
                    <span className="text-xs">&lt;/&gt;</span> DEV PASS
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">
                    @yornpheareak
                  </span>
                </div>
              </div>

              {/* Portrait Frame */}
              <div className="relative z-10 my-2.5 flex-1 min-h-0 rounded-2xl overflow-hidden border border-black/10 dark:border-white/15 bg-slate-100 dark:bg-slate-800 shadow-inner">
                {user?.profile_image && !profileImgError ? (
                  <PortfolioImage
                    src={user.profile_image}
                    alt={displayName}
                    variant="profile"
                    priority={true}
                    sizes="(max-width: 640px) 240px, 280px"
                    onError={onImageError}
                    draggable={false}
                    className="w-full h-full object-cover object-top pointer-events-none select-none"
                    fallback={
                      <img
                        src="/profile-framed.png"
                        alt={displayName}
                        draggable={false}
                        className="w-full h-full object-cover object-top pointer-events-none"
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
                    className="w-full h-full object-cover object-top pointer-events-none select-none"
                  />
                )}

                {/* Subtle Bottom Vignette Inside Portrait */}
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/50 via-black/15 to-transparent pointer-events-none" />
                <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-emerald-300 border border-white/15">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Verified
                </span>
              </div>

              {/* Identity Footer */}
              <div className="relative z-10 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                      <span className="truncate">{displayName}</span>
                      <VerifiedBadge size="sm" />
                    </h2>
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Full-Stack Developer
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-amber-400/20 border border-amber-500/30 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 font-mono">
                    ID · 04
                  </span>
                </div>
              </div>
            </div>

            {/* BACK FACE (Click / Tap to Flip) */}
            <div className="lanyard-face lanyard-back absolute inset-0 rounded-[26px] p-5 flex flex-col justify-between overflow-hidden border border-black/15 dark:border-white/20 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white shadow-[0_24px_60px_-15px_rgba(15,23,42,0.55)]">
              <div className="flex flex-col items-center">
                <div className="w-14 h-3.5 rounded-full bg-slate-800 border border-white/20 shadow-inner mb-4" />
                <div className="w-full h-9 -mx-5 px-5 bg-black/75 border-y border-white/10 flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-400">
                  <span>YP // PORTFOLIO ACCESS</span>
                  <span>2026</span>
                </div>
              </div>

              <div className="space-y-3 my-auto text-left">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-sky-400 font-bold">
                    Holder
                  </p>
                  <p className="text-base font-extrabold text-white mt-0.5">
                    {displayName}
                  </p>
                </div>

                {user?.email && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                      Email
                    </p>
                    <p className="text-xs font-medium text-slate-200 truncate">
                      {user.email}
                    </p>
                  </div>
                )}

                {user?.phone && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                      Phone / Telegram
                    </p>
                    <p className="text-xs font-medium text-slate-200">
                      {user.phone}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["React", "Node.js", "Express", "PostgreSQL"].map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] font-semibold text-sky-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>ypheareak.site</span>
                <span className="text-amber-300 font-semibold">Click to flip ↻</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Hint */}
      <p className="mt-4 text-xs font-medium text-neutral-500 dark:text-slate-400 tracking-wide flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
        Try dragging · Click to flip
      </p>
    </div>
  );
});

export default HeroLanyardCard;
