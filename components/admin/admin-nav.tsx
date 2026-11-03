import Link from "next/link";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin", label: "Payments" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/costs", label: "Costs" },
];

export function AdminNav({ current }: { current: string }) {
  return (
    <nav aria-label="Admin" className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.href === current ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
            link.href === current
              ? "border-brand-600 text-zinc-900 dark:text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
