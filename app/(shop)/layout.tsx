import { fontVariables } from "@/components/home/fonts";
import { HomeNav } from "@/components/home/home-nav";
import { Marquee } from "@/components/home/marquee";
import { ChevronIcon } from "@/components/home/ui";
import { SiteFooter } from "@/components/layout/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { cameras } from "@/lib/home/content";
import { storeJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";
import { CameraShot } from "@/components/home/camera-shot";
import "@/components/home/home.css";

/** The shop pages wear the home page's look: its nav, fonts and cream palette. */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fontVariables} home-root flex flex-1 flex-col bg-[#f6f2ea] text-[#1f160c]`}>
      <div className="mx-auto w-full max-w-[1240px] px-4 pt-5 sm:px-6">
        <HomeNav />
      </div>
      <main className="flex-1">{children}</main>

      <section aria-labelledby="shop-help-title" className="mx-auto mt-10 w-full max-w-[1240px] px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-[22px] bg-[#1f160c] px-6 py-12 text-white sm:px-12 sm:py-14">
          <div className="relative z-10 max-w-md">
            <p className="font-mono text-[10px] tracking-[0.18em] text-white/50 uppercase">• Can&apos;t find it?</p>
            <h2 id="shop-help-title" className="mt-3 text-[clamp(2rem,4vw,3.25rem)] leading-[1] font-normal tracking-[-0.04em]">
              Ask us about any camera
            </h2>
            <p className="mt-4 max-w-[38ch] text-sm text-white/60">
              New stock lands on our Facebook page first. Message us and we&apos;ll tell you what&apos;s on the shelf.
            </p>
            <a
              href={site.social.facebook}
              target="_blank"
              rel="noopener"
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[#ee6a1c] px-6 py-3 text-sm text-white transition-all hover:gap-3 hover:bg-[#ff7a26]"
            >
              Message us on Facebook
              <ChevronIcon className="size-3.5" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          <div className="absolute -right-8 -bottom-12 w-[min(55%,400px)] max-sm:opacity-30">
            <CameraShot photo={cameras.ricoh} sizes="400px" className="home-float aspect-square w-full" />
          </div>
        </div>
      </section>

      <Marquee dark words={["New & Vintage", "Condition Graded", "Pay by QR", "Las Piñas", "Ready to Shoot"]} />
      <SiteFooter />
      <JsonLd data={storeJsonLd()} />
    </div>
  );
}
