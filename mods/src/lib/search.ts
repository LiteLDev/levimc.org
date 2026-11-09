// Full-text search over the catalogue. A hundred-odd mods need no search
// engine: every query word must appear in one of a mod's fields, and the
// fields weigh in by importance — a hit in the name counts three times as much
// as one in the description. Substring matching finds Chinese text (领地) as
// well as parts of names (lamina → LeviLamina).
import { featuredTagsOf, visibleTags } from "../data/featured-tags.ts";
import type { CatalogEntry } from "../types.ts";

interface SearchDoc {
  id: string;
  /** [text, weight] per field, lower case. */
  fields: [string, number][];
}

/**
 * The text a mod is found by (the shared contract's A3): name ×3; repository
 * path and owner ×2; its featured tags' labels in every language and its tags
 * (normalised, without the hidden loader and kind tags, which would make
 * "levilamina" find the whole catalogue) ×2; description ×1.
 */
export function searchFields(entry: CatalogEntry): [string, number][] {
  const labels = featuredTagsOf(entry.tags).flatMap(({ tag }) => Object.values(tag.label));
  const repo = entry.id.split("/").slice(1).join(" ");
  const fields: [string, number][] = [
    [entry.name, 3],
    [`${repo} ${entry.owner}`, 2],
    [[...new Set([...labels, ...visibleTags(entry.tags)])].join(" "), 2],
    [entry.description, 1],
  ];
  return fields.map(([text, weight]) => [text.toLowerCase(), weight]);
}

const toDoc = (entry: CatalogEntry): SearchDoc => ({ id: entry.id, fields: searchFields(entry) });

const WORD = /[\p{L}\p{N}]/u;

/** How well `token` matches `text`: 3 a whole word, 2 the start of a word, 1 anywhere, 0 not at all. */
function matchQuality(text: string, token: string): number {
  let best = 0;
  for (let at = text.indexOf(token); at >= 0; at = text.indexOf(token, at + 1)) {
    const start = at === 0 || !WORD.test(text[at - 1]!);
    const end = at + token.length >= text.length || !WORD.test(text[at + token.length]!);
    best = Math.max(best, start ? (end ? 3 : 2) : 1);
    if (best === 3) break;
  }
  return best;
}

let cached: { entries: readonly CatalogEntry[]; docs: SearchDoc[] } | null = null;

function docsFor(entries: readonly CatalogEntry[]): SearchDoc[] {
  if (cached?.entries !== entries) cached = { entries, docs: entries.map(toDoc) };
  return cached.docs;
}

/**
 * Relevance scores of the mods matching `query` (higher is better), or
 * `null` for an empty query. Every word of the query has to match; each adds
 * the weight of the fields it matches times how well it matches, and an
 * exact name scores highest.
 */
export function searchCatalog(entries: readonly CatalogEntry[], query: string): Map<string, number> | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const tokens = [...new Set(q.split(/[\s,，、]+/u).filter(Boolean))];
  const scores = new Map<string, number>();
  for (const doc of docsFor(entries)) {
    let total = 0;
    let all = true;
    for (const token of tokens) {
      let score = 0;
      for (const [text, weight] of doc.fields) score += weight * matchQuality(text, token);
      if (!score) {
        all = false;
        break;
      }
      total += score;
    }
    if (!all) continue;
    if (doc.fields[0]![0] === q) total += 100;
    scores.set(doc.id, total);
  }
  return scores;
}
