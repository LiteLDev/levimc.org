import type { Metadata } from "next";
import Link from "next/link";
import { PackageRedirect } from "@/components/package-redirect";
import { fetchPackageIndex } from "@/lib/packages";

export const metadata: Metadata = {
  title: "Not Found",
};

export default async function NotFound() {
  const packageIndex = await fetchPackageIndex();

  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <PackageRedirect tooths={Object.keys(packageIndex.packages)} />
      <h2 className="text-4xl font-bold mb-4">404</h2>
      <p className="text-lg text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
        The page you are looking for does not exist or the package could not be
        found.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900 hover:opacity-90 transition-opacity"
      >
        Back to packages
      </Link>
    </div>
  );
}
