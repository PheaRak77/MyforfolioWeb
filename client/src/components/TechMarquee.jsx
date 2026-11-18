import { memo, useState } from "react";
import { getSkillIconUrl } from "../utils/skillIcons";

const MARQUEE_TECH_STACK = [
  { name: "Express.js", lookup: "express", accent: "#64748b", tint: "from-slate-500/20 to-zinc-500/10" },
  { name: "Node.js", lookup: "node", accent: "#22c55e", tint: "from-emerald-500/20 to-green-500/10" },
  { name: "JavaScript", lookup: "javascript", accent: "#eab308", tint: "from-yellow-400/25 to-amber-500/10" },
  { name: "React", lookup: "react", accent: "#38bdf8", tint: "from-sky-400/20 to-cyan-500/10" },
  { name: "Tailwind CSS", lookup: "tailwindcss", accent: "#06b6d4", tint: "from-cyan-400/20 to-sky-500/10" },
  { name: "Bootstrap", lookup: "bootstrap", accent: "#8b5cf6", tint: "from-violet-500/20 to-purple-500/10" },
  { name: "PostgreSQL", lookup: "postgresql", accent: "#3b82f6", tint: "from-blue-500/20 to-indigo-500/10" },
  { name: "Git", lookup: "git", accent: "#f97316", tint: "from-orange-500/20 to-red-500/10" },
  { name: "GitHub", lookup: "github", accent: "#94a3b8", tint: "from-slate-400/20 to-slate-600/10" },
  { name: "HTML5", lookup: "html5", accent: "#ef4444", tint: "from-orange-500/20 to-rose-500/10" },
  { name: "CSS3", lookup: "css3", accent: "#2563eb", tint: "from-blue-500/20 to-sky-500/10" },
  { name: "Python", lookup: "python", accent: "#38bdf8", tint: "from-sky-500/20 to-yellow-400/10" },
  { name: "Vite", lookup: "vite", accent: "#a855f7", tint: "from-purple-500/20 to-amber-400/10" },
];

const MarqueeTechPill = memo(function MarqueeTechPill({ tech, onJumpToSkills }) {
  const [failed, setFailed] = useState(false);
  const iconUrl = !failed ? getSkillIconUrl(tech.lookup) : null;

  return (
    <a
      href="#skills"
      onClick={onJumpToSkills}
      className="liquid-glass-pill group inline-flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl flex-shrink-0 transition-transform duration-300 hover:-translate-y-0.5 hover:scale-[1.03]"
    >
      <span
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br ${tech.tint} border border-black/10 dark:border-white/15 flex items-center justify-center flex-shrink-0 shadow-sm`}
      >
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={tech.name}
            className="w-4 h-4 sm:w-[18px] sm:h-[18px] object-contain dark:invert dark:brightness-200 transition-transform duration-300 group-hover:scale-110"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        ) : (
          <span
            className="text-xs font-extrabold"
            style={{ color: tech.accent }}
          >
            {tech.name.charAt(0)}
          </span>
        )}
      </span>

      <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-100 whitespace-nowrap tracking-tight">
        {tech.name}
      </span>

      <span
        aria-hidden="true"
        className="w-1.5 h-1.5 rounded-full opacity-80 flex-shrink-0"
        style={{ backgroundColor: tech.accent }}
      />
    </a>
  );
});

/**
 * Infinite GPU-composited Liquid Glass tech stack marquee positioned under the Hero Banner.
 * Duplicates one full strip seamlessly inside a translate3d loop so there is no gap or snap.
 */
const TechMarquee = memo(function TechMarquee({ onJumpToSkills }) {
  return (
    <section
      aria-label="Core Technologies"
      className="relative -mt-4 sm:-mt-6 pb-2"
    >
      <div className="liquid-glass-card rounded-2xl sm:rounded-3xl py-3.5 sm:py-4 overflow-hidden">
        <div className="px-4 sm:px-6 pb-2.5 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-neutral-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Core Tech Stack &amp; Tools
          </span>
          <a
            href="#skills"
            onClick={onJumpToSkills}
            className="text-[11px] sm:text-xs font-semibold text-amber-600 dark:text-amber-300 hover:underline whitespace-nowrap"
          >
            View All Skills →
          </a>
        </div>

        <div className="tech-marquee-mask relative overflow-hidden">
          <div className="tech-marquee-track flex items-center w-max">
            {[0, 1].map((copyIndex) => (
              <div
                key={copyIndex}
                aria-hidden={copyIndex === 1 ? "true" : undefined}
                className="flex items-center gap-3 sm:gap-4 pr-3 sm:pr-4 flex-shrink-0"
              >
                {MARQUEE_TECH_STACK.map((tech) => (
                  <MarqueeTechPill
                    key={`${copyIndex}-${tech.name}`}
                    tech={tech}
                    onJumpToSkills={onJumpToSkills}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default TechMarquee;
