import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageDetail } from "@/components/package-detail";
import { PackageDetailClient } from "@/components/package-detail-client";
import {
  fetchManifestInfo,
  fetchPackageIndex,
  fetchReadme,
  getDefaultSelection,
} from "@/lib/packages";

interface PageProps {
  params: Promise<{ tooth: string[] }>;
}

// Every package gets a page at build time; anything else is the 404 page.
export const dynamicParams = false;

export async function generateStaticParams() {
  const packageIndex = await fetchPackageIndex();
  return Object.entries(packageIndex.packages)
    .filter(([, pkg]) => getDefaultSelection(pkg))
    .map(([tooth]) => ({ tooth: tooth.split("/") }));
}

async function resolvePackage(params: PageProps["params"]) {
  const { tooth: segments } = await params;
  const tooth = segments.map((s) => decodeURIComponent(s)).join("/");
  const packageIndex = await fetchPackageIndex();
  const pkg = packageIndex.packages[tooth];
  return pkg ? { tooth, pkg } : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await resolvePackage(params);
  if (!resolved) {
    return { title: "Not Found" };
  }

  return {
    title: resolved.pkg.info.name,
    description: resolved.pkg.info.description,
  };
}

export default async function PackageDetailPage({
  params,
}: Readonly<PageProps>) {
  const resolved = await resolvePackage(params);
  const selection = resolved && getDefaultSelection(resolved.pkg);
  if (!resolved || !selection) {
    notFound();
  }

  const { tooth, pkg } = resolved;
  const [info, readme] = await Promise.all([
    fetchManifestInfo(tooth, selection.version),
    fetchReadme(tooth, selection.version),
  ]);

  // The prerendered HTML is the latest version; the client swaps in another
  // when the query string asks for one.
  return (
    <Suspense
      fallback={
        <PackageDetail
          tooth={tooth}
          pkg={pkg}
          selection={selection}
          info={info}
          readme={readme}
        />
      }
    >
      <PackageDetailClient
        tooth={tooth}
        pkg={pkg}
        prerendered={{ ...selection, info, readme }}
      />
    </Suspense>
  );
}
