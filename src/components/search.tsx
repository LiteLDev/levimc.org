import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { PixelIcon } from "../../kit/components";
import { useHydrated } from "../page-store";

const AUTO_SEARCH_ENABLED = import.meta.env.VITE_AUTO_SEARCH === "1";
const AUTO_SEARCH_DEBOUNCE_MS = 900;

/** The query parameters of the package list that a new search keeps. */
const KEPT_PARAMS = ["tags", "sort"];

interface SearchProps {
  /** `hero`: the large field on the home page; `header`: the site header's. */
  variant: "hero" | "header";
}

export function Search({ variant }: SearchProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hydrated = useHydrated();
  // The prerendered page has no query string; see `useHydrated`.
  const currentQ = hydrated ? (searchParams.get("q") ?? "") : "";
  const [value, setValue] = useState(currentQ);

  // Follow the URL when it changes under the field (back/forward, links).
  const [syncedQ, setSyncedQ] = useState(currentQ);
  if (syncedQ !== currentQ) {
    setSyncedQ(currentQ);
    setValue(currentQ);
  }

  const buildNextUrl = useCallback(
    (nextQ: string): string | null => {
      if (nextQ === currentQ) return null;

      const params = new URLSearchParams();
      if (nextQ) params.set("q", nextQ);
      // Reset page to 1 on search, but preserve tags and sort.
      for (const name of KEPT_PARAMS) {
        const kept = searchParams.get(name);
        if (kept) params.set(name, kept);
      }

      const qs = params.toString();
      return qs ? `/?${qs}` : "/";
    },
    [currentQ, searchParams],
  );

  useEffect(() => {
    if (!AUTO_SEARCH_ENABLED) return;

    const nextQ = value.trim();
    const timer = setTimeout(() => {
      const nextUrl = buildNextUrl(nextQ);
      if (!nextUrl) return;
      navigate(nextUrl, { replace: true });
    }, AUTO_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, navigate, buildNextUrl]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextUrl = buildNextUrl(value.trim());
    if (!nextUrl) return;
    navigate(nextUrl);
  }

  return (
    <form
      className={`pkg-search pkg-search-${variant}`}
      role="search"
      action="/"
      onSubmit={handleSubmit}
    >
      <label className="mc-input pkg-search-field">
        <PixelIcon name="search" className="pkg-search-icon" />
        <input
          type="search"
          name="q"
          placeholder="Search packages..."
          aria-label="Search packages"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <button
        type="submit"
        className={`mc-btn mc-btn-primary${variant === "header" ? " mc-btn-sm" : ""}`}
      >
        Search
      </button>
    </form>
  );
}
