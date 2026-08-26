import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from "react";

const ThemeContext = createContext();
const STORAGE_KEY = "portfolio_theme";
const DESKTOP_THEME_FADE_MS = 380;
const COMPACT_THEME_FADE_MS = 260;

function readStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // ignore
  }
  return "dark";
}

function applyThemeToDocument(theme) {
  const root = document.documentElement;
  const isDark = theme === "dark";
  root.classList.toggle("dark", isDark);
  root.classList.toggle("light", !isDark);
  root.style.colorScheme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", isDark ? "#070b14" : "#fafafa");
  }

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(readStoredTheme);
  const cleanupTimer = useRef();
  const lastSwitchTimeRef = useRef(0);

  useLayoutEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const commitTheme = (nextTheme) => {
    applyThemeToDocument(nextTheme);
    setThemeState(nextTheme);
  };

  const changeTheme = useCallback((nextTheme, event) => {
    if (nextTheme === theme) return;

    // Rate-limit fast spamming to prevent rapid click state collisions during scrolling
    const now = Date.now();
    if (now - lastSwitchTimeRef.current < 200) return;
    lastSwitchTimeRef.current = now;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile =
      window.innerWidth < 768 ||
      window.matchMedia("(pointer: coarse)").matches ||
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (reduceMotion) {
      commitTheme(nextTheme);
      return;
    }

    // On mobile smartphones / touch devices: Use lightweight, 100% glitch-free CSS color transition.
    // This avoids mobile WebKit snapshot tile artifacts (black box glitch) during fast scrolling.
    if (isMobile) {
      window.clearTimeout(cleanupTimer.current);
      root.classList.add("theme-transitioning");
      commitTheme(nextTheme);

      cleanupTimer.current = window.setTimeout(() => {
        root.classList.remove("theme-transitioning");
      }, COMPACT_THEME_FADE_MS);
      return;
    }

    // On Desktop: Use modern View Transition API with circular ripple bloom from cursor
    if (typeof document.startViewTransition === "function") {
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;

      if (event) {
        if (typeof event.clientX === "number" && (event.clientX !== 0 || event.clientY !== 0)) {
          x = event.clientX;
          y = event.clientY;
        } else if (event.currentTarget && typeof event.currentTarget.getBoundingClientRect === "function") {
          const rect = event.currentTarget.getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }
      }

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const transition = document.startViewTransition(() => {
        commitTheme(nextTheme);
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];

        document.documentElement.animate(
          {
            clipPath: clipPath,
          },
          {
            duration: 420,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      }).catch(() => {
        commitTheme(nextTheme);
      });
      return;
    }

    // Hardware-accelerated fallback for older desktop browsers
    const transitionDuration = DESKTOP_THEME_FADE_MS;

    window.clearTimeout(cleanupTimer.current);
    root.classList.add("theme-transitioning");
    commitTheme(nextTheme);

    cleanupTimer.current = window.setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, transitionDuration);
  }, [theme]);

  const toggleTheme = useCallback(
    (event) => changeTheme(theme === "dark" ? "light" : "dark", event),
    [changeTheme, theme]
  );

  const setTheme = (newTheme, event) => {
    if (newTheme !== "dark" && newTheme !== "light") return;
    changeTheme(newTheme, event);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
