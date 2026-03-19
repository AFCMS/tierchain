import { Moon, Sun } from "lucide-react";

export function ThemeSwitcher() {
  return (
    <label className="swap swap-rotate">
      <input type="checkbox" value="dark" className="theme-controller" />
      <Sun aria-label="Sun" className="swap-on" />
      <Moon aria-label="Moon" className="swap-off" />
    </label>
  );
}
