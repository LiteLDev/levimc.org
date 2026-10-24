import { existsSync, readFileSync } from "node:fs";

interface ManifestChunk {
  file: string;
  imports?: string[];
  isEntry?: boolean;
}

const MANIFEST = "dist/.vite/manifest.json";
let manifest: Record<string, ManifestChunk> | null | undefined;

function readManifest(): Record<string, ManifestChunk> | null {
  if (manifest === undefined) {
    manifest = existsSync(MANIFEST)
      ? (JSON.parse(readFileSync(MANIFEST, "utf8")) as Record<string, ManifestChunk>)
      : null; // the dev server has no manifest
  }
  return manifest;
}

/**
 * `<link rel="modulepreload">` tags for a lazily loaded module and the chunks
 * it imports, so a page that needs it right away fetches it alongside the
 * entry instead of after it.
 */
export function modulePreloadTags(source: string): string {
  const chunks = readManifest();
  if (!chunks) return "";

  const files = new Set<string>();
  const visit = (key: string) => {
    const chunk = chunks[key];
    if (!chunk || chunk.isEntry || files.has(chunk.file)) return;
    files.add(chunk.file);
    chunk.imports?.forEach(visit);
  };
  visit(source);
  return [...files]
    .map((file) => `<link rel="modulepreload" crossorigin href="/${file}" />`)
    .join("\n    ");
}
