"use client";

import { useEffect } from "react";

/**
 * Drives the home page motion from one place:
 * - [data-reveal] elements get `.is-in` when they scroll into view
 * - [data-parallax="0.15"] moves vertically with scroll (sets --py)
 * - [data-slide="0.2"] moves horizontally with scroll (sets --px)
 * - [data-tilt] leans toward the pointer (sets --rx / --ry)
 * - the root gets --progress (0–1) for the scroll progress bar
 * Everything is skipped when the visitor prefers reduced motion.
 */
export function HomeMotion({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    const reveals = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      reveals.forEach((el) => el.classList.add("is-in"));
      return;
    }

    root.classList.add("motion-on");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      // Threshold 0: clip reveals start as a thin strip, so a percentage threshold may never be reached.
      { rootMargin: "0px 0px -6% 0px", threshold: 0 },
    );
    const viewportBottom = window.innerHeight;
    reveals.forEach((el) => {
      // Already on screen at load: reveal straight away instead of waiting for an observer tick.
      if (el.getBoundingClientRect().top < viewportBottom) el.classList.add("is-in");
      else observer.observe(el);
    });

    const parallax = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));
    const slides = Array.from(root.querySelectorAll<HTMLElement>("[data-slide]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      root.style.setProperty("--progress", String(max > 0 ? window.scrollY / max : 0));
      for (const el of parallax) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) continue;
        const offset = rect.top + rect.height / 2 - vh / 2;
        el.style.setProperty("--py", `${(-offset * Number(el.dataset.parallax)).toFixed(1)}px`);
      }
      for (const el of slides) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) continue;
        const offset = rect.top + rect.height / 2 - vh / 2;
        el.style.setProperty("--px", `${(offset * Number(el.dataset.slide)).toFixed(1)}px`);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const tilts = finePointer ? Array.from(root.querySelectorAll<HTMLElement>("[data-tilt]")) : [];
    const onMove = (event: PointerEvent) => {
      const el = event.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
    };
    const onLeave = (event: PointerEvent) => {
      const el = event.currentTarget as HTMLElement;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    tilts.forEach((el) => {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      tilts.forEach((el) => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      });
    };
  }, [rootId]);

  return null;
}
