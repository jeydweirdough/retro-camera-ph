import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo";

/** Visible breadcrumb trail plus matching BreadcrumbList data, from one list. */
export function Breadcrumbs({ crumbs, className }: { crumbs: Crumb[]; className?: string }) {
  const all = [{ name: "Home", href: "/" }, ...crumbs];
  // A custom className sets its own colors; the default trail follows light/dark mode.
  const current = className ? "text-[#1f160c]" : "text-zinc-900 dark:text-zinc-100";
  const hover = className ? "hover:text-[#1f160c]" : "hover:text-zinc-900 dark:hover:text-zinc-100";

  return (
    <nav aria-label="Breadcrumb" className={className ?? "text-sm text-zinc-500"}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((crumb, index) => {
          const isLast = index === all.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className={current}>
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link href={crumb.href} className={hover}>
                    {crumb.name}
                  </Link>
                  <span aria-hidden="true">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
      <JsonLd data={breadcrumbJsonLd(all)} />
    </nav>
  );
}
