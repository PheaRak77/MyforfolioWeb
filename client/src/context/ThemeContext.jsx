import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem("portfolio_theme");
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    } catch {
      // ignore
    }
    // Default to dark mode for portfolio
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
    try {
      localStorage.setItem("portfolio_theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    document.documentElement.classList.add("theme-transitioning");
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
    }, 300);
  };

  const setTheme = (newTheme) => {
    if (newTheme === "dark" || newTheme === "light") {
      document.documentElement.classList.add("theme-transitioning");
      setThemeState(newTheme);
      setTimeout(() => {
        document.documentElement.classList.remove("theme-transitioning");
      }, 300);
    }
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
