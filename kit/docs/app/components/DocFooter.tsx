import type { RouteMeta } from '../../shared/types';
import { href, site } from '../data';
import { KitLink } from './KitLink';
import { PixelIcon } from '../../../components/PixelIcon';
import type { UiStrings } from '../../../components/i18n';

export function DocFooter({ route, t }: { route: RouteMeta; t: UiStrings }) {
  const edit = route.editUrl ?? null;
  const editText = site.editLink?.text?.[route.locale] ?? t.editPage;
  // formatted at build time (site.ts): no Intl.DateTimeFormat during hydration
  const updated = site.lastUpdated ? route.updated : undefined;
  const fmt = updated?.text ?? null;
  return (
    <footer className="kit-doc-footer">
      {edit || fmt ? (
        <div className="kit-doc-meta">
          {edit ? (
            <a className="kit-doc-edit" href={edit} target="_blank" rel="noopener">
              <PixelIcon name="edit" />
              <span>{editText}</span>
            </a>
          ) : (
            <span />
          )}
          {fmt ? (
            <p className="kit-doc-updated">
              <PixelIcon name="history" />
              <span>
                {t.lastUpdated}{' '}
                <time dateTime={updated!.iso}>{fmt}</time>
              </span>
            </p>
          ) : null}
        </div>
      ) : null}
      {route.prev || route.next ? (
        <nav className="kit-pager" aria-label={`${t.previous} / ${t.next}`}>
          {route.prev ? (
            <KitLink className="px-card kit-pager-link is-prev" href={href(route.prev.path)} rel="prev">
              <span className="kit-pager-label">
                <PixelIcon name="arrowLeft" />
                {t.previous}
              </span>
              <span className="kit-pager-title">{route.prev.text}</span>
            </KitLink>
          ) : (
            <span />
          )}
          {route.next ? (
            <KitLink className="px-card kit-pager-link is-next" href={href(route.next.path)} rel="next">
              <span className="kit-pager-label">
                {t.next}
                <PixelIcon name="arrowRight" />
              </span>
              <span className="kit-pager-title">{route.next.text}</span>
            </KitLink>
          ) : null}
        </nav>
      ) : null}
    </footer>
  );
}
