import { useSearchParams } from "react-router";
import { PaintedHero } from "../../kit/components";
import { PackageBrowser, type BrowseParams } from "../components/package-browser";
import { Search } from "../components/search";
import { useHydrated } from "../page-store";
import type { Package } from "../types";

/**
 * The package list. The prerendered HTML is the unfiltered first page; the
 * query string (`?q=&tags=&sort=&page=`) is applied once the page hydrates.
 */
export function HomePage({ packages }: { packages: Package[] }) {
  const [searchParams] = useSearchParams();
  const hydrated = useHydrated();
  const params: BrowseParams = hydrated
    ? {
        q: searchParams.get("q") ?? undefined,
        tags: searchParams.get("tags") ?? undefined,
        sort: searchParams.get("sort") ?? undefined,
        page: searchParams.get("page") ?? undefined,
      }
    : {};

  return (
    <main id="main" className="pkg-main pkg-home kit-above-backdrop" tabIndex={-1}>
      <PaintedHero
        className="pkg-hero"
        name="bedrinth"
        image={{ src: "/icon.png", alt: "Bedrinth icon", width: 64, height: 64 }}
        seed={7}
      >
        <Search variant="hero" />
      </PaintedHero>
      <PackageBrowser packages={packages} params={params} />
    </main>
  );
}
