import { Suspense } from "react";
import { fetchPackages } from "@/lib/packages";
import { PackageBrowser } from "@/components/package-browser";
import { PackageBrowserClient } from "@/components/package-browser-client";

export default async function IndexPage() {
  // Fetched once at build time and shipped with the page.
  const allPackages = await fetchPackages();

  // The prerendered HTML is the unfiltered first page; the client takes over
  // once it can read the query string.
  return (
    <Suspense fallback={<PackageBrowser packages={allPackages} params={{}} />}>
      <PackageBrowserClient packages={allPackages} />
    </Suspense>
  );
}
