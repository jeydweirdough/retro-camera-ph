/** Endless scrolling band of words, alternating solid and outlined. */
export function Marquee({ words, dark }: { words: string[]; dark?: boolean }) {
  const row = [...words, ...words];
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden border-y py-4 ${dark ? "border-white/10 bg-[#1f160c] text-white" : "border-black/10 bg-transparent"}`}
    >
      <div className="home-marquee flex w-max gap-10 font-[family-name:var(--font-display)] text-[clamp(1.25rem,3vw,2rem)] font-black whitespace-nowrap uppercase">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex gap-10">
            {row.map((word, i) => (
              <span
                key={i}
                style={
                  i % 2
                    ? {
                        color: "transparent",
                        WebkitTextStroke: `1.25px ${dark ? "rgb(255 255 255 / 0.5)" : "rgb(31 22 12 / 0.4)"}`,
                      }
                    : undefined
                }
              >
                {word} <span className="text-[#ee6a1c]">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
