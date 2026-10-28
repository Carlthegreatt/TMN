"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

export default function Nav({ links, onNavigate }: { links: string[][]; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {links.map(([href, label, icon]) => {
        const active = href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex h-8 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
              active ? "bg-active font-medium text-ink" : "text-muted hover:bg-active/60 hover:text-ink"
            }`}
          >
            <Icon name={icon} className="size-[1.1rem]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
