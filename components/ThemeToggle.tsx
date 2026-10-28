"use client";

import Icon from "./Icon";

export default function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.classList.add("theme-anim");
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* private mode: the choice just won't persist */ }
    setTimeout(() => root.classList.remove("theme-anim"), 400);
  };
  return (
    <button onClick={toggle} className="btn-ghost !w-8 !px-0" aria-label="Switch between light and dark theme" title="Light / dark">
      <Icon name="moon" className="theme-moon size-4" />
      <Icon name="sun" className="theme-sun size-4" />
    </button>
  );
}
