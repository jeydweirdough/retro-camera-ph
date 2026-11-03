"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface MenuLink {
  href: string;
  label: string;
}

/** "Menu" pill that opens a panel with the shop links. */
export function HomeMenu({ links }: { links: MenuLink[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="home-menu-panel"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 items-center gap-2 rounded-full border border-black/15 px-4 text-xs transition-colors hover:bg-black hover:text-white"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h10M4 17h16" />}
        </svg>
        Menu
      </button>
      <nav
        id="home-menu-panel"
        aria-label="Main"
        hidden={!open}
        className="absolute top-12 left-0 z-50 w-64 origin-top-left animate-[home-swap_400ms_cubic-bezier(0.2,0.8,0.1,1)] rounded-2xl border border-black/10 bg-[#fbf8f2]/95 p-2 shadow-2xl backdrop-blur-xl"
      >
        <ul>
          {links.map((link, index) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-colors hover:bg-black hover:text-white"
              >
                {link.label}
                <span className="font-mono text-[10px] opacity-50">0{index + 1}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
