import { createContext, useCallback, useContext, useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";

const ThemeContext = createContext();
const STORAGE_KEY = "portfolio_theme";

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

  useLayoutEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const commitTheme = (nextTheme) => {
    applyThemeToDocument(nextTheme);
    flushSync(() => {
      setThemeState(nextTheme);
    });
  };

  const toggleTheme = useCallback(
    (event) => {
      const nextTheme = theme === "dark" ? "light" : "dark";

      const canViewTransition =
        typeof document !== "undefined" &&
        "startViewTransition" in document &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!canViewTransition) {
        document.documentElement.classList.add("theme-transitioning");
        commitTheme(nextTheme);
        window.setTimeout(() => {
          document.documentElement.classList.remove("theme-transitioning");
        }, 520);
        return;
      }

      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? window.innerHeight / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const expandClip = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.classList.add("theme-vt-active");

      const transition = document.startViewTransition(() => {
        commitTheme(nextTheme);
      });

      const cleanup = () => {
        document.documentElement.classList.remove("theme-vt-active");
      };

      transition.ready
        .then(() => {
          document.documentElement.animate(
            { clipPath: expandClip },
            {
              duration: 560,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        .catch(() => {});

      transition.finished.then(cleanup).catch(cleanup);
    },
    [theme]
  );

  const setTheme = (newTheme, event) => {
    if (newTheme !== "dark" && newTheme !== "light") return;
    if (newTheme === theme) return;
    toggleTheme(event);
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
