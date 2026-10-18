import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { PackageDetail } from "../components/package-detail";
import {
  fetchManifestInfo,
  fetchReadme,
  resolveSelection,
} from "../lib/packages";
import type { PackageSelection } from "../lib/packages";
import type { PackageDetails } from "../page-data";
import { useHydrated } from "../page-store";
import type { RawPackageEntry } from "../types";

interface PackagePageProps {
  tooth: string;
  pkg: RawPackageEntry;
  /** Where the package's repository lives (READMEs are read from there). */
  repository: string;
  /** The selection the page was prerendered for, and its details. */
  prerendered: PackageSelection & PackageDetails;
}

function selectionKey({ variant, version }: PackageSelection): string {
  return `${variant}@${version}`;
}

/**
 * Only the latest version is prerendered; picking another variant or version
 * through the query string fetches that version's manifest and README here.
 * Both lipr and GitHub allow cross-origin reads. (The app renders one of
 * these per tooth, so its state never outlives the package.)
 */
export function PackagePage({ tooth, pkg, repository, prerendered }: PackagePageProps) {
  const [searchParams] = useSearchParams();
  const hydrated = useHydrated();
  const selection =
    (hydrated &&
      resolveSelection(
        pkg,
        searchParams.get("variant"),
        searchParams.get("version"),
      )) ||
    prerendered;
  const key = selectionKey(selection);
  const isPrerendered = key === selectionKey(prerendered);

  const [fetched, setFetched] = useState<{ key: string } & PackageDetails>();

  useEffect(() => {
    if (isPrerendered) return;

    let cancelled = false;
    const [variant, version] = [selection.variant, selection.version];
    Promise.all([
      fetchManifestInfo(tooth, version),
      fetchReadme(repository, version),
    ]).then(([info, readme]) => {
      if (cancelled) return;
      setFetched({ key: selectionKey({ variant, version }), info, readme });
    });
    return () => {
      cancelled = true;
    };
  }, [tooth, repository, isPrerendered, selection.variant, selection.version]);

  let details: Partial<PackageDetails> = {};
  if (isPrerendered) details = prerendered;
  else if (fetched?.key === key) details = fetched;

  return (
    <main id="main" className="pkg-main kit-above-backdrop" tabIndex={-1} data-pkg-detail="">
      <PackageDetail
        tooth={tooth}
        pkg={pkg}
        repository={repository}
        selection={selection}
        info={details.info ?? null}
        readme={details.readme}
      />
    </main>
  );
}
