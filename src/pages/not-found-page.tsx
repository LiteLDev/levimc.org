import { useEffect } from "react";
import { useNavigate } from "react-router";
import { PixelIcon } from "../../kit/components";
import { RouterLink } from "../components/router-link";
import { packagePath } from "../lib/packages";

const PACKAGE_PATH = /^\/packages\/(.+?)\/?$/;

/**
 * Package pages exist only under each tooth's exact spelling, so the 404 page
 * sends `/packages/github.com/liteldev/levilamina` on to the package it means.
 */
function usePackageRedirect(tooths: string[]) {
  const navigate = useNavigate();

  useEffect(() => {
    const match = PACKAGE_PATH.exec(window.location.pathname);
    if (!match?.[1]) return;

    let requested: string;
    try {
      requested = decodeURIComponent(match[1]).toLowerCase();
    } catch {
      return;
    }
    const tooth = tooths.find((t) => t.toLowerCase() === requested);
    if (tooth) {
      navigate(`${packagePath(tooth)}${window.location.search}`, {
        replace: true,
      });
    }
  }, [navigate, tooths]);
}

export function NotFoundPage({ tooths }: { tooths: string[] }) {
  usePackageRedirect(tooths);

  return (
    <main id="main" className="pkg-main pkg-notfound kit-notfound kit-above-backdrop" tabIndex={-1}>
      <div className="px-card kit-painted pkg-notfound-card">
        <div className="kit-slot pkg-notfound-compass" aria-hidden="true">
          <PixelIcon name="compass" size={64} className="kit-notfound-spin" />
        </div>
        <h1 className="kit-hero-title pkg-notfound-code">
          <span className="kit-hero-name">404</span>
        </h1>
        <p className="pkg-notfound-text">
          The page you are looking for does not exist or the package could not be
          found.
        </p>
        <RouterLink href="/" className="mc-btn mc-btn-primary">
          <PixelIcon name="grass" />
          Back to packages
        </RouterLink>
      </div>
    </main>
  );
}
