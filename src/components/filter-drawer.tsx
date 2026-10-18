import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { PixelIcon } from "../kit-ui";
import { useI18n } from "../i18n";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Gets the focus back when the drawer closes. */
  returnFocus: RefObject<HTMLButtonElement | null>;
  resultCount: number;
  onClearAll: () => void;
  canClear: boolean;
  /** Below the filters: the page size. */
  footerExtra: ReactNode;
  children: ReactNode;
}

/**
 * The filters on narrow screens: a modal `<dialog>` (focus trap, Escape and
 * an inert page come with it). Filters apply as they are picked; "Show N
 * results" closes the drawer and moves to the results.
 */
export function FilterDrawer({ open, onClose, returnFocus, resultCount, onClearAll, canClear, footerExtra, children }: FilterDrawerProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="pkg-filter-drawer"
      aria-labelledby="pkg-drawer-title"
      onClose={() => {
        onClose();
        returnFocus.current?.focus();
      }}
      onClick={(e) => {
        // a click on the backdrop (the dialog itself, outside its panel) closes it
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="pkg-drawer-panel">
        <header className="pkg-drawer-head">
          <h2 id="pkg-drawer-title">{t.filters}</h2>
          <button type="button" className="mc-icon-btn" aria-label={t.closeFilters} onClick={() => ref.current?.close()}>
            <PixelIcon name="close" />
          </button>
        </header>
        <div className="pkg-drawer-body">{children}</div>
        <footer className="pkg-drawer-foot">
          {footerExtra}
          <div className="pkg-drawer-actions">
            <button type="button" className="mc-btn mc-btn-ghost" onClick={onClearAll} disabled={!canClear}>
              {t.clearAll}
            </button>
            <button
              type="button"
              className="mc-btn mc-btn-primary pkg-drawer-show"
              onClick={() => {
                ref.current?.close();
                requestAnimationFrame(() => document.getElementById("pkg-status")?.focus());
              }}
            >
              {t.showResults(resultCount)}
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}
