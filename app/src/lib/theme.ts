import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const THEME_KEY = "marint.theme";

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

let listeners: Array<(t: Theme) => void> = [];
let currentTheme: Theme = typeof document !== "undefined" ? readStoredTheme() : "light";

function setTheme(theme: Theme) {
  currentTheme = theme;
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage unavailable — theme choice simply won't persist across reloads
  }
  listeners.forEach((l) => l(theme));
}

/** App-wide light/dark theme, persisted to localStorage. Light is the
 * default operational theme; the homepage locks itself to dark separately
 * (see Home.tsx) regardless of this setting. */
export function useTheme(): [Theme, () => void] {
  const [theme, setLocalTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    listeners.push(setLocalTheme);
    return () => {
      listeners = listeners.filter((l) => l !== setLocalTheme);
    };
  }, []);

  function toggle() {
    setTheme(currentTheme === "light" ? "dark" : "light");
  }

  return [theme, toggle];
}
