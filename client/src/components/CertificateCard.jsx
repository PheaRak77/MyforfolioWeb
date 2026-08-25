import { memo } from "react";
import PortfolioImage from "./PortfolioImage";
import { formatDisplayDate } from "../utils/formatDate";

const CertificateFallback = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-slate-800 dark:to-indigo-950 text-purple-500 dark:text-purple-400 p-4 text-center">
    <svg
      className="w-12 h-12 mb-2 opacity-60"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"
      />
    </svg>
    <span className="text-xs uppercase tracking-wider font-bold text-slate-600 dark:text-slate-300">
      Certificate
    </span>
  </div>
);

/**
 * Single certificate card. Memoised so the certificates grid is not rebuilt by
 * unrelated page state.
 */
const CertificateCard = memo(function CertificateCard({
  cert,
  index,
  isRevealed,
  onSelect,
}) {
  const select = () => onSelect(cert);

  return (
    <div
      className="portfolio-scroll-card portfolio-reveal-item rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1.5"
      style={{
        opacity: isRevealed ? 1 : 0,
        transform: isRevealed ? "none" : "translateY(40px)",
        transitionProperty: "opacity, transform",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        transitionDuration: "650ms",
        transitionDelay: `${Math.min(index * 100, 500)}ms`,
      }}
    >
      {/* Certificate Image Preview */}
      <div
        onClick={select}
        className="relative w-full h-48 bg-slate-100 dark:bg-slate-950 overflow-hidden cursor-pointer"
      >
        {cert.image ? (
          <PortfolioImage
            src={cert.image}
            alt={cert.course}
            variant="certificate"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            fallback={<CertificateFallback />}
          />
        ) : (
          <CertificateFallback />
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-4 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
              />
            </svg>
            Click to Zoom
          </span>
        </div>
      </div>

      {/* Certificate Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3
            onClick={select}
            className="text-lg font-extrabold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
          >
            {cert.course}
          </h3>

          {cert.instructor && (
            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1.5">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Instructor / Org: {cert.instructor}</span>
            </p>
          )}

          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 line-clamp-3 leading-relaxed">
            {cert.description || "Course certificate completed."}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          {cert.issued_on ? (
            <span>Issued: {formatDisplayDate(cert.issued_on)}</span>
          ) : (
            <span>Verified Credential</span>
          )}

          <button
            onClick={select}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-500 font-bold"
          >
            View Full &rarr;
          </button>
        </div>
      </div>
    </div>
  );
});

export default CertificateCard;
