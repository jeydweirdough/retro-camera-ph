"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { PhotoSlot } from "@/lib/home/content";
import { CameraShot } from "./camera-shot";
import { ChevronIcon } from "./ui";

/** Big floating hero camera with the thumbnail picker under it. Auto-advances until touched. */
export function HeroGallery({ photos }: { photos: PhotoSlot[] }) {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || photos.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % photos.length), 4500);
    return () => clearInterval(timer);
  }, [auto, photos.length]);

  const go = (next: number) => {
    setAuto(false);
    setIndex((next + photos.length) % photos.length);
  };

  return (
    <div className="flex flex-col items-center">
      <div data-parallax="0.08" className="relative -mt-28 w-full max-w-[340px] sm:-mt-36 lg:-mt-44">
        <div className="home-float">
          <CameraShot
            key={index}
            photo={photos[index]}
            priority={index === 0}
            sizes="(min-width: 1024px) 340px, 80vw"
            className="home-swap aspect-[4/3.4] w-full"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2" role="group" aria-label="Featured cameras">
        <button
          type="button"
          onClick={() => go(index - 1)}
          className="grid size-8 place-items-center text-white/70 transition hover:text-white"
        >
          <ChevronIcon className="size-4 rotate-180" />
          <span className="sr-only">Previous camera</span>
        </button>
        {photos.map((photo, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-pressed={i === index}
            className={cn(
              "relative grid size-14 place-items-center rounded-xl border bg-white/[0.03] p-2 transition-all duration-500",
              i === index ? "border-white/60 bg-white/10" : "border-white/15 hover:border-white/40",
            )}
          >
            <CameraShot photo={photo} sizes="56px" className="size-full" />
            <span className="sr-only">Show camera {i + 1}</span>
            {i === index && auto && (
              <span className="absolute inset-x-2 -bottom-2 h-0.5 overflow-hidden rounded bg-white/15">
                <span className="block h-full origin-left animate-[home-bar_4.5s_linear] bg-[#ee6a1c]" />
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => go(index + 1)}
          className="grid size-8 place-items-center text-white/70 transition hover:text-white"
        >
          <ChevronIcon className="size-4" />
          <span className="sr-only">Next camera</span>
        </button>
      </div>
    </div>
  );
}
