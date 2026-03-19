import { HeaderAuth } from "./HeaderAuth";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Header() {
  return (
    <header className="navbar bg-base-100 gap-2">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">TierChain</a>
      </div>
      <ThemeSwitcher />
      <HeaderAuth />
    </header>
  );
}
