import type { ReactNode } from "react";

interface CompactHeroProps {
  name: string;
  tagline: string;
  children?: ReactNode;
}

/**
 * The kit's painted hero as a compact strip (≤ 112 px), so results start
 * above the fold. The painting is a cached file per theme (`/hero-light.svg`,
 * `/hero-dark.svg`, see server/hero.ts) on the right, dissolving into the
 * page in the kit's pixel blocks (the same edge as every painted hero).
 */
export function CompactHero({ name, tagline, children }: CompactHeroProps) {
  return (
    <section className="kit-hero kit-hero-strip pkg-hero" data-kit-hero="">
      <div className="kit-hero-paint kit-dissolve-bottom" aria-hidden="true">
        <div className="kit-hero-art kit-dissolve-left pkg-hero-art" />
        <div className="kit-hero-brush kit-dissolve-left" />
      </div>
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
    </section>
  );
}
