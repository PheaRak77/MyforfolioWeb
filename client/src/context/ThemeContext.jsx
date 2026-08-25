import { createContext, useCallback, useContext, useLayoutEffect, useState } from "react";

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

  useLayoutEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const commitTheme = (nextTheme) => {
    applyThemeToDocument(nextTheme);
    setThemeState(nextTheme);
  };

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      commitTheme(nextTheme);
      return;
    }

    root.classList.add("theme-transitioning");
    root.classList.toggle("theme-to-light", nextTheme === "light");
    root.classList.toggle("theme-to-dark", nextTheme === "dark");
    root.classList.add("theme-veil-active");

    commitTheme(nextTheme);

    window.setTimeout(() => {
      root.classList.remove(
        "theme-transitioning",
        "theme-veil-active",
        "theme-to-light",
        "theme-to-dark"
      );
    }, THEME_FADE_MS);
  }, [theme]);

  const setTheme = (newTheme) => {
    if (newTheme !== "dark" && newTheme !== "light") return;
    if (newTheme === theme) return;
    toggleTheme();
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
