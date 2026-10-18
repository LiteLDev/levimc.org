import type { ReactNode } from "react";

interface CompactHeroProps {
  name: string;
  tagline: string;
  children?: ReactNode;
}

/**
 * The kit's painted hero as a compact strip (≤ 112 px), so results start
 * above the fold. The painting is a cached file per theme (`/hero-light.svg`,
 * `/hero-dark.svg`, see server/hero.ts) behind the kit's brush, scrim and
 * grass horizon.
 */
export function CompactHero({ name, tagline, children }: CompactHeroProps) {
  return (
    <section className="kit-hero pkg-hero" data-kit-hero="">
      <div className="kit-hero-art pkg-hero-art" aria-hidden="true" />
      <div className="kit-hero-brush" aria-hidden="true" />
      <div className="kit-hero-scrim" aria-hidden="true" />
      <div className="kit-hero-inner">
        <div className="kit-hero-copy">
          <div className="kit-hero-badge">
            <span className="kit-item-frame kit-hero-icon">
              <img src="/icon.png" alt="" width={48} height={48} />
            </span>
          </div>
          <h1 className="kit-hero-title">
            <span className="kit-hero-name">{name}</span>
          </h1>
          <p className="kit-hero-tagline">{tagline}</p>
          {children}
        </div>
      </div>
      <div className="grass-divider kit-hero-horizon" aria-hidden="true" />
    </section>
  );
}
