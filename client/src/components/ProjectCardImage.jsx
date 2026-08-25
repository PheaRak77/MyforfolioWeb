import PortfolioImage from "./PortfolioImage";

/**
 * Project card thumbnail — eager load + absolute fill so images show on the grid
 * (lazy loading inside scroll-reveal cards often never fires in Safari/Brave).
 */
export default function ProjectCardImage({ src, alt, fallback, priority = false }) {
  return (
    <PortfolioImage
      src={src}
      alt={alt}
      variant="project"
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      sizes="(max-width: 767px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      fallback={
        fallback || (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500 p-4">
            <svg
              className="w-10 h-10 mb-2 opacity-50 text-blue-400"
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
            <span className="text-xs uppercase tracking-wider font-semibold text-center">
              {alt}
            </span>
          </div>
        )
      }
    />
  );
}
