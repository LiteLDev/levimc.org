import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { ModDetail, type ModPageData } from "../components/mod-detail";
import { fetchManifest, fetchReadme, parseTab, resolveSelection, type ModSelection } from "../lib/mods";
import type { ModDetails } from "../page-data";
import { useHydrated } from "../page-store";

function selectionKey({ variant, version }: ModSelection): string {
  return `${variant}@${version}`;
}

/**
 * Only the latest version's Description is prerendered; another variant or
 * version (`?variant=&version=`) fetches that version's manifest and README
 * here, and the other tabs (`?tab=versions|dependencies`) render from the
 * page data once hydrated. Both lipr and GitHub allow cross-origin reads.
 * (The app renders one of these per tooth, so its state never outlives the
 * mod.)
 */
export function ModPage({ data }: { data: ModPageData }) {
  const { tooth, mod, repository, prerendered } = data;
  const [searchParams] = useSearchParams();
  const hydrated = useHydrated();
  const selection =
    (hydrated && resolveSelection(mod, searchParams.get("variant"), searchParams.get("version"))) || prerendered;
  const tab = hydrated ? parseTab(searchParams.get("tab")) : "description";
  const key = selectionKey(selection);
  const isPrerendered = key === selectionKey(prerendered);

  const [fetched, setFetched] = useState<{ key: string } & ModDetails>();

  useEffect(() => {
    if (isPrerendered) return;

    let cancelled = false;
    const [variant, version] = [selection.variant, selection.version];
    Promise.all([fetchManifest(tooth, version), fetchReadme(repository, version)]).then(([manifest, readme]) => {
      if (cancelled) return;
      setFetched({
        key: selectionKey({ variant, version }),
        info: manifest?.info ?? null,
        variants: manifest?.variants ?? null,
        readme,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [tooth, repository, isPrerendered, selection.variant, selection.version]);

  let details: Partial<ModDetails> = {};
  if (isPrerendered) details = prerendered;
  else if (fetched?.key === key) details = fetched;

  return (
    <main id="main" className="mods-main kit-above-backdrop" tabIndex={-1} data-mods-detail="">
      <ModDetail
        data={data}
        selection={selection}
        tab={tab}
        info={details.info ?? null}
        variants={details.variants}
        readme={details.readme}
      />
    </main>
  );
}
