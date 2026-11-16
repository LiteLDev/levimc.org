import type { AnchorHTMLAttributes } from "react";
import { Link, useLocation } from "react-router";
import { DOCS_PROJECTS } from "../../kit/components/projects";
import { BASE } from "../base-path";
import { useI18n } from "../i18n";
import type { LinkLikeProps } from "../kit-ui";
import { DEFAULT_LOCALE, LOCALES, localeInfo, withLocale, type Locale } from "../locales";
import { SITE_ORIGIN } from "../page-data";
import { usePageStore } from "../page-store";

/** levimc.org's builds whose URLs carry the locale after their base too (/zh-Hans/…, /tutorials/zh-Hans/…). */
const TUTORIALS = "/tutorials/";
const PROJECT_PATHS = DOCS_PROJECTS.map((p) => new URL(p.url).pathname);
const LOCALE_SEGMENT = new RegExp(`^(?:${LOCALES.filter((l) => l.prefix).map((l) => l.prefix.slice(0, -1)).join("|")})(?:/|$)`);

/**
 * A link on levimc.org in `locale`: this site's pages (`/mods/x/` → `/mods/zh-Hans/x/`), the tutorials'
 * (`/tutorials/` → `/tutorials/zh-Hans/`) and levimc.org's own (`/about/` → `/zh-Hans/about/`) get the locale
 * segment after their base; the projects' docs (their own locale schemes), links naming a locale already and other
 * origins stay as they are (the docs always absolute). Other levimc.org URLs come back root-relative.
 */
export function localizeHref(href: string, locale: Locale): string {
  const path = href.startsWith(`${SITE_ORIGIN}/`) ? href.slice(SITE_ORIGIN.length) : href;
  if (!path.startsWith("/") || path.startsWith("//")) return href;
  // the projects' docs: their canonical absolute URL, like on every LeviMC site
  if (PROJECT_PATHS.some((p) => path.startsWith(p))) return `${SITE_ORIGIN}${path}`;
  if (locale === DEFAULT_LOCALE) return path;
  if (path.startsWith(BASE)) return withLocale(path, locale);
  const base = path.startsWith(TUTORIALS) ? TUTORIALS : "/";
  const rest = path.slice(base.length);
  return LOCALE_SEGMENT.test(rest) ? path : base + localeInfo(locale).prefix + rest;
}

type RouterLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  /** History state of the new entry (e.g. that it was opened from the listing). */
  state?: unknown;
  /** Replace the current history entry instead of adding one. */
  replace?: boolean;
  /** `href` is in the language it should be already (the language menu): do not put it in the page's. */
  exact?: boolean;
};

/**
 * An in-app link, in the page's language: navigates without a page load, and starts fetching the
 * target page as soon as the pointer or focus is on it.
 */
export function RouterLink({ href: rawHref, onPointerEnter, onFocus, state, replace, exact, ...rest }: RouterLinkProps) {
  const store = usePageStore();
  const { pathname } = useLocation();
  const { href: localize } = useI18n();
  const href = exact ? rawHref : localize(rawHref);
  const target = href.split(/[?#]/)[0] || "/";
  const preload = () => {
    if (target !== pathname) store.preload(target);
  };
  return (
    <Link
      to={href}
      state={state}
      replace={replace}
      onPointerEnter={(e) => {
        preload();
        onPointerEnter?.(e);
      }}
      onFocus={(e) => {
        preload();
        onFocus?.(e);
      }}
      {...rest}
    />
  );
}

/**
 * {@link RouterLink} in the shape kit components take as `linkComponent` (the LeviMC bar and footer): this
 * site's pages navigate inside the app, the other levimc.org links load in full — all in the page's language.
 */
export function KitRouterLink({ href, ...rest }: LinkLikeProps) {
  const { href: localize } = useI18n();
  const to = localize(href);
  if (!to.startsWith(BASE)) return <a href={to} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} />;
  return <RouterLink href={to} exact {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} />;
}

/** {@link KitRouterLink} to exactly `href` (the language menu's options, each in its own language). */
export function KitExactLink({ href, ...rest }: LinkLikeProps) {
  return <RouterLink href={href} exact {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} />;
}
