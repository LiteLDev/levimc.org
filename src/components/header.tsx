import { Search } from "./search";
import { RouterLink } from "./router-link";

/** The site's own bar under the LeviMC bar: brand and search. Sticks to the top. */
export function Header() {
  return (
    <header className="pkg-header">
      <div className="pkg-header-inner">
        <RouterLink href="/" className="pkg-brand">
          <img
            src="/icon.png"
            alt="Bedrinth icon"
            width={22}
            height={22}
            className="pkg-brand-icon"
          />
          <span className="pkg-brand-name">bedrinth</span>
        </RouterLink>
        <div className="pkg-header-search">
          <Search variant="header" />
        </div>
      </div>
    </header>
  );
}
