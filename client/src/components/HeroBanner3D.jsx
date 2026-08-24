import { useEffect, useRef } from "react";

/**
 * Hero Banner 3D Live Background
 * Features: Rotating 3D wireframe sphere + orbiting rings + DNA helix + shooting stars
 * Pure canvas, GPU-composited, pauses when hidden.
 */
export default function HeroBanner3D() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    let isVisible = !document.hidden;
    let mouseX = 0, mouseY = 0;

    // ---- Resize ----
    const resize = () => {
      const el = canvas.parentElement;
      W = el.offsetWidth;
      H = el.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.scale(dpr, dpr);
      mouseX = W * 0.5;
      mouseY = H * 0.5;
    };

    // =============================================
    // 3D MATH HELPERS
    // =============================================
    const project = (x, y, z, fov = 420, cx, cy) => {
      const scale = fov / (fov + z);
      return {
        x: cx + x * scale,
        y: cy + y * scale,
        scale,
      };
    };

    const rotX = (y, z, a) => ({
      y: y * Math.cos(a) - z * Math.sin(a),
      z: y * Math.sin(a) + z * Math.cos(a),
    });
    const rotY = (x, z, a) => ({
      x: x * Math.cos(a) + z * Math.sin(a),
      z: -x * Math.sin(a) + z * Math.cos(a),
    });
    const rotZ = (x, y, a) => ({
      x: x * Math.cos(a) - y * Math.sin(a),
      y: x * Math.sin(a) + y * Math.cos(a),
    });

    // =============================================
    // WIREFRAME SPHERE
    // =============================================
    const buildSphere = (r, latSegs, lonSegs) => {
      const verts = [];
      for (let lat = 0; lat <= latSegs; lat++) {
        const theta = (lat / latSegs) * Math.PI;
        for (let lon = 0; lon <= lonSegs; lon++) {
          const phi = (lon / lonSegs) * 2 * Math.PI;
          verts.push({
            x: r * Math.sin(theta) * Math.cos(phi),
            y: r * Math.cos(theta),
            z: r * Math.sin(theta) * Math.sin(phi),
            lat,
            lon,
          });
        }
      }
      return { verts, latSegs, lonSegs };
    };

    const isMobile = window.innerWidth < 768;
    const sphereR = isMobile ? 90 : 140;
    const sphere = buildSphere(sphereR, isMobile ? 9 : 12, isMobile ? 12 : 18);

    const drawSphere = (t, cx, cy) => {
      const ax = t * 0.00025 + (mouseY - cy) * 0.00018;
      const ay = t * 0.00035 + (mouseX - cx) * 0.00018;

      const projected = sphere.verts.map(({ x, y, z }) => {
        const rx = rotX(y, z, ax);
        const ry = rotY(x, rx.z, ay);
        return project(ry.x, rx.y, ry.z, 480, cx, cy);
      });

      const { latSegs, lonSegs } = sphere;
      ctx.save();

      for (let lat = 0; lat < latSegs; lat++) {
        for (let lon = 0; lon < lonSegs; lon++) {
          const i = lat * (lonSegs + 1) + lon;
          const a = projected[i];
          const b = projected[i + 1];             // next lon
          const c = projected[i + lonSegs + 1];   // next lat, same lon

          if (!a || !b || !c) continue;

          // Depth-based opacity
          const depth = (a.scale - 0.4) / 0.6;
          const alpha = Math.max(0.04, depth * 0.35);

          // Lat line
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();

          // Lon line
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(c.x, c.y);
          ctx.strokeStyle = `rgba(59,130,246,${alpha * 0.9})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Glow dots at intersections
          if (lat % 3 === 0 && lon % 3 === 0 && depth > 0.4) {
            ctx.beginPath();
            ctx.arc(a.x, a.y, 1.2 * a.scale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(147,197,253,${depth * 0.7})`;
            ctx.fill();
          }
        }
      }
      ctx.restore();
    };

    // =============================================
    // ORBITING RINGS
    // =============================================
    const rings = [
      { r: sphereR * 1.35, tiltX: 0.4, tiltZ: 0.2, speed: 0.00022, color: "99,102,241", segments: 80 },
      { r: sphereR * 1.6,  tiltX: 1.1, tiltZ: 0.8, speed: -0.00016, color: "59,130,246", segments: 70 },
      { r: sphereR * 1.85, tiltX: 0.7, tiltZ: 1.5, speed: 0.00012, color: "168,85,247", segments: 60 },
    ];

    const drawRings = (t, cx, cy) => {
      rings.forEach((ring) => {
        const angle = t * ring.speed;
        ctx.save();
        ctx.beginPath();

        for (let i = 0; i <= ring.segments; i++) {
          const phi = (i / ring.segments) * Math.PI * 2;
          let x = ring.r * Math.cos(phi);
          let y = ring.r * Math.sin(phi);
          let z = 0;

          // Tilt on X axis
          const rx = rotX(y, z, ring.tiltX);
          y = rx.y; z = rx.z;

          // Tilt on Z axis
          const rz = rotZ(x, y, ring.tiltZ);
          x = rz.x; y = rz.y;

          // Rotate over time
          const ry = rotY(x, z, angle);
          x = ry.x; z = ry.z;

          const p = project(x, y, z, 500, cx, cy);
          const depth = (p.scale - 0.3) / 0.7;
          const alpha = Math.max(0.03, depth * 0.3);

          if (i === 0) {
            ctx.moveTo(p.x, p.y);
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }

        ctx.closePath();
        ctx.strokeStyle = `rgba(${ring.color},0.22)`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      });
    };

    // =============================================
    // DNA / HELIX STRANDS
    // =============================================
    const HELIX_NODES = isMobile ? 20 : 32;
    const drawHelix = (t, cx, cy) => {
      const hx = W * 0.88;
      const hy = H * 0.5;
      const height = Math.min(H * 0.7, 340);
      const rx = isMobile ? 18 : 28;
      const ry = 6;
      const speed = t * 0.0006;

      const strand1 = [];
      const strand2 = [];

      for (let i = 0; i <= HELIX_NODES; i++) {
        const frac = i / HELIX_NODES;
        const a = frac * Math.PI * 4 + speed;
        const yPos = hy - height / 2 + frac * height;
        strand1.push({ x: hx + Math.cos(a) * rx, y: yPos, z: Math.sin(a) * ry });
        strand2.push({ x: hx + Math.cos(a + Math.PI) * rx, y: yPos, z: Math.sin(a + Math.PI) * ry });
      }

      ctx.save();
      // Draw strand 1
      ctx.beginPath();
      strand1.forEach((p, i) => {
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = "rgba(99,102,241,0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw strand 2
      ctx.beginPath();
      strand2.forEach((p, i) => {
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = "rgba(168,85,247,0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cross links
      for (let i = 0; i <= HELIX_NODES; i += 2) {
        const a = strand1[i], b = strand2[i];
        if (!a || !b) continue;
        const depth = (a.z + ry) / (ry * 2);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(59,130,246,${0.1 + depth * 0.25})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Nodes
        [a, b].forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(147,197,253,${0.35 + depth * 0.4})`;
          ctx.shadowColor = "rgba(99,102,241,0.8)";
          ctx.shadowBlur = 6;
          ctx.fill();
        });
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    // =============================================
    // SHOOTING STARS
    // =============================================
    const shootingStars = Array.from({ length: isMobile ? 3 : 6 }, () => newStar());
    function newStar() {
      return {
        x: Math.random() * W,
        y: Math.random() * H * 0.5,
        len: Math.random() * 80 + 40,
        speed: Math.random() * 4 + 2,
        angle: Math.PI * 0.22 + (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.6 + 0.3,
        active: Math.random() > 0.6,
        cooldown: Math.random() * 200,
      };
    }

    const drawShootingStars = () => {
      shootingStars.forEach((s) => {
        if (!s.active) {
          s.cooldown--;
          if (s.cooldown <= 0) {
            Object.assign(s, newStar(), { active: true });
          }
          return;
        }

        const tail = s.len;
        const ex = s.x - Math.cos(s.angle) * tail;
        const ey = s.y - Math.sin(s.angle) * tail;

        const grad = ctx.createLinearGradient(ex, ey, s.x, s.y);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(1, `rgba(255,255,255,${s.opacity})`);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "rgba(147,197,253,0.8)";
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.restore();

        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;

        if (s.x > W + 100 || s.y > H + 100) {
          s.active = false;
          s.cooldown = Math.random() * 300 + 100;
        }
      });
    };

    // =============================================
    // RENDER LOOP
    // =============================================
    const render = (t) => {
      if (!isVisible) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, W, H);

      // Sphere center: left-center area
      const cx = isMobile ? W * 0.5 : W * 0.38;
      const cy = H * 0.5;

      drawRings(t, cx, cy);
      drawSphere(t, cx, cy);
      if (!isMobile) drawHelix(t, cx, cy);
      drawShootingStars();

      animRef.current = requestAnimationFrame(render);
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onVisibility = () => { isVisible = !document.hidden; };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    resize();
    animRef.current = requestAnimationFrame(render);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
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
