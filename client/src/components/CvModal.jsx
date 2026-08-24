import { useEffect } from "react";
import cvDocumentImg from "../assets/cv_document.png";

export default function CvModal({ isOpen, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 lg:p-8 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cv-modal-title"
    >
      {/* Floating Top Action Bar (Sticky at top of screen for easy download & close) */}
      <div className="sticky top-2 sm:top-4 z-30 mb-4 sm:mb-6 w-full max-w-4xl flex items-center justify-between gap-3 px-4 sm:px-6 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 flex-shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h2
              id="cv-modal-title"
              className="text-sm sm:text-base font-bold text-white leading-tight flex items-center gap-2"
            >
              <span>Yorn Pheareak — Curriculum Vitae</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official
              </span>
            </h2>
            <p className="text-xs text-slate-400 hidden sm:block">
              Full-Stack Developer
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/Yorn_Pheareak_CV.pdf"
            download="Yorn_Pheareak_CV.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Download CV</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shadow-sm"
            aria-label="Close CV Modal"
            title="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Full-Size CV Document Sheet */}
      <div className="w-full max-w-4xl mb-8 flex justify-center">
        <div className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/80 overflow-hidden border border-slate-700/80 ring-1 ring-white/10">
          <img
            src={cvDocumentImg}
            alt="Yorn Pheareak Official CV"
            className="w-full h-auto object-contain block select-none"
            loading="eager"
          />
        </div>
      </div>

      {/* Floating Bottom Quick Download Bar */}
      <div className="sticky bottom-4 z-30 flex items-center justify-center gap-3">
        <a
          href="/Yorn_Pheareak_CV.pdf"
          download="Yorn_Pheareak_CV.pdf"
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-2xl shadow-blue-500/40 border border-white/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>Download CV (PDF)</span>
        </a>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 shadow-xl backdrop-blur-xl transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}
