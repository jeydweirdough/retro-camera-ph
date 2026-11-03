import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { loadCatalog } from "@/lib/data/catalog";
import { CATEGORIES } from "@/lib/domain/categories";
import type { ProductType } from "@/lib/domain/dto";
import { storeFacts } from "@/lib/home/content";
import type { Crumb } from "@/lib/seo";

const mono = "font-mono uppercase";

export interface ShopHeaderProps {
  title: string;
  intro: string;
  crumbs: Crumb[];
  /** The category being shown; none on /shop. */
  active?: ProductType;
}

/** Big title, store line and category tabs, shared by /shop and each category. */
export async function ShopHeader({ title, intro, crumbs, active }: ShopHeaderProps) {
  const catalog = await loadCatalog();
  const tabs = [
    { href: "/shop", label: "All", count: catalog.size, current: !active },
    ...Object.values(CATEGORIES).map((category) => ({
      href: `/shop/${category.slug}`,
      label: category.label,
      count: catalog.ofType(category.type).length,
      current: active === category.type,
    })),
  ];
  const shown = tabs.find((tab) => tab.current)?.count ?? 0;

  return (
    <header className="mx-auto w-full max-w-[1240px] px-4 pt-8 sm:px-6 sm:pt-10">
      <Breadcrumbs crumbs={crumbs} className={`${mono} text-[10px] tracking-[0.18em] text-black/45`} />

      <div className="mt-8 grid items-end gap-8 lg:grid-cols-[1.4fr_1fr]">
        <h1 className="shop-rise home-gradient-text font-[family-name:var(--font-grotesk)] text-[clamp(3rem,9vw,8rem)] leading-[0.92] font-medium tracking-[-0.045em]">
          {title}
        </h1>
        <div className="shop-rise flex items-end justify-between gap-6 lg:pb-4" style={{ "--i": 2 } as React.CSSProperties}>
          <p className="max-w-[36ch] text-sm leading-relaxed text-black/60 sm:text-base">{intro}</p>
          <svg viewBox="0 0 100 100" aria-hidden="true" className="home-spin hidden size-20 shrink-0 text-black/15 sm:block">
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" />
            <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      <div className={`${mono} mt-6 flex justify-between gap-4 border-b border-black/10 pb-5 text-[10px] tracking-[0.14em]`}>
        <span>(02)</span>
        <span>
          {shown} {shown === 1 ? "piece" : "pieces"} · {storeFacts.location}
        </span>
        <span>(PH)</span>
      </div>

      <nav aria-label="Categories" className="mt-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-2">
          {tabs.map((tab) => (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={tab.current ? "page" : undefined}
                className={`group flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm transition-colors duration-300 ${
                  tab.current
                    ? "border-[#1f160c] bg-[#1f160c] text-white"
                    : "border-black/15 hover:border-[#1f160c] hover:bg-[#1f160c] hover:text-white"
                }`}
              >
                {tab.label}
                <span
                  className={`grid min-w-6 place-items-center rounded-full px-1.5 font-mono text-[10px] leading-5 tabular-nums ${
                    tab.current ? "bg-[#ee6a1c] text-white" : "bg-black/5 group-hover:bg-white/15"
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
