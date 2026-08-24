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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cv-modal-title"
    >
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] my-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 bg-slate-950/95 border-b border-slate-800 backdrop-blur-md z-20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
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
                className="text-base sm:text-lg font-bold text-white leading-tight flex items-center gap-2"
              >
                <span>Yorn Pheareak — Curriculum Vitae</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Full-Stack
                </span>
              </h2>
            </div>
          </div>

          {/* Quick Actions (Download PDF + Close) */}
          <div className="flex items-center gap-2.5">
            <a
              href="/Yorn_Pheareak_CV.pdf"
              download="Yorn_Pheareak_CV.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition-colors"
              aria-label="Close CV Modal"
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

        {/* Full-Size Clean CV Viewport */}
        <div className="overflow-y-auto p-2 sm:p-5 lg:p-6 bg-slate-950 flex justify-center">
          <div className="w-full max-w-3xl rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-700/70 bg-white">
            <img
              src={cvDocumentImg}
              alt="Yorn Pheareak Official CV"
              className="w-full h-auto object-contain block"
              loading="eager"
            />
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950/95 border-t border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400 flex-shrink-0">
          <span className="text-slate-300 font-medium hidden sm:inline">
            Official CV • Yorn Pheareak (Full-Stack Developer)
          </span>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <a
              href="/Yorn_Pheareak_CV.pdf"
              download="Yorn_Pheareak_CV.pdf"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-center text-xs transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2"
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
              <span>Download CV (PDF)</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
