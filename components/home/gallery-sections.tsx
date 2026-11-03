import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CATEGORIES } from "@/lib/domain/categories";
import { homePhotos, storeFacts } from "@/lib/home/content";
import { site } from "@/lib/site";
import { CameraShot } from "./camera-shot";
import { ArrowIcon, PillLink, SplitHeading } from "./ui";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
const display = "font-[family-name:var(--font-display)] uppercase";
const card = "relative overflow-hidden rounded-2xl border border-black/10 bg-white";

/* ---------- Three intro cards ---------- */
export function IntroCards() {
  return (
    <section aria-label="Highlights" className="grid gap-4 sm:grid-cols-3">
      <Link
        href={`/shop/${CATEGORIES.camera.slug}`}
        data-reveal
        data-tilt
        className={`${card} group flex min-h-[220px] flex-col justify-end p-5`}
      >
        <span className="absolute top-4 right-4 z-10 grid size-9 place-items-center rounded-full bg-black text-white transition-transform duration-500 group-hover:rotate-45">
          <ArrowIcon className="size-4" />
        </span>
        <CameraShot
          photo={homePhotos.lensCard}
          sizes="(min-width: 640px) 30vw, 90vw"
          className="absolute -top-2 -left-6 h-[62%] w-[85%] transition-transform duration-[1200ms] group-hover:scale-110 group-hover:rotate-[-4deg]"
        />
        <p className="relative text-right text-xs leading-snug font-medium uppercase">
          Exploring {storeFacts.location.split(",")[0]}
          <br />
          through the lens
          <br />
          {homePhotos.lensCard.name}
        </p>
      </Link>

      <div className="flex flex-col gap-4">
        <div data-reveal style={d(120)} className={`${card} grid min-h-[100px] flex-1 place-items-center p-4`}>
          <div className="flex items-center gap-3">
            <Image src="/brand/logo-96.png" alt="" width={40} height={40} unoptimized className="rounded-lg" />
            <span className={`${display} text-sm font-black tracking-tight`}>
              Retro Camera <span className="text-[#f76c43]">PH</span>
            </span>
          </div>
        </div>
        <div data-reveal style={d(220)} className="relative flex min-h-[100px] flex-1 flex-col justify-between rounded-2xl bg-[#efede8] p-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-3">
              {homePhotos.cardMini.map((photo, i) => (
                <span key={i} className="grid size-10 place-items-center overflow-hidden rounded-full border-2 border-white bg-white p-1 shadow-sm">
                  <CameraShot photo={photo} sizes="40px" className="size-full" />
                </span>
              ))}
            </div>
            <span className="text-[9px] leading-tight uppercase">
              Graded &amp;
              <br />
              ready to shoot
            </span>
          </div>
          <p className={`${display} text-sm font-black`}>Precision</p>
        </div>
      </div>

      <div data-reveal style={d(320)} className={`${card} flex min-h-[220px] flex-col justify-between p-5`}>
        <p className={`${display} text-[clamp(1.1rem,1.8vw,1.4rem)] leading-tight font-black`}>
          Discover your <span className="text-black/30">next</span> favorite camera
        </p>
        <PillLink href="/shop">Order now</PillLink>
      </div>
    </section>
  );
}

/* ---------- OUR GALLERY ---------- */
export function GallerySection() {
  const [main, ...thumbs] = homePhotos.gallery;
  return (
    <section aria-labelledby="gallery-title" className="mt-20 sm:mt-28">
      <SplitHeading id="gallery-title" lines={["Our Gallery"]} className={`${display} text-[clamp(2.5rem,7vw,5.25rem)] leading-none font-black`} />
      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <p data-reveal style={d(150)} className="max-w-[46ch] text-xs leading-relaxed text-black/45 uppercase">
          Capturing moments, emotions, and stories has never been more immersive. Every click of the shutter opens up a
          world of possibilities.
        </p>
        <PillLink href={site.social.facebook} external>
          View all
        </PillLink>
      </div>

      <a
        href={site.social.facebook}
        target="_blank"
        rel="noopener"
        data-reveal="clip"
        className="group relative mt-8 block aspect-[16/9] overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_35%,#3a4652_0%,#1b2229_55%,#0c1014_100%)] sm:aspect-[16/8]"
      >
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
        <div data-parallax="0.06" className="absolute inset-[8%_12%]">
          <CameraShot
            photo={main}
            sizes="(min-width: 1024px) 900px, 90vw"
            className="size-full transition-transform duration-[1400ms] group-hover:scale-105"
            imageClassName="drop-shadow-[0_40px_40px_rgba(0,0,0,0.6)]"
          />
        </div>
        <span className="home-pulse absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-white text-black transition-transform duration-500 group-hover:scale-110">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-0.5 size-6" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <span className="sr-only">See the gallery on Facebook (opens in a new tab)</span>
        <span className="absolute bottom-5 left-6 font-mono text-[10px] tracking-[0.2em] text-white/60 uppercase">
          {main.name}
        </span>
      </a>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
        {thumbs.map((photo, i) => (
          <div
            key={photo.alt}
            data-reveal
            data-tilt
            style={d(i * 120)}
            className="group relative aspect-[1/0.95] overflow-hidden rounded-2xl bg-gradient-to-b from-[#e9eaed] to-white"
          >
            <CameraShot
              photo={photo}
              sizes="(min-width: 640px) 30vw, 33vw"
              className="absolute inset-[14%] transition-transform duration-[1000ms] group-hover:scale-110 group-hover:-rotate-3"
            />
            <span className="absolute inset-x-0 bottom-3 text-center font-mono text-[9px] tracking-widest text-black/40 uppercase opacity-0 transition group-hover:opacity-100">
              {photo.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- OUR FILTERS (shop categories) ---------- */
export function FiltersSection({ counts }: { counts: Record<string, number> }) {
  const categories = Object.values(CATEGORIES);
  return (
    <section aria-labelledby="filters-title" className="mt-20 grid gap-10 sm:mt-28 md:grid-cols-2">
      <div className="flex flex-col justify-between gap-8">
        <div>
          <SplitHeading
            id="filters-title"
            lines={["Our", "Filters"]}
            className={`${display} text-[clamp(2.5rem,6vw,4.25rem)] leading-[1.05] font-black`}
          />
          <p data-reveal style={d(150)} className="mt-4 max-w-[40ch] text-[10px] leading-relaxed text-black/45 uppercase">
            New and vintage gear for every kind of shooter. Whether you&apos;re a seasoned professional or an
            enthusiastic beginner, start with a category.
          </p>
        </div>
        <PillLink href="/shop">View all</PillLink>
      </div>
      <ul className="flex flex-col gap-3">
        {categories.map((category, i) => (
          <li key={category.slug} data-reveal="right" style={d(i * 100)}>
            <Link
              href={`/shop/${category.slug}`}
              className={`${display} group relative flex items-center justify-between overflow-hidden rounded-2xl px-5 py-4 text-sm tracking-wide transition-colors duration-500 hover:text-black ${i === 0 ? "bg-[#ecebe6] font-bold text-black" : "bg-[#f6f6f4] text-black/50"}`}
            >
              <span aria-hidden="true" className="absolute inset-0 origin-left scale-x-0 bg-[#ecebe6] transition-transform duration-500 group-hover:scale-x-100" />
              <span className="relative font-medium">{category.label}</span>
              <span className="relative font-mono text-[10px] normal-case opacity-0 transition group-hover:opacity-100">
                {counts[category.type] ?? 0} items →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- PHOTO OF THE DAY ---------- */
export function PhotoOfTheDaySection() {
  const [left, right] = homePhotos.photoOfDay;
  return (
    <section aria-labelledby="potd-title" className="mt-20 sm:mt-28">
      <h2 id="potd-title" className={`${display} text-[clamp(2.25rem,6.5vw,4.75rem)] leading-[1.05] font-black`}>
        <span data-slide="-0.15" className="block">
          <span data-reveal="left" className="block">
            Retro&apos;s photo
          </span>
        </span>
        <span data-slide="0.15" className="block text-right">
          <span data-reveal="right" className="block">
            of the day
          </span>
        </span>
      </h2>
      <p data-reveal className="-mt-10 max-w-[30ch] text-[10px] leading-relaxed font-medium uppercase max-sm:mt-4">
        Your vision, crystal clear. One camera from our shelves, picked for today.
      </p>

      <div className="mt-10 grid items-end gap-6 sm:grid-cols-2">
        <div data-parallax="-0.05" className="relative">
          <div data-reveal="zoom">
            <CameraShot photo={left} sizes="(min-width: 640px) 45vw, 90vw" className="home-float aspect-[4/3] w-full" />
          </div>
          <p className="mt-3 font-mono text-[10px] tracking-widest text-black/40 uppercase">{left.name}</p>
        </div>
        <div data-reveal="clip" style={d(200)} className="relative aspect-[4/3.4] overflow-hidden rounded-2xl bg-gradient-to-b from-[#e6e7ea] to-[#f7f7f8]">
          <div data-parallax="0.06" className="absolute inset-[12%]">
            <CameraShot photo={right} sizes="(min-width: 640px) 45vw, 90vw" className="size-full" />
          </div>
          <p className="absolute bottom-4 left-5 font-mono text-[10px] tracking-widest text-black/40 uppercase">
            {right.name}
          </p>
        </div>
      </div>
    </section>
  );
}
