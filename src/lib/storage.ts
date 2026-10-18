// Per-viewer conveniences kept in localStorage (view mode, collapsed filter
// groups, the last listing). Storage can be missing or throw (private
// windows, blocked site data): every access is guarded, and the site works
// the same without it.
export const STORAGE_KEYS = {
  view: "levimc-mods:view",
  groups: "levimc-mods:groups",
  moreCategories: "levimc-mods:more",
  /** sessionStorage: the listing URL "Back to search" returns to. */
  lastSearch: "levimc-mods:last-search",
} as const;

export function readStorage(key: string, session = false): string | null {
  try {
    return (session ? sessionStorage : localStorage).getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string | null, session = false): void {
  try {
    const store = session ? sessionStorage : localStorage;
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  } catch {
    // not available: nothing to remember
  }
}
