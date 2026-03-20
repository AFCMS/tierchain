import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "theme";
const DARK_THEME = "dark";
const LIGHT_THEME = "light";

function getInitialTheme(): boolean {
  const storedTheme = localStorage.getItem(STORAGE_KEY);
  if (storedTheme === DARK_THEME) return true;
  if (storedTheme === LIGHT_THEME) return false;

  // Fallback to system preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(dark: boolean) {
  const htmlElement = document.documentElement;
  if (dark) {
    htmlElement.setAttribute("data-theme", DARK_THEME);
  } else {
    htmlElement.removeAttribute("data-theme");
  }
}

export function ThemeSwitcher() {
  const [isDark, setIsDark] = useState(getInitialTheme);

  // Apply theme to DOM whenever isDark changes
  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const handleThemeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIsDark = e.target.checked;
    setIsDark(newIsDark);

    // Persist to localStorage
    const theme = newIsDark ? DARK_THEME : LIGHT_THEME;
    localStorage.setItem(STORAGE_KEY, theme);
  };

  return (
    <label className="swap swap-rotate">
      <input
        type="checkbox"
        value={DARK_THEME}
        className="theme-controller"
        checked={isDark}
        onChange={handleThemeToggle}
        aria-label="Toggle dark mode"
      />
      <Sun aria-label="Sun" className="swap-on" />
      <Moon aria-label="Moon" className="swap-off" />
    </label>
  );
}
