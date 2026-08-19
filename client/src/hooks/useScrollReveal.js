import { useEffect, useRef, useState } from "react";

const observerRegistry = new Map();

function getObserverKey(threshold, rootMargin) {
  return `${threshold}|${rootMargin}`;
}

function getSharedObserver(threshold, rootMargin) {
  const key = getObserverKey(threshold, rootMargin);

  if (!observerRegistry.has(key)) {
    const callbacks = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cb = callbacks.get(entry.target);
          if (cb) cb(entry);
        });
      },
      { threshold, rootMargin },
    );
    observerRegistry.set(key, { observer, callbacks });
  }

  return observerRegistry.get(key);
}

/**
 * useScrollReveal - Intersection Observer hook for scroll-triggered animations.
 * Uses a shared observer per threshold/rootMargin pair to reduce overhead.
 */
const useScrollReveal = ({
  threshold = 0.12,
  rootMargin = "-40px",
  once = true,
} = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { observer, callbacks } = getSharedObserver(threshold, rootMargin);

    const handleIntersect = (entry) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (once) {
          callbacks.delete(el);
          observer.unobserve(el);
        }
      } else if (!once) {
        setIsVisible(false);
      }
    };

    callbacks.set(el, handleIntersect);
    observer.observe(el);

    return () => {
      callbacks.delete(el);
      observer.unobserve(el);
    };
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
};

export default useScrollReveal;
