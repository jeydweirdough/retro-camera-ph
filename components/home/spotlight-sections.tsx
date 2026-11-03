import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CATEGORIES } from "@/lib/domain/categories";
import { homePhotos, storeFacts, type PhotoSlot } from "@/lib/home/content";
import { CameraShot } from "./camera-shot";
import { SplitHeading } from "./ui";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
const mono = "font-mono uppercase";
const heavy = "font-[family-name:var(--font-grotesk)] font-extrabold tracking-[-0.06em] [word-spacing:0.12em]";

/** Real store facts, laid out like the mockup's spec sheet. */
const SPECS = [
  ["Location", storeFacts.location],
  ["Stock", "New & vintage"],
  ["Condition", "Graded on every used item"],
  ["Payment", "QR code"],
  ["Currency", "Philippine peso (₱)"],
] as const;

/* ---------- Big orange title + dark spec panel ---------- */
export function SpotlightSection() {
  const [main, ...thumbs] = homePhotos.spotlight;
  return (
    <section aria-labelledby="spotlight-title" className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-[22px] bg-white px-6 pt-8 pb-28 sm:px-10 sm:pb-40">
        <h2
          id="spotlight-title"
          data-reveal
          className={`${heavy} text-center text-[clamp(2.75rem,9.6vw,7.5rem)] leading-[0.9] text-[#ff5a0a] uppercase`}
        >
          Shoot it on film
        </h2>
        <div className={`${mono} mt-10 flex justify-between gap-8 text-[10px] leading-relaxed text-black/60`}>
          <p data-reveal="left" className="max-w-[34ch]">
            Discover a curated collection of new and vintage cameras, lenses and accessories.
          </p>
          <p data-reveal="right" className="hidden max-w-[34ch] text-right sm:block">
            Every used camera is checked and graded, so you know its condition before you buy.
          </p>
        </div>
      </div>

      <div className="home-scan relative -mt-2 rounded-[22px] bg-[#2a2626] px-6 py-8 text-white sm:px-8 lg:min-h-[420px]">
        <div data-parallax="0.1" className="pointer-events-none relative z-10 mx-auto -mt-32 w-[min(78%,460px)] sm:-mt-44 lg:absolute lg:top-0 lg:left-1/2 lg:mt-0 lg:-translate-x-1/2 lg:-translate-y-[38%]">
          <div data-reveal="zoom" style={d(150)}>
            <CameraShot photo={main} sizes="460px" className="home-float aspect-[4/3] w-full" imageClassName="drop-shadow-[0_40px_50px_rgba(0,0,0,0.55)]" />
          </div>
        </div>

        <div className="relative z-10 mt-8 flex flex-col gap-8 lg:mt-0 lg:flex-row lg:justify-between">
          <div data-reveal="left" className={`${mono} max-w-[300px]`}>
            <p className="text-lg tracking-wide">Store spec:</p>
            <p className="mt-3 text-[9px] leading-relaxed text-white/55">
              Crafted for those who appreciate the feel of a real shutter. Featured here: the {main.name}.
            </p>
            <ul className="mt-5 flex flex-col gap-2.5 text-[10px]">
              {SPECS.map(([label, value]) => (
                <li key={label} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>
                    {label}: <span className="text-white/60">{value}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/shop"
              className="mt-10 inline-block rounded-full bg-[#ff5a0a] px-5 py-2 text-[10px] transition hover:bg-white hover:text-black"
            >
              Shop now
            </Link>
          </div>

          <ul className="flex gap-3 lg:flex-col">
            {thumbs.map((photo, i) => (
              <li
                key={photo.alt}
                data-reveal="right"
                data-tilt
                style={d(200 + i * 120)}
                className="relative size-20 overflow-hidden rounded-xl border border-white/25 bg-white/5 p-2 sm:size-24"
              >
                <CameraShot photo={photo} sizes="96px" className="size-full" />
                <span className="sr-only">{photo.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- 01 / 02 / 03 ---------- */
const PILLARS = [
  ["Condition graded", "Every used item is checked and graded, so there are no surprises when it arrives."],
  ["Film & digital", "Point-and-shoots, SLRs, rangefinders and toy cameras, plus lenses that fit them."],
  ["Kits that save", "Camera kits that cost less than buying each item separately."],
] as const;

export function PillarsSection() {
  return (
    <section aria-labelledby="pillars-title" className="mt-2 rounded-[22px] bg-white px-6 py-10 sm:px-10 sm:py-12">
      <div className="grid gap-6 md:grid-cols-2">
        <p data-reveal className={`${mono} text-[9px]`}>
          • Featured
        </p>
        <SplitHeading
          id="pillars-title"
          lines={["Built for Every", "Frame & Moment"]}
          className={`${heavy} text-[clamp(2rem,4.2vw,3.25rem)] leading-[0.95] text-[#1f1f1f]`}
        />
      </div>
      <div className="mt-14 grid gap-10 sm:grid-cols-3">
        {PILLARS.map(([title, body], i) => (
          <div key={title} data-reveal style={d(i * 140)}>
            <p className={`${heavy} text-5xl text-[#ff5a0a]`}>0{i + 1}</p>
            <p className={`${mono} mt-5 text-[11px] tracking-wide`}>{title}</p>
            <p className={`${mono} mt-2 text-[9px] leading-relaxed text-black/50`}>{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Designed to be noticed (collections) ---------- */
export interface CollectionItem {
  href: string;
  name: string;
  /** Product photo from the catalog; falls back to a store cut-out. */
  imageUrl?: string;
  photo: PhotoSlot;
}

export function CollectionsSection({ items }: { items: CollectionItem[] }) {
  return (
    <section aria-labelledby="collections-title" className="mt-2 overflow-hidden rounded-[22px] bg-white px-6 pt-10 pb-12 sm:px-10">
      <p data-reveal className={`${mono} text-center text-[9px]`}>
        • Collections
      </p>
      <SplitHeading
        id="collections-title"
        lines={["Designed", "to Be Noticed."]}
        className={`${heavy} mt-3 text-center text-[clamp(2.25rem,4.6vw,3.5rem)] leading-[0.92] text-[#1f1f1f]`}
      />
      <ul className="mt-12 grid grid-cols-3 items-end gap-3 sm:gap-8">
        {items.map((item, i) => {
          const center = i === 1;
          return (
            <li key={item.href + i} data-reveal={center ? "zoom" : i === 0 ? "left" : "right"} style={d(center ? 0 : 200)}>
              <Link href={item.href} className="group block text-center">
                <div
                  data-tilt
                  className={`relative mx-auto aspect-square transition-all duration-700 ${center ? "w-full" : "w-[80%] opacity-70 grayscale-[60%] group-hover:opacity-100 group-hover:grayscale-0"}`}
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(min-width: 640px) 30vw, 33vw"
                      className="object-contain transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <CameraShot
                      photo={item.photo}
                      sizes="(min-width: 640px) 30vw, 33vw"
                      className="size-full transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                </div>
                <span className={`${mono} mt-3 block text-[9px] tracking-wide text-black/50 group-hover:text-black`}>
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-10 text-center">
        <Link
          href={`/shop/${CATEGORIES.camera.slug}`}
          className={`${mono} inline-block rounded-full bg-black px-6 py-2.5 text-[10px] text-white transition hover:bg-[#ff5a0a]`}
        >
          See all cameras
        </Link>
      </div>
    </section>
  );
}
