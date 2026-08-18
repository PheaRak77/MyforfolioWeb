/**
 * Generates an inline SVG placeholder when legacy Render disk images are missing.
 * Works in all browsers without any network request.
 */
export const getImagePlaceholder = (title = "Image", variant = "default") => {
  const label = String(title).trim().slice(0, 36) || "Portfolio";
  const safeLabel = label.replace(/[<>&'"]/g, "");

  const palettes = {
    certificate: { from: "#312e81", to: "#1e1b4b", accent: "#a5b4fc" },
    project: { from: "#1e3a5f", to: "#0f172a", accent: "#60a5fa" },
    profile: { from: "#1e40af", to: "#312e81", accent: "#93c5fd" },
    default: { from: "#1e293b", to: "#0f172a", accent: "#94a3b8" },
  };

  const { from, to, accent } = palettes[variant] || palettes.default;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${from}"/>
        <stop offset="100%" style="stop-color:${to}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#bg)"/>
    <circle cx="400" cy="230" r="56" fill="${accent}" opacity="0.15"/>
    <path d="M370 250 L400 220 L430 250 L430 290 L370 290 Z" fill="none" stroke="${accent}" stroke-width="6" opacity="0.5"/>
    <text x="400" y="360" text-anchor="middle" fill="${accent}" font-family="system-ui,sans-serif" font-size="22" font-weight="600">${safeLabel}</text>
    <text x="400" y="395" text-anchor="middle" fill="${accent}" font-size="14" opacity="0.7">Re-upload in Admin Dashboard</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
