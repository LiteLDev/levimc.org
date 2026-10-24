import { useEffect } from "react";
import { useNavigate } from "react-router";
import { PixelIcon } from "../kit-ui";
import { RouterLink } from "../components/router-link";
import { useI18n } from "../i18n";
import { BASE } from "../base-path";
import { packagePath } from "../lib/packages";

// `/mods/packages/<tooth>/` is the form pkg.levimc.org used.
const PACKAGE_PATH = new RegExp(`^${BASE}(?:packages/)?(.+?)/?$`);

/**
 * Package pages exist only under each tooth's exact spelling, so the 404 page
 * sends `/mods/github.com/liteldev/levilamina` (or the old
 * `/mods/packages/github.com/LiteLDev/LeviLamina/`) on to the package it means.
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
    if (!tooth) return;
    const target = `${packagePath(tooth)}${window.location.search}`;
    // With a #heading, load the prerendered page itself: the browser then
    // scrolls to the heading as for any other deep link.
    if (window.location.hash) window.location.replace(`${target}${window.location.hash}`);
    else navigate(target, { replace: true });
  }, [navigate, tooths]);
}

export function NotFoundPage({ tooths }: { tooths: string[] }) {
  const { t } = useI18n();
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
        <p className="pkg-notfound-text">{t.notFoundText}</p>
        <RouterLink href={BASE} className="mc-btn mc-btn-primary">
          <PixelIcon name="grass" />
          {t.backToSearch}
        </RouterLink>
      </div>
    </main>
  );
}
