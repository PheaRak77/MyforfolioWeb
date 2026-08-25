import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from "react";

const ThemeContext = createContext();
const STORAGE_KEY = "portfolio_theme";
const THEME_FADE_MS = 560;

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

  useLayoutEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const commitTheme = (nextTheme) => {
    applyThemeToDocument(nextTheme);
    setThemeState(nextTheme);
  };

  const changeTheme = useCallback((nextTheme, trigger) => {
    if (nextTheme === theme) return;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Start the reveal at the control the visitor clicked. It also works for
    // the Settings-row toggle, not only the icon in the navigation.
    if (trigger?.currentTarget) {
      const { left, top, width, height } = trigger.currentTarget.getBoundingClientRect();
      root.style.setProperty("--theme-reveal-x", `${left + width / 2}px`);
      root.style.setProperty("--theme-reveal-y", `${top + height / 2}px`);
    }

    if (reduceMotion) {
      commitTheme(nextTheme);
      return;
    }

    window.clearTimeout(cleanupTimer.current);
    root.classList.add("theme-transitioning");
    root.classList.toggle("theme-to-light", nextTheme === "light");
    root.classList.toggle("theme-to-dark", nextTheme === "dark");
    root.classList.add("theme-veil-active");

    const applyChange = () => commitTheme(nextTheme);
    // View Transitions gives supported browsers a polished radial day/night
    // reveal. The existing CSS colour fade remains the fallback everywhere else.
    if (typeof document.startViewTransition === "function") {
      document.startViewTransition(applyChange);
    } else {
      applyChange();
    }

    cleanupTimer.current = window.setTimeout(() => {
      root.classList.remove(
        "theme-transitioning",
        "theme-veil-active",
        "theme-to-light",
        "theme-to-dark"
      );
    }, THEME_FADE_MS);
  }, [theme]);

  const toggleTheme = useCallback(
    (trigger) => changeTheme(theme === "dark" ? "light" : "dark", trigger),
    [changeTheme, theme]
  );

  const setTheme = (newTheme) => {
    if (newTheme !== "dark" && newTheme !== "light") return;
    changeTheme(newTheme);
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
