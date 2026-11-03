import Image from "next/image";
import { cn } from "@/lib/cn";
import type { CameraTone, PhotoSlot } from "@/lib/home/content";

const TONES: Record<CameraTone, { body: string; shade: string; accent: string; stripe: string }> = {
  ivory: { body: "#f4f1ea", shade: "#d9d3c7", accent: "#e2452b", stripe: "#e2452b" },
  sunny: { body: "#f3efe6", shade: "#d6cfbf", accent: "#f2c230", stripe: "#f2c230" },
  tangerine: { body: "#f6a13a", shade: "#d9772a", accent: "#2b2b2b", stripe: "#f5efe4" },
  mint: { body: "#9fd6cf", shade: "#72b3ab", accent: "#f06b3f", stripe: "#f4efe4" },
  graphite: { body: "#55575b", shade: "#35373a", accent: "#e2452b", stripe: "#8a8d92" },
  silver: { body: "#e3e5e8", shade: "#b9bdc3", accent: "#f06b3f", stripe: "#3a3c40" },
};

/** Drawn retro camera, used until a real cut-out photo fills the slot. */
export function PlaceholderCamera({ tone, className }: { tone: CameraTone; className?: string }) {
  const c = TONES[tone];
  const id = `cam-${tone}`;
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true" className={cn("h-full w-full", className)}>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.body} />
          <stop offset="1" stopColor={c.shade} />
        </linearGradient>
        <radialGradient id={`${id}-glass`} cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#6b7a8f" />
          <stop offset="0.35" stopColor="#1d2430" />
          <stop offset="1" stopColor="#05070a" />
        </radialGradient>
        <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f4f4" />
          <stop offset="0.5" stopColor="#9a9da3" />
          <stop offset="1" stopColor="#3b3d41" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="282" rx="150" ry="12" fill="#000" opacity="0.18" />
      <rect x="120" y="38" width="120" height="44" rx="12" fill={`url(#${id}-body)`} />
      <rect x="140" y="48" width="44" height="24" rx="6" fill="#1b1e24" />
      <rect x="146" y="53" width="18" height="10" rx="3" fill="#7d8ea6" opacity="0.7" />
      <rect x="258" y="50" width="38" height="18" rx="6" fill={c.accent} />
      <rect x="62" y="70" width="276" height="196" rx="34" fill={`url(#${id}-body)`} />
      <rect x="62" y="196" width="276" height="20" fill={c.stripe} opacity="0.9" />
      <rect x="84" y="92" width="54" height="34" rx="8" fill="#20242b" />
      <rect x="90" y="98" width="20" height="12" rx="3" fill="#9fb3cc" opacity="0.6" />
      <circle cx="304" cy="104" r="12" fill={c.accent} />
      <circle cx="210" cy="164" r="78" fill={`url(#${id}-ring)`} />
      <circle cx="210" cy="164" r="64" fill="#15181d" />
      <circle cx="210" cy="164" r="52" fill={`url(#${id}-glass)`} />
      <circle cx="210" cy="164" r="26" fill="#020305" />
      <ellipse cx="190" cy="142" rx="16" ry="9" fill="#fff" opacity="0.35" transform="rotate(-30 190 142)" />
      <circle cx="232" cy="186" r="5" fill="#fff" opacity="0.15" />
    </svg>
  );
}

export interface CameraShotProps {
  photo: PhotoSlot;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Classes for the inner image or placeholder, e.g. extra padding. */
  imageClassName?: string;
}

/** A cut-out camera photo, or the drawn placeholder while the slot is empty. */
export function CameraShot({ photo, sizes, priority, className, imageClassName }: CameraShotProps) {
  return (
    <div className={cn("relative", className)}>
      {photo.src ? (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized
          className={cn("object-contain drop-shadow-[0_30px_35px_rgba(0,0,0,0.28)]", imageClassName)}
        />
      ) : (
        <PlaceholderCamera tone={photo.tone} className={imageClassName} />
      )}
    </div>
  );
}
