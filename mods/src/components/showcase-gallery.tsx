import { useEffect, useRef, useState } from "react";
import { PixelIcon } from "../kit-ui";
import { useI18n, type Locale } from "../i18n";
import type { LocalizedText, ShowcaseItem } from "../types";

/** A mod's text in the visitor's language: Traditional Chinese falls back to Simplified, then English. */
export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale as keyof LocalizedText] ?? (locale === "zh-Hant" ? text["zh-CN"] : undefined) ?? text.en;
}

function Media({ item, title, eager, inDialog }: { item: ShowcaseItem; title: string; eager?: boolean; inDialog?: boolean }) {
  if (item.kind === "video") {
    return (
      <video
        className="mods-shot-media"
        src={item.src}
        poster={item.poster}
        width={item.width}
        height={item.height}
        controls
        muted
        loop
        playsInline
        autoPlay={inDialog}
        preload={inDialog ? "auto" : "none"}
        aria-label={title}
      />
    );
  }
  return (
    <img
      className="mods-shot-media"
      src={item.src}
      alt={title}
      width={item.width}
      height={item.height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

/**
 * The Gallery tab: a mod's pictures, videos and animations, the first one
 * large. Pictures open in a viewer (arrow keys page through them); videos
 * play in place.
 */
export function ShowcaseGallery({ items, name }: { items: ShowcaseItem[]; name: string }) {
  const { t, locale } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open !== null && !dialog.open) dialog.showModal();
    else if (open === null && dialog.open) dialog.close();
  }, [open]);

  const page = (step: number) => setOpen((i) => (i === null ? i : (i + step + items.length) % items.length));
  const current = open !== null ? items[open] : undefined;

  return (
    <section className="px-card mods-panel mods-gallery" aria-label={t.galleryLabel(name)}>
      <ul className="mods-gallery-grid">
        {items.map((item, i) => {
          const title = localize(item.title, locale);
          const caption = item.caption ? localize(item.caption, locale) : null;
          return (
            <li key={item.src} className={i === 0 ? "mods-shot mods-shot-lead" : "mods-shot"}>
              <figure>
                {item.kind === "video" ? (
                  <div className="mods-shot-frame">
                    <Media item={item} title={title} />
                  </div>
                ) : (
                  <button type="button" className="mods-shot-frame mods-shot-open" onClick={() => setOpen(i)} aria-label={t.galleryOpen(title)}>
                    <Media item={item} title={title} eager={i === 0} />
                  </button>
                )}
                <figcaption>
                  <strong className="mods-shot-title">{title}</strong>
                  {caption ? <span className="mods-shot-caption">{caption}</span> : null}
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>

      <dialog
        ref={ref}
        className="mods-dialog mods-lightbox"
        aria-label={current ? localize(current.title, locale) : undefined}
        onClose={() => setOpen(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") page(1);
          else if (e.key === "ArrowLeft") page(-1);
        }}
      >
        {current && open !== null ? (
          <div className="px-card mods-dialog-panel mods-lightbox-panel">
            <div className="mods-shot-frame">
              <Media key={current.src} item={current} title={localize(current.title, locale)} eager inDialog />
            </div>
            <div className="mods-lightbox-bar">
              <div className="mods-lightbox-text">
                <strong className="mods-shot-title">{localize(current.title, locale)}</strong>
                {current.caption ? <span className="mods-shot-caption">{localize(current.caption, locale)}</span> : null}
              </div>
              <div className="mods-lightbox-nav">
                {items.length > 1 ? (
                  <>
                    <button type="button" className="mc-icon-btn" aria-label={t.galleryPrevious} onClick={() => page(-1)}>
                      <PixelIcon name="arrowLeft" />
                    </button>
                    <span className="mods-lightbox-count">{t.galleryCount(open + 1, items.length)}</span>
                    <button type="button" className="mc-icon-btn" aria-label={t.galleryNext} onClick={() => page(1)}>
                      <PixelIcon name="arrowRight" />
                    </button>
                  </>
                ) : null}
                <button type="button" className="mc-icon-btn" aria-label={t.close} onClick={() => setOpen(null)}>
                  <PixelIcon name="close" />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
