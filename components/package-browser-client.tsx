"use client";

import { useSearchParams } from "next/navigation";
import { PackageBrowser } from "@/components/package-browser";
import { Package } from "@/types";

/**
 * The query string never reaches the static host, so search, tag filters,
 * sorting and pagination all happen here, over the index baked into the page.
 */
export function PackageBrowserClient({ packages }: { packages: Package[] }) {
  const searchParams = useSearchParams();

  return (
    <PackageBrowser
      packages={packages}
      params={{
        q: searchParams.get("q") ?? undefined,
        tags: searchParams.get("tags") ?? undefined,
        sort: searchParams.get("sort") ?? undefined,
        page: searchParams.get("page") ?? undefined,
      }}
    />
  );
}
