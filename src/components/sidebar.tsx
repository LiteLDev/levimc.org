import { RouterLink } from "./router-link";

interface SidebarProps {
  tags: string[];
  selectedTags: string[];
  currentParams: {
    q?: string;
    tags?: string;
    sort?: string;
    page?: string;
  };
}

function buildTagUrl(
  tag: string,
  selectedTags: string[],
  currentParams: SidebarProps["currentParams"],
): string {
  const isSelected = selectedTags.includes(tag);
  const newTags = isSelected
    ? selectedTags.filter((t) => t !== tag)
    : [...selectedTags, tag];

  const p = new URLSearchParams();
  if (currentParams.q) p.set("q", currentParams.q);
  if (newTags.length > 0) p.set("tags", newTags.join(","));
  if (currentParams.sort && currentParams.sort !== "relevance")
    p.set("sort", currentParams.sort);
  // Reset to page 1 when changing tags

  const qs = p.toString();
  return qs ? `/?${qs}` : "/";
}

/**
 * Tag filters as pixel chips. On wide screens they wrap in a panel; on
 * phones they become three rows that scroll sideways, so the packages stay
 * close to the top.
 */
export function Sidebar({ tags, selectedTags, currentParams }: SidebarProps) {
  return (
    <aside className="pkg-sidebar" aria-labelledby="pkg-tags-title">
      <div className="px-card pkg-panel pkg-tags-panel">
        <h2 id="pkg-tags-title" className="pkg-panel-title">
          Tags
        </h2>
        <ul className="pkg-tags">
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <li key={tag}>
                <RouterLink
                  href={buildTagUrl(tag, selectedTags, currentParams)}
                  className="pkg-chip pkg-chip-link"
                  aria-current={isSelected ? "true" : undefined}
                >
                  {tag}
                </RouterLink>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
