import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { PixelIcon } from "../kit-ui";
import { useI18n } from "../i18n";

/** Results follow the field this long after the last keystroke. */
export const SEARCH_DEBOUNCE_MS = 150;

const isEditable = (el: Element | null) =>
  !!el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || (el as HTMLElement).isContentEditable);

interface ListingSearchProps {
  /** The query in the URL. */
  query: string;
  /** Packages in the catalogue (the placeholder's scale cue). */
  total: number;
  /** Applies a query (replacing the history entry: typing adds none). */
  onSearch: (q: string) => void;
}

/**
 * The listing's search field: results follow as you type (150 ms after the
 * last key), never on a half-composed IME syllable. Enter applies at once,
 * Escape clears the field (or leaves it when empty), and `/` anywhere else
 * on the page jumps here.
 */
export function ListingSearch({ query, total, onSearch }: ListingSearchProps) {
  const { t } = useI18n();
  const [value, setValue] = useState(query);
  const input = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The last query this field applied: the URL catching up with it is not a change from outside.
  const [committed, setCommitted] = useState(query);

  // Follow the URL when it changes under the field (back/forward, chips), but
  // not when it is only catching up with what was typed.
  const [synced, setSynced] = useState(query);
  if (synced !== query) {
    setSynced(query);
    if (query !== committed) {
      setValue(query);
      setCommitted(query);
    }
  }

  const commit = (q: string) => {
    clearTimeout(timer.current);
    if (q === query) return;
    setCommitted(q);
    onSearch(q);
  };
  const schedule = (q: string) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(q), SEARCH_DEBOUNCE_MS);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isEditable(document.activeElement)) return;
      if (document.querySelector("dialog[open]")) return;
      e.preventDefault();
      input.current?.focus();
      input.current?.select();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      className="pkg-search pkg-search-listing"
      role="search"
      action="/"
      onSubmit={(e) => {
        e.preventDefault();
        commit(value);
      }}
    >
      <label className="mc-input pkg-search-field">
        <PixelIcon name="search" className="pkg-search-icon" />
        <input
          ref={input}
          type="search"
          name="q"
          enterKeyHint="search"
          placeholder={t.searchPlaceholder(total)}
          aria-label={t.searchLabel}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (!composing.current && !(e.nativeEvent as InputEvent).isComposing) schedule(e.target.value);
          }}
          onCompositionStart={() => {
            composing.current = true;
            clearTimeout(timer.current);
          }}
          onCompositionEnd={(e) => {
            composing.current = false;
            schedule(e.currentTarget.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              if (value) {
                setValue("");
                commit("");
              } else {
                e.currentTarget.blur();
              }
            }
          }}
        />
        {value ? (
          <button
            type="button"
            className="mc-icon-btn pkg-search-clear"
            aria-label={t.clearSearch}
            onClick={() => {
              setValue("");
              commit("");
              input.current?.focus();
            }}
          >
            <PixelIcon name="close" />
          </button>
        ) : (
          <kbd className="mc-kbd pkg-search-kbd" aria-hidden="true">
            /
          </kbd>
        )}
      </label>
    </form>
  );
}

/** The search form of the package and 404 pages' header: Enter opens the listing with the query. */
export function HeaderSearch() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  return (
    <form className="pkg-search pkg-search-header" role="search" action="/" onSubmit={handleSubmit}>
      <label className="mc-input pkg-search-field">
        <PixelIcon name="search" className="pkg-search-icon" />
        <input
          type="search"
          name="q"
          enterKeyHint="search"
          placeholder={t.searchShortPlaceholder}
          aria-label={t.searchLabel}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <button type="submit" className="mc-btn mc-btn-primary mc-btn-sm pkg-search-submit" aria-label={t.searchSubmit}>
        <PixelIcon name="search" />
        <span className="pkg-search-submit-text">{t.searchSubmit}</span>
      </button>
    </form>
  );
}
