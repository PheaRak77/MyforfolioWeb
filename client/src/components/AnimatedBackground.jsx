import { useEffect, useRef } from "react";

/**
 * High-performance 3D animated background — pure canvas, no external libs.
 * Uses requestAnimationFrame with GPU-composited transforms only.
 * Automatically reduces particle count on low-end devices via devicePixelRatio.
 * Pauses when tab is hidden (Page Visibility API) to save battery.
 */
export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    let W = 0, H = 0;
    let particles = [];
    let grid = [];
    let mouseX = W / 2, mouseY = H / 2;
    let isVisible = true;

    // Performance budget: fewer particles on low-end / mobile
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 35 : 65;
    const GRID_COLS = isMobile ? 8 : 14;
    const GRID_ROWS = isMobile ? 6 : 10;

    const resize = () => {
      W = canvas.parentElement.offsetWidth;
      H = canvas.parentElement.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.scale(dpr, dpr);
      initGrid();
    };

    // ----- FLOATING PARTICLES -----
    class Particle {
      constructor() { this.reset(true); }
      reset(init = false) {
        this.x = Math.random() * W;
        this.y = init ? Math.random() * H : H + 20;
        this.size = Math.random() * 1.8 + 0.4;
        this.speedY = -(Math.random() * 0.4 + 0.15);
        this.speedX = (Math.random() - 0.5) * 0.25;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.hue = Math.random() > 0.5 ? 220 : 260; // blue or violet
        this.pulse = Math.random() * Math.PI * 2;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulse += 0.02;
        const opacityFactor = 0.85 + Math.sin(this.pulse) * 0.15;
        this.currentOpacity = this.opacity * opacityFactor;

        // Mouse repel — soft glow attraction at distance
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          this.x -= (dx / dist) * 0.3;
          this.y -= (dy / dist) * 0.3;
        }
        if (this.y < -10 || this.x < -10 || this.x > W + 10) this.reset();
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.currentOpacity;
        ctx.fillStyle = `hsl(${this.hue}, 80%, 70%)`;
        ctx.shadowColor = `hsl(${this.hue}, 90%, 65%)`;
        ctx.shadowBlur = this.size * 6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // ----- 3D GRID MESH -----
    const initGrid = () => {
      grid = [];
      const colSpacing = W / (GRID_COLS - 1);
      const rowSpacing = H / (GRID_ROWS - 1);
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          grid.push({
            baseX: c * colSpacing,
            baseY: r * rowSpacing,
            phase: Math.random() * Math.PI * 2,
            amp: Math.random() * 8 + 4,
          });
        }
      }
      // Init particles
      particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
    };

    const drawGrid = (t) => {
      // Compute live positions with wave distortion
      const pts = grid.map((p) => {
        const wave = Math.sin(t * 0.0006 + p.phase) * p.amp;
        const wave2 = Math.cos(t * 0.0004 + p.phase * 1.3) * (p.amp * 0.5);
        // Mouse influence: slight pull toward mouse
        const mdx = (mouseX - p.baseX) / W;
        const mdy = (mouseY - p.baseY) / H;
        return {
          x: p.baseX + wave + mdx * 12,
          y: p.baseY + wave2 + mdy * 12,
        };
      });

      // Draw connecting lines (grid mesh)
      ctx.save();
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const i = r * GRID_COLS + c;
          const pt = pts[i];

          // Horizontal lines
          if (c < GRID_COLS - 1) {
            const next = pts[i + 1];
            const grad = ctx.createLinearGradient(pt.x, pt.y, next.x, next.y);
            grad.addColorStop(0, "rgba(99,102,241,0.08)");
            grad.addColorStop(0.5, "rgba(59,130,246,0.14)");
            grad.addColorStop(1, "rgba(99,102,241,0.08)");
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(next.x, next.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
          // Vertical lines
          if (r < GRID_ROWS - 1) {
            const next = pts[i + GRID_COLS];
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(next.x, next.y);
            ctx.strokeStyle = "rgba(99,102,241,0.07)";
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }

          // Intersection dots
          const distToMouse = Math.sqrt(
            (mouseX - pt.x) ** 2 + (mouseY - pt.y) ** 2
          );
          const dotSize = distToMouse < 120 ? 1.8 : 0.9;
          const dotOpacity = distToMouse < 120 ? 0.55 : 0.2;
          ctx.globalAlpha = dotOpacity;
          ctx.fillStyle = "rgb(147,197,253)";
          ctx.shadowColor = "rgba(59,130,246,0.8)";
          ctx.shadowBlur = distToMouse < 120 ? 8 : 0;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, dotSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
    };

    // ----- RADIAL DEPTH VIGNETTE -----
    const drawVignette = () => {
      const cx = W / 2, cy = H / 2;
      const r = Math.max(W, H) * 0.75;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, "rgba(15,23,42,0)");
      grad.addColorStop(0.55, "rgba(15,23,42,0)");
      grad.addColorStop(1, "rgba(15,23,42,0.7)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    };

    // ----- AURORA BLOBS -----
    const drawAurora = (t) => {
      const blobs = [
        { x: W * 0.2, y: H * 0.3, r: W * 0.35, h: 225, phase: 0 },
        { x: W * 0.75, y: H * 0.5, r: W * 0.3, h: 260, phase: 1.5 },
        { x: W * 0.5, y: H * 0.8, r: W * 0.25, h: 200, phase: 3 },
      ];
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      blobs.forEach((b) => {
        const ox = Math.sin(t * 0.0003 + b.phase) * 60;
        const oy = Math.cos(t * 0.0004 + b.phase) * 40;
        const grad = ctx.createRadialGradient(
          b.x + ox, b.y + oy, 0,
          b.x + ox, b.y + oy, b.r
        );
        grad.addColorStop(0, `hsla(${b.h}, 80%, 55%, 0.055)`);
        grad.addColorStop(1, `hsla(${b.h}, 80%, 55%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });
      ctx.restore();
    };

    // ----- RENDER LOOP -----
    const render = (t) => {
      if (!isVisible) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, W, H);

      drawAurora(t);
      drawGrid(t);
      particles.forEach((p) => { p.update(t); p.draw(); });
      drawVignette();

      animRef.current = requestAnimationFrame(render);
    };

    // ----- EVENT LISTENERS -----
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const onTouchMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.touches[0].clientX - rect.left;
      mouseY = e.touches[0].clientY - rect.top;
    };

    const onVisibility = () => {
      isVisible = !document.hidden;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    resize();
    animRef.current = requestAnimationFrame(render);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    />
  );
}
