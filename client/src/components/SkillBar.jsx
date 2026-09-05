import { memo, useState } from "react";
import { getSkillIconUrl } from "../utils/skillIcons";

/**
 * Single skill card with proficiency bar. Memoised so that unrelated page state
 * (contact form typing, modal opens) does not re-render the whole skills grid.
 */
const SkillBar = memo(function SkillBar({ skill, index, isRevealed }) {
  const [iconError, setIconError] = useState(false);
  const iconUrl = !iconError ? getSkillIconUrl(skill.name, skill.icon) : null;
  const isSimpleIcon = Boolean(iconUrl && iconUrl.includes("simple-icons"));

  return (
    <div
      className="portfolio-scroll-card portfolio-reveal-item p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] hover:border-amber-400/60 dark:hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 group flex flex-col justify-between hover:-translate-y-1"
      style={{
        opacity: isRevealed ? 1 : 0,
        transform: isRevealed ? "none" : "translateY(32px) scale(0.95)",
        transitionProperty: "opacity, transform",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        transitionDuration: "600ms",
        transitionDelay: `${Math.min(index * 70, 420)}ms`,
      }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-500/10 dark:bg-white/10 border border-amber-500/20 dark:border-white/10 p-1.5 sm:p-2 flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 group-hover:border-amber-400/60 transition-all duration-300">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt={skill.name}
                className={`w-full h-full max-w-[24px] max-h-[24px] sm:max-w-[28px] sm:max-h-[28px] object-contain ${
                  isSimpleIcon ? "dark:invert dark:brightness-200" : ""
                }`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setIconError(true)}
              />
            ) : (
              <span className="text-amber-500 font-bold text-xs sm:text-sm select-none">
                {skill.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 truncate max-w-full">
                {skill.category}
              </span>
              {skill.is_featured && (
                <span className="text-[9px] sm:text-[10px] font-bold px-1 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 flex-shrink-0">
                  ★
                </span>
              )}
            </div>
            <h3 className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm mt-0.5 group-hover:text-amber-500 dark:group-hover:text-amber-300 transition-colors truncate">
              {skill.name}
            </h3>
          </div>
        </div>
      </div>

      <div className="mt-2 sm:mt-3 pt-2.5 sm:pt-3 border-t border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1.5">
          <span className="text-neutral-500 dark:text-neutral-400 font-medium">
            Proficiency
          </span>
          <span className="font-extrabold text-amber-500 dark:text-yellow-300 font-mono">
            {skill.percentage || 80}%
          </span>
        </div>
        <div className="w-full h-1.5 sm:h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
            style={{
              width: isRevealed ? `${skill.percentage || 80}%` : "0%",
            }}
          />
        </div>
      </div>
    </div>
  );
});

export default SkillBar;
