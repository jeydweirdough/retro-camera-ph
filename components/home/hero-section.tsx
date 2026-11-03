import Link from "next/link";
import type { CSSProperties } from "react";
import { CATEGORIES } from "@/lib/domain/categories";
import { heroReview, homePhotos, storeFacts } from "@/lib/home/content";
import { site } from "@/lib/site";
import { CameraShot } from "./camera-shot";
import { HeroGallery } from "./hero-gallery";
import { HomeNav } from "./home-nav";
import { ChevronIcon, OrangeButton, SplitHeading } from "./ui";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 2.5 14.9 9l7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.6 9.1 9z" />
    </svg>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 2c.6 5.2 4.8 9.4 10 10-5.2.6-9.4 4.8-10 10-.6-5.2-4.8-9.4-10-10C7.2 11.4 11.4 7.2 12 2z" />
    </svg>
  );
}

/* ---------- Hero: nav, gradient title, dark showcase card ---------- */
export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="pt-5">
      <HomeNav />

      <h1
        id="hero-title"
        className="home-gradient-text mt-6 font-[family-name:var(--font-grotesk)] text-[clamp(3rem,10.4vw,9.25rem)] leading-[0.95] font-medium tracking-[-0.045em]"
      >
        <span data-reveal className="block" style={d(100)}>
          Retro Camera PH
        </span>
      </h1>

      <div data-reveal className="mt-4 flex justify-between font-mono text-xs" style={d(250)}>
        <span>(01)</span>
        <span>{storeFacts.location}</span>
        <span>(PH)</span>
      </div>

      <div
        data-reveal="clip"
        style={d(300)}
        className="home-scan relative mt-28 flex flex-col rounded-[4px] bg-[#1f160c] px-6 pt-10 pb-8 text-white sm:mt-36 sm:px-8 lg:mt-40 lg:grid lg:grid-cols-[1fr_1.1fr_1fr] lg:gap-6 lg:pt-12"
      >
        <div className="relative z-10 flex flex-col justify-between gap-8 lg:pb-14">
          <p data-reveal style={d(600)} className="max-w-[16ch] text-[clamp(1.75rem,2.6vw,2.25rem)] leading-[1.08] font-light tracking-tight">
            New &amp; vintage cameras, ready to shoot
          </p>
          <div data-reveal style={d(750)} className="flex items-center gap-4">
            <OrangeButton href="/shop">Start Shopping</OrangeButton>
            <Link
              href={site.social.facebook}
              target="_blank"
              rel="noopener"
              className="home-pulse grid size-11 place-items-center rounded-full border border-white/50 transition hover:bg-white hover:text-black"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-0.5 size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="sr-only">See our latest posts on Facebook (opens in a new tab)</span>
            </Link>
          </div>
        </div>

        <div className="order-first mb-8 lg:order-none lg:mb-0">
          <HeroGallery photos={homePhotos.hero} />
        </div>

        <div className="relative z-10 mt-10 flex flex-col justify-between gap-8 lg:mt-0">
          <div data-reveal="right" style={d(700)} className="max-w-[260px]">
            {heroReview ? (
              <>
                <div className="flex gap-1 text-[#f7c934]" role="img" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="size-4" />
                  ))}
                </div>
                <blockquote className="mt-3 text-xs leading-relaxed text-white/75">
                  “{heroReview.quote}”
                  <footer className="mt-2 text-white/50">— {heroReview.author}</footer>
                </blockquote>
              </>
            ) : (
              <>
                <div className="flex gap-1 text-[#f7c934]" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Sparkle key={i} className="size-3.5" />
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-white/75">{storeFacts.promise}</p>
              </>
            )}
          </div>
          <div
            data-reveal="right"
            style={d(850)}
            className="flex min-h-[190px] flex-col justify-between border border-white/20 p-6 lg:ml-auto lg:w-[86%]"
          >
            <p className="max-w-[18ch] text-sm leading-snug">Every used item comes with a condition grade</p>
            <Link
              href={`/shop/${CATEGORIES.camera.slug}`}
              className="group inline-flex items-center gap-1.5 text-xs text-[#ee6a1c] hover:text-[#ff8a3c]"
            >
              Read More
              <ChevronIcon className="size-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Who We are ---------- */
export function WhoWeAreSection() {
  return (
    <section aria-labelledby="who-title" className="relative mt-24 sm:mt-32">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.55fr]">
        <SplitHeading
          id="who-title"
          lines={["Who", "We are"]}
          className="text-[clamp(3.25rem,6.5vw,5.75rem)] leading-[0.95] font-normal tracking-[-0.04em]"
        />
        <div className="relative flex items-start gap-6">
          <p data-reveal style={d(150)} className="max-w-[46ch] text-[clamp(1rem,1.35vw,1.2rem)] leading-relaxed text-black/60">
            We believe every camera still has stories to tell. Retro Camera PH brings new and vintage cameras, film
            cameras, lenses and accessories to photographers across the Philippines, each one checked, graded and ready
            to shoot.
          </p>
          <svg viewBox="0 0 100 100" aria-hidden="true" className="home-spin hidden size-24 shrink-0 text-black/15 md:block">
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" />
            <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      <div className="relative mt-10 grid lg:grid-cols-[1fr_1.55fr] lg:gap-8">
        <div className="relative hidden h-full lg:block">
          <div data-parallax="-0.06" className="absolute bottom-0 left-0">
            <div data-reveal="left" className="relative size-36">
              <div className="absolute inset-0 rotate-[-35deg] overflow-hidden rounded-full">
                <div className="h-1/2 w-full translate-y-full bg-[#f2731c]" />
              </div>
              <div className="absolute -top-3 left-12 grid size-12 place-items-center rounded-full bg-[#efebe3] shadow-sm">
                <Sparkle className="size-4 home-spin" />
              </div>
            </div>
          </div>
        </div>
        <div className="relative pb-8">
          <div data-reveal="clip" className="absolute inset-x-0 bottom-0 h-[72%] rounded-[4px] bg-[#f7c934]" />
          <div data-parallax="0.08" className="relative mx-auto w-[min(72%,480px)]">
            <div data-reveal="zoom" style={d(200)}>
              <CameraShot photo={homePhotos.whoWeAre} sizes="480px" className="aspect-[1.42] w-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Our Product → Details ---------- */
export function ProductDetailsSection() {
  const [big, lens, wide] = homePhotos.details;
  return (
    <section aria-labelledby="details-title" className="mt-28 sm:mt-36">
      <h2 id="details-title" className="text-[clamp(2.5rem,5vw,4.25rem)] leading-[1] font-normal tracking-[-0.04em]">
        <span data-reveal="left" className="block">
          Our Product
        </span>
        <span className="mt-2 flex items-center justify-end gap-4 sm:gap-6">
          <span data-reveal="left" style={d(150)} className="flex h-[0.8em] w-[clamp(7rem,20vw,16rem)] items-center rounded-full bg-[#f7c934] pr-4">
            <span className="h-px flex-1 bg-black" />
            <ChevronIcon className="-ml-2 size-6" />
          </span>
          <span data-reveal="right" style={d(150)}>
            Details
          </span>
        </span>
      </h2>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/shop/${CATEGORIES.camera.slug}`}
          data-reveal="clip"
          data-tilt
          className="group relative row-span-2 min-h-[320px] overflow-hidden rounded-[4px] bg-[#ebe7df] sm:min-h-[460px]"
        >
          <CameraShot
            photo={big}
            sizes="(min-width: 640px) 50vw, 100vw"
            className="absolute inset-y-6 -left-[18%] w-[118%] transition-transform duration-[1200ms] group-hover:scale-105"
          />
          <span className="absolute bottom-5 left-5 rounded-full bg-white/80 px-3 py-1 text-xs backdrop-blur">
            {big.name}
          </span>
        </Link>
        <Link
          href={`/shop/${CATEGORIES.lens.slug}`}
          data-reveal="clip"
          data-tilt
          style={d(150)}
          className="group relative flex min-h-[220px] overflow-hidden rounded-[4px] bg-[#ebe7df] p-5"
        >
          <div className="relative z-10 flex flex-col gap-3">
            <span className="text-sm">Film Lens</span>
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white px-4 py-2 text-[10px] transition group-hover:bg-black group-hover:text-white">
              Learn More <ChevronIcon className="size-3" />
            </span>
          </div>
          <CameraShot
            photo={lens}
            sizes="(min-width: 640px) 25vw, 60vw"
            className="absolute top-4 -right-6 bottom-4 w-[62%] transition-transform duration-[1200ms] group-hover:scale-110 group-hover:-rotate-3"
          />
        </Link>
        <Link
          href={`/shop/${CATEGORIES.accessory.slug}`}
          data-reveal="clip"
          data-tilt
          style={d(300)}
          className="group relative min-h-[220px] overflow-hidden rounded-[4px] bg-[#ebe7df]"
        >
          <CameraShot
            photo={wide}
            sizes="(min-width: 640px) 50vw, 100vw"
            className="absolute inset-6 transition-transform duration-[1200ms] group-hover:scale-105"
          />
          <span className="absolute bottom-4 left-4 rounded-full bg-white/80 px-3 py-1 text-xs backdrop-blur">
            {wide.name}
          </span>
        </Link>
      </div>
    </section>
  );
}

/* ---------- Designed for creatives + accordion ---------- */
const FEATURES = [
  {
    title: "Condition You Can Trust",
    body: "Every used item comes with a condition grade, so you know exactly what you're getting before you pay.",
    href: `/shop/${CATEGORIES.camera.slug}`,
  },
  {
    title: "Kits That Save",
    body: "Camera kits that cost less than buying each item separately.",
    href: `/shop/${CATEGORIES.bundle.slug}`,
  },
  {
    title: "Easy QR Payment",
    body: "Pay easily by QR code at checkout. Prices are in Philippine pesos (₱).",
    href: "/shop",
  },
];

export function CreativesSection() {
  return (
    <section aria-labelledby="creatives-title" className="mt-28 sm:mt-36">
      <SplitHeading
        id="creatives-title"
        lines={["Designed for creatives,", "a lens to the world"]}
        className="text-[clamp(2.25rem,5.4vw,4.75rem)] leading-[1.02] font-normal tracking-[-0.04em]"
      />
      <hr data-reveal className="mt-8 border-black/15" />

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_1fr]">
        <div className="relative min-h-[360px] overflow-hidden">
          <span
            data-slide="0.25"
            aria-hidden="true"
            className="home-outline pointer-events-none absolute bottom-0 left-0 font-[family-name:var(--font-display)] text-[clamp(5rem,12vw,10rem)] leading-none font-black whitespace-nowrap"
          >
            retro retro
          </span>
          <div data-reveal="clip" className="absolute top-[14%] right-[6%] bottom-[10%] left-[34%] rounded-[4px] bg-[#f7c934]" />
          <div data-parallax="0.08" className="relative mr-auto ml-[4%] w-[min(78%,400px)] pt-10">
            <div data-reveal="zoom" style={d(200)}>
              <CameraShot photo={homePhotos.creatives} sizes="380px" className="aspect-square w-full" />
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          {FEATURES.map((feature, index) => (
            <details
              key={feature.title}
              name="home-features"
              open={index === 0}
              data-reveal="right"
              style={d(index * 120)}
              className="home-accordion group border-b border-black/15 py-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg">
                {feature.title}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#1f160c] text-white transition-transform duration-500 group-open:rotate-180">
                  <ChevronIcon className="size-3.5 rotate-90" />
                </span>
              </summary>
              <div className="flex items-end justify-between gap-6 pt-3">
                <div>
                  <p className="max-w-[40ch] text-sm leading-relaxed text-black/55">{feature.body}</p>
                  <Link
                    href={feature.href}
                    className="mt-4 inline-flex items-center gap-1 rounded-full bg-[#ee6a1c] px-5 py-2 text-xs text-white transition hover:bg-[#ff7a26]"
                  >
                    Learn More <ChevronIcon className="size-3" />
                  </Link>
                </div>
                <div className="hidden size-20 shrink-0 rounded-[4px] bg-[#1f160c] p-2 sm:block">
                  <CameraShot photo={homePhotos.details[index % 3]} sizes="80px" className="size-full" />
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Follow (stands in for the mockup's newsletter, which the store doesn't have) ---------- */
export function FollowSection() {
  return (
    <section aria-labelledby="follow-title" className="mt-28 sm:mt-36">
      <div data-reveal="clip" className="relative overflow-hidden rounded-[4px] bg-[#ebe7df] px-6 py-12 sm:px-12 sm:py-16">
        <div className="relative z-10 max-w-md">
          <div className="flex items-start gap-4">
            <h2 id="follow-title" className="text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1] font-normal tracking-[-0.04em]">
              Follow our new arrivals
            </h2>
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white">
              <Sparkle className="home-spin size-4" />
            </span>
          </div>
          <p className="mt-4 max-w-[38ch] text-sm text-black/55">
            Fresh stock lands on our Facebook page first. Follow along and message us about any camera.
          </p>
          <a
            href={site.social.facebook}
            target="_blank"
            rel="noopener"
            className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[#1f160c] px-6 py-3 text-sm text-white transition-all hover:gap-3 hover:bg-[#ee6a1c]"
          >
            Follow on Facebook
            <ChevronIcon className="size-3.5" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        <div data-parallax="0.12" className="absolute -right-10 -bottom-10 w-[min(55%,420px)] max-sm:opacity-40">
          <CameraShot photo={homePhotos.follow} sizes="420px" className="home-float aspect-square w-full" />
        </div>
      </div>
    </section>
  );
}
