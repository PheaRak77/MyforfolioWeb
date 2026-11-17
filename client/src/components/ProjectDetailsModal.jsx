import { useCallback, useEffect, useState } from "react";
import PortfolioImage from "./PortfolioImage";
import { getProjectValidImages } from "../utils/projectImages";

/**
 * Interactive project showcase modal with one-by-one image gallery,
 * full-fit preview (object-contain), clickable thumbnails, keyboard navigation,
 * and a fullscreen lightbox for effortless inspection.
 */
export default function ProjectDetailsModal({ project, onClose }) {
  const images = project ? getProjectValidImages(project) : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const total = images.length;
  const safeIndex = total > 0 ? Math.min(activeIndex, total - 1) : 0;
  const currentImage = images[safeIndex] || null;

  const goPrev = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  // Reset to first image whenever a different project is opened
  useEffect(() => {
    setActiveIndex(0);
    setIsFullscreen(false);
  }, [project?.id]);

  // Keyboard navigation: Left/Right arrows + Escape
  useEffect(() => {
    if (!project) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "ArrowRight") {
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [project, isFullscreen, goPrev, goNext, onClose]);

  if (!project) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-md"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="liquid-glass-modal rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-8 space-y-6 relative"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close project details"
            className="liquid-glass-pill absolute top-4 right-4 z-20 p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:scale-105 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Interactive Image Gallery */}
          {total > 0 && (
            <div className="space-y-3 pt-1">
              {/* Main Full-Fit Stage */}
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center h-64 sm:h-96">
                <PortfolioImage
                  src={currentImage}
                  alt={`${project.title} - photo ${safeIndex + 1}`}
                  variant="default"
                  priority
                  onClick={() => setIsFullscreen(true)}
                  className="w-full h-full object-contain cursor-zoom-in select-none transition-transform duration-300"
                />

                {/* Photo Counter */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md text-white text-xs font-semibold tracking-wide">
                  {safeIndex + 1} / {total}
                </div>

                {/* Fullscreen Expand Button */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  title="View full screen"
                  className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-lg bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                    />
                  </svg>
                  <span>Full View</span>
                </button>

                {/* Prev / Next Controls */}
                {total > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                      }}
                      aria-label="Previous photo"
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition-all shadow-lg hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                      }}
                      aria-label="Next photo"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition-all shadow-lg hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Clickable Thumbnail Strip (all photos, one by one) */}
              {total > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5">
                  {images.map((imgUrl, idx) => {
                    const isActive = idx === safeIndex;
                    return (
                      <button
                        key={`${imgUrl}-${idx}`}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        aria-label={`View photo ${idx + 1}`}
                        className={`relative flex-shrink-0 w-20 h-16 sm:w-24 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          isActive
                            ? "border-blue-500 ring-2 ring-blue-500/40 scale-[1.03]"
                            : "border-slate-200 dark:border-slate-800 opacity-65 hover:opacity-100 hover:border-slate-400 dark:hover:border-slate-600"
                        }`}
                      >
                        <PortfolioImage
                          src={imgUrl}
                          alt={`${project.title} thumbnail ${idx + 1}`}
                          variant="project"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Project Title & Description */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {project.title}
              </h3>
              {project.is_featured && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                  Featured
                </span>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 whitespace-pre-line leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Tech Stack */}
          {project.tech_stack && project.tech_stack.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Technologies Used
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-medium border border-slate-200 dark:border-slate-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          {project.links && project.links.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-3">
                Links & Live Demos
              </h4>
              <div className="flex flex-wrap gap-3">
                {project.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-md shadow-blue-500/20"
                  >
                    <span>{link.label}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox Overlay — fits full picture cleanly */}
      {isFullscreen && currentImage && (
        <div
          onClick={() => setIsFullscreen(false)}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-3 sm:p-6"
        >
          {/* Top Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl flex items-center justify-between text-white mb-3 px-1"
          >
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold">
                {safeIndex + 1} / {total}
              </span>
              <span className="text-sm font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-md">
                {project.title}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              aria-label="Exit fullscreen"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Full-Fit Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex-1 w-full max-w-6xl flex items-center justify-center min-h-0"
          >
            <PortfolioImage
              src={currentImage}
              alt={`${project.title} - full view ${safeIndex + 1}`}
              variant="certificate-modal"
              priority
              className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-lg shadow-2xl select-none"
            />

            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous photo"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-all shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next photo"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-all shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnail Dots / Strip in Fullscreen */}
          {total > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-4 flex gap-2 overflow-x-auto max-w-full px-2 py-1"
            >
              {images.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl}-fs-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`View photo ${idx + 1}`}
                  className={`flex-shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${
                    idx === safeIndex
                      ? "border-blue-400 scale-105 opacity-100"
                      : "border-white/20 opacity-50 hover:opacity-90"
                  }`}
                >
                  <PortfolioImage
                    src={imgUrl}
                    alt=""
                    variant="project"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

