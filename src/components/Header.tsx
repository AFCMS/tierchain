import { HeaderAuth } from "./HeaderAuth";

export function Header() {
  return (
    <header className="navbar bg-base-100">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">TierChain</a>
      </div>
      <HeaderAuth />
    </header>
  );
}
