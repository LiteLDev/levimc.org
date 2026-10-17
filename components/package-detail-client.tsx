"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageDetail } from "@/components/package-detail";
import {
  fetchManifestInfo,
  fetchReadme,
  resolveSelection,
} from "@/lib/packages";
import type { PackageSelection } from "@/lib/packages";
import type { PackageInfo, RawPackageEntry } from "@/types";

interface Details {
  info: PackageInfo | null;
  readme: string | null;
}

interface PackageDetailClientProps {
  tooth: string;
  pkg: RawPackageEntry;
  /** The selection the page was prerendered for, and its details. */
  prerendered: PackageSelection & Details;
}

function selectionKey({ variant, version }: PackageSelection): string {
  return `${variant}@${version}`;
}

/**
 * Only the latest version is prerendered; picking another variant or version
 * through the query string fetches that version's manifest and README here.
 */
export function PackageDetailClient({
  tooth,
  pkg,
  prerendered,
}: PackageDetailClientProps) {
  const searchParams = useSearchParams();
  const selection = resolveSelection(
    pkg,
    searchParams.get("variant"),
    searchParams.get("version"),
  ) ?? prerendered;
  const key = selectionKey(selection);
  const isPrerendered = key === selectionKey(prerendered);

  const [fetched, setFetched] = useState<{ key: string } & Details>();

  useEffect(() => {
    if (isPrerendered) return;

    let cancelled = false;
    const [variant, version] = [selection.variant, selection.version];
    Promise.all([
      fetchManifestInfo(tooth, version),
      fetchReadme(tooth, version),
    ]).then(([info, readme]) => {
      if (cancelled) return;
      setFetched({ key: selectionKey({ variant, version }), info, readme });
    });
    return () => {
      cancelled = true;
    };
  }, [tooth, isPrerendered, selection.variant, selection.version]);

  let details: Partial<Details> = {};
  if (isPrerendered) details = prerendered;
  else if (fetched?.key === key) details = fetched;

  return (
    <PackageDetail
      tooth={tooth}
      pkg={pkg}
      selection={selection}
      info={details.info ?? null}
      readme={details.readme}
    />
  );
}
