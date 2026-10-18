import { PixelIcon } from "../../kit/components";
import { RouterLink } from "./router-link";

interface PaginationProps {
  /** The page shown (selected slot, previous/next). */
  currentPage: number;
  /**
   * The page the URL asked for, which the window of numbers is centred on:
   * past the end (`?page=999`) it is not `currentPage`, and the numbers read
   * `1 ... 3` as they always have.
   */
  windowPage?: number;
  totalPages: number;
  buildUrl: (page: number) => string;
}

/** Numbered pages on the kit's hotbar; the current page is the selected slot. */
export function Pagination({
  currentPage,
  windowPage = currentPage,
  totalPages,
  buildUrl,
}: PaginationProps) {
  // Show a window of pages around the current page
  const windowSize = 2;
  const pages: (number | "...")[] = [];

  // Always show first page
  pages.push(1);

  const rangeStart = Math.max(2, windowPage - windowSize);
  const rangeEnd = Math.min(totalPages - 1, windowPage + windowSize);

  if (rangeStart > 2) pages.push("...");

  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  if (rangeEnd < totalPages - 1) pages.push("...");

  // Always show last page if > 1
  if (totalPages > 1) pages.push(totalPages);

  return (
    <nav className="kit-pagination pkg-pagination" aria-label="Pagination">
      <div className="hotbar hotbar-pixel">
        {currentPage > 1 ? (
          <RouterLink
            href={buildUrl(currentPage - 1)}
            aria-label="Previous page"
            rel="prev"
          >
            <PixelIcon name="arrowLeft" />
          </RouterLink>
        ) : (
          <span className="hotbar-slot is-disabled" aria-hidden="true">
            <PixelIcon name="arrowLeft" />
          </span>
        )}

        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="hotbar-slot is-gap"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <RouterLink
              key={p}
              href={buildUrl(p)}
              aria-label={`Page ${p}`}
              aria-current={p === currentPage ? "page" : undefined}
            >
              {p}
            </RouterLink>
          ),
        )}

        {currentPage < totalPages ? (
          <RouterLink
            href={buildUrl(currentPage + 1)}
            aria-label="Next page"
            rel="next"
          >
            <PixelIcon name="arrowRight" />
          </RouterLink>
        ) : (
          <span className="hotbar-slot is-disabled" aria-hidden="true">
            <PixelIcon name="arrowRight" />
          </span>
        )}
      </div>
    </nav>
  );
}
