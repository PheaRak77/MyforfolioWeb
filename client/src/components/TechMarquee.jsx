import { memo, useState } from "react";
import { getSkillIconUrl } from "../utils/skillIcons";

const LOGO_LOOP_ITEMS = [
  { name: "Express.js", lookup: "express" },
  { name: "Node.js", lookup: "node" },
  { name: "JavaScript", lookup: "javascript" },
  { name: "React", lookup: "react" },
  { name: "Tailwind CSS", lookup: "tailwindcss" },
  { name: "Bootstrap", lookup: "bootstrap" },
  { name: "PostgreSQL", lookup: "postgresql" },
  { name: "Git", lookup: "git" },
  { name: "GitHub", lookup: "github" },
  { name: "HTML5", lookup: "html5" },
  { name: "CSS3", lookup: "css3" },
  { name: "Python", lookup: "python" },
  { name: "Vite", lookup: "vite" },
  { name: "Docker", lookup: "docker" },
];

// Double inside each half so even 4K ultra-wide screens have zero empty gap
const HALF_TRACK_ITEMS = [...LOGO_LOOP_ITEMS, ...LOGO_LOOP_ITEMS];

const LogoLoopItem = memo(function LogoLoopItem({ tech, onJumpToSkills }) {
  const [failed, setFailed] = useState(false);
  const iconUrl = !failed ? getSkillIconUrl(tech.lookup) : null;

  return (
    <a
      href="#skills"
      onClick={onJumpToSkills}
      title={tech.name}
      aria-label={tech.name}
      className="group inline-flex items-center justify-center flex-shrink-0 p-1.5 sm:p-2 rounded-xl opacity-75 hover:opacity-100 transition-all duration-300 hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={tech.name}
          className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 object-contain dark:invert dark:brightness-200 select-none pointer-events-none"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-sm sm:text-base font-black tracking-tight text-slate-800 dark:text-white select-none">
          {tech.name}
        </span>
      )}
    </a>
  );
});

/**
 * Full-screen-width seamless Logo Loop (inspired by ReactBits Logo Loop).
 * Runs purely on the GPU compositor with zero JS frame timers and pauses on hover.
 */
const TechMarquee = memo(function TechMarquee({ onJumpToSkills }) {
  return (
    <section
      aria-label="Technologies & Frameworks"
      className="logo-loop-section relative w-screen left-1/2 -translate-x-1/2 -mt-4 sm:-mt-6 py-4 sm:py-6 overflow-hidden"
    >
      <div className="logo-loop-mask relative overflow-hidden">
        <div className="logo-loop-track flex items-center w-max">
          {[0, 1].map((copyIndex) => (
            <div
              key={copyIndex}
              aria-hidden={copyIndex === 1 ? "true" : undefined}
              className="flex items-center gap-12 sm:gap-16 lg:gap-24 pr-12 sm:pr-16 lg:pr-24 flex-shrink-0"
            >
              {HALF_TRACK_ITEMS.map((tech, idx) => (
                <LogoLoopItem
                  key={`${copyIndex}-${idx}-${tech.name}`}
                  tech={tech}
                  onJumpToSkills={onJumpToSkills}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default TechMarquee;
