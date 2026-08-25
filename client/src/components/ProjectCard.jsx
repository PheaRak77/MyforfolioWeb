import { memo } from "react";
import ProjectCardImage from "./ProjectCardImage";
import {
  getProjectMainImage,
  getProjectValidImages,
} from "../utils/projectImages";

/**
 * Single project card. Memoised, and it derives its own image list so that work
 * is scoped to this card rather than re-running for every project on each page
 * render.
 */
const ProjectCard = memo(function ProjectCard({
  project,
  index,
  isRevealed,
  onSelect,
}) {
  const mainImage = getProjectMainImage(project);
  const validImages = getProjectValidImages(project);
  const select = () => onSelect(project);

  return (
    <div className="portfolio-scroll-card group rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1.5">
      {/* Project Image Preview — no opacity animation (fixes lazy-load black box) */}
      <div
        onClick={select}
        className="relative w-full h-52 min-h-[13rem] bg-slate-100 dark:bg-slate-950 overflow-hidden cursor-pointer"
      >
        {mainImage ? (
          <ProjectCardImage src={mainImage} alt={project.title} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400 dark:text-slate-500 p-4">
            <svg
              className="w-10 h-10 mb-2 opacity-50 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs uppercase tracking-wider font-semibold">
              {project.title}
            </span>
          </div>
        )}

        {project.is_featured && (
          <span className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 backdrop-blur-md text-white text-[11px] font-extrabold shadow-lg shadow-blue-500/30">
            ★ Featured
          </span>
        )}

        {validImages.length > 1 && (
          <span className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-slate-200 text-[10px] font-bold">
            +{validImages.length - 1} photos
          </span>
        )}
      </div>

      {/* Project Content — scroll reveal animation */}
      <div
        className="portfolio-reveal-item p-6 flex-1 flex flex-col justify-between space-y-4"
        style={{
          opacity: isRevealed ? 1 : 0,
          transform: isRevealed ? "none" : "translateY(24px)",
          transitionProperty: "opacity, transform",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          transitionDuration: "650ms",
          transitionDelay: `${Math.min(index * 100, 500)}ms`,
        }}
      >
        <div>
          <h3
            onClick={select}
            className="text-xl font-extrabold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
          >
            {project.title}
          </h3>

          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 line-clamp-3 leading-relaxed">
            {project.description || "No project description provided."}
          </p>
        </div>

        {/* Tech Stack Pills */}
        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {project.tech_stack.map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-300 text-xs font-semibold"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Project Links (Read-Only) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-3">
            {project.links && project.links.length > 0 ? (
              project.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-cyan-400 hover:text-blue-500 transition-colors"
                >
                  <span>{link.label}</span>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              ))
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                No external links
              </span>
            )}
          </div>

          <button
            onClick={select}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Details &rarr;
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProjectCard;
