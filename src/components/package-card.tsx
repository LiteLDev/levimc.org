import { packagePath } from "../lib/packages";
import type { Package } from "../types";
import { Avatar } from "./avatar";
import { LocalDate } from "./local-date";
import { RouterLink } from "./router-link";

interface PackageCardProps {
  pkg: Package;
}

/**
 * A kit card (stepped frame, avatar in an inventory slot). The name is the
 * link; it covers the whole card, so the card is one click target while
 * screen readers still get a heading and a short link.
 */
export function PackageCard({ pkg }: Readonly<PackageCardProps>) {
  return (
    <article className="px-card kit-card pkg-card" data-interactive="">
      <div className="kit-card-icon kit-slot">
        <Avatar src={pkg.info.avatar_url} alt={pkg.info.name} size={32} />
      </div>
      <div className="kit-card-body">
        <h3 className="kit-card-title pkg-card-name">
          <RouterLink
            href={packagePath(pkg.tooth)}
            className="pkg-card-link"
            title={pkg.info.name}
          >
            {pkg.info.name}
          </RouterLink>
        </h3>
        <p className="kit-card-desc pkg-card-desc">{pkg.info.description}</p>
      </div>
      {pkg.info.tags.length > 0 && (
        <ul className="pkg-card-tags" aria-label="Tags">
          {pkg.info.tags.map((tag) => (
            <li key={tag} className="pkg-tag">
              {tag}
            </li>
          ))}
        </ul>
      )}
      <div className="kit-card-footer pkg-card-footer">
        {/* The kit's sprites as CSS backgrounds: 60 cards, one copy of each. */}
        <div className="pkg-card-stat" title="Stars">
          <span className="pkg-sprite pkg-sprite-diamond" aria-hidden="true" />
          <span>{pkg.stars}</span>
        </div>
        <div className="pkg-card-stat" title="Updated">
          <span className="pkg-sprite pkg-sprite-clock" aria-hidden="true" />
          <LocalDate value={pkg.updated} />
        </div>
        <div className="pkg-card-version">{pkg.versions.at(-1)}</div>
      </div>
    </article>
  );
}
