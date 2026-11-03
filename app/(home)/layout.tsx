import { Inter_Tight, Orbitron } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { storeJsonLd } from "@/lib/seo";
import "@/components/home/home.css";

const display = Orbitron({ variable: "--font-display", subsets: ["latin"], weight: ["500", "700", "900"] });
const grotesk = Inter_Tight({ variable: "--font-grotesk", subsets: ["latin"], weight: ["300", "400", "500", "800"] });

/**
 * The home page has its own layout: the hero brings its own navigation bar,
 * so the shared store header is left out here. Every other page keeps (store)/layout.tsx.
 */
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${grotesk.variable} flex flex-1 flex-col`}>
      {children}
      <SiteFooter />
      <JsonLd data={storeJsonLd()} />
    </div>
  );
}
