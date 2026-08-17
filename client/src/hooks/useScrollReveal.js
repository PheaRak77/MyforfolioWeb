import { useEffect, useRef, useState } from "react";

/**
 * useScrollReveal - Intersection Observer hook for scroll-triggered animations.
 *
 * @param {Object} options
 * @param {number} options.threshold  - 0–1, how much of element must be visible (default 0.12)
 * @param {string} options.rootMargin - CSS root margin (default "-40px")
 * @param {boolean} options.once      - Only animate once (default true)
 * @returns {{ ref, isVisible }}
 */
const useScrollReveal = ({
  threshold = 0.12,
  rootMargin = "-40px",
  once = true,
} = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    const el = ref.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
};

export default useScrollReveal;
