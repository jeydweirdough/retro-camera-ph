import { fontVariables } from "@/components/home/fonts";
import { SiteFooter } from "@/components/layout/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { storeJsonLd } from "@/lib/seo";
import "@/components/home/home.css";

/**
 * The home page has its own layout: the hero brings its own navigation bar,
 * so the shared store header is left out here. The shop pages share its look via (shop)/layout.tsx.
 */
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fontVariables} flex flex-1 flex-col`}>
      {children}
      <SiteFooter />
      <JsonLd data={storeJsonLd()} />
    </div>
  );
}
