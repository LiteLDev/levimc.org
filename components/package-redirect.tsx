"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const PACKAGE_PATH = /^\/packages\/(.+?)\/?$/;

/**
 * Package pages exist only under each tooth's exact spelling, so the 404 page
 * sends `/packages/github.com/liteldev/levilamina` on to the package it means.
 */
export function PackageRedirect({ tooths }: { tooths: string[] }) {
  const router = useRouter();

  useEffect(() => {
    const match = PACKAGE_PATH.exec(window.location.pathname);
    if (!match) return;

    let requested: string;
    try {
      requested = decodeURIComponent(match[1]).toLowerCase();
    } catch {
      return;
    }
    const tooth = tooths.find((t) => t.toLowerCase() === requested);
    if (tooth) {
      router.replace(`/packages/${tooth}/${window.location.search}`);
    }
  }, [router, tooths]);

  return null;
}
