import {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { PixelIcon, useTheme } from "../../kit/components";
import { copyText } from "../lib/clipboard";
import {
  resolveMarkdownUrl,
  resolveSrcSet,
  themedMedia,
  type RepositoryRenames,
} from "../lib/markdown";
import type { RepoBaseUrls } from "../lib/packages";
import { README_PLUGINS } from "../lib/readme-pipeline";

export interface MarkdownProps {
  children: string;
  /** Raw file base of the repository the README came from, trailing slash included. */
  rawBase: string;
  /** Browsable file base of the same repository, for links to files. */
  blobBase: string;
  /** Repositories that moved, so links to their old addresses can be updated. */
  renames: RepositoryRenames;
}

interface ReadmeContextValue {
  bases: RepoBaseUrls;
  renames: RepositoryRenames;
}

/**
 * Where the README being rendered came from. The element components below
 * read it from here, so they stay the same components from render to render
 * and React never has to rebuild the README's links and images.
 */
const ReadmeContext = createContext<ReadmeContextValue>({
  bases: { raw: "", blob: "" },
  renames: {},
});

/** A fenced block in the kit's code frame, with a copy button. */
function CodeBlock({ children }: { children?: ReactNode }) {
  // Counts copies, so each click restarts the "Copied!" timer.
  const [copies, setCopies] = useState(0);
  const copied = copies > 0;

  useEffect(() => {
    if (!copies) return;
    const timer = setTimeout(() => setCopies(0), 1600);
    return () => clearTimeout(timer);
  }, [copies]);

  return (
    <div className="kit-code pkg-code">
      <button
        type="button"
        className="kit-code-copy pkg-code-copy"
        data-kit-copy=""
        data-copied={copied ? "Copied!" : undefined}
        aria-label={copied ? "Copied" : "Copy code"}
        onClick={async (e) => {
          const code = e.currentTarget.parentElement?.querySelector("pre");
          if (!code || !(await copyText(code.innerText.replace(/\n$/, "")))) {
            return;
          }
          setCopies((n) => n + 1);
        }}
      >
        <PixelIcon name="copy" className="kit-icon-copy" />
        <PixelIcon name="check" className="kit-icon-done" />
      </button>
      <pre>{children}</pre>
    </div>
  );
}

const components: Components = {
  // READMEs link and embed files relative to their own repository.
  a: function ReadmeLink({ node, href, ...props }) {
    const { bases, renames } = useContext(ReadmeContext);
    return <a href={resolveMarkdownUrl(href, "link", bases, renames)} {...props} />;
  },
  img: function ReadmeImage({ node, src, srcSet, ...props }) {
    const { bases, renames } = useContext(ReadmeContext);
    // `alt` is passed through when the markdown has it.
    return (
      <img
        src={typeof src === "string" ? resolveMarkdownUrl(src, "image", bases, renames) : src}
        srcSet={srcSet && resolveSrcSet(srcSet, bases, renames)}
        {...props}
      />
    );
  },
  // `<picture>` light/dark pairs follow the theme picked on this site.
  source: function ReadmeSource({ node, media, srcSet, ...props }) {
    const { bases, renames } = useContext(ReadmeContext);
    // `null` while hydrating (the server cannot know the theme), then the pick.
    const { preference, resolved } = useTheme();
    const picked = preference && preference !== "system" ? resolved : null;
    return (
      <source
        media={themedMedia(media, picked)}
        srcSet={srcSet && resolveSrcSet(srcSet, bases, renames)}
        {...props}
      />
    );
  },
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  // Wide tables scroll inside their frame instead of the page.
  table: ({ node, ...props }) => (
    <div className="kit-table-wrap">
      <table {...props} />
    </div>
  ),
};

/**
 * A README, rendered the same way at build time and in the browser (when
 * another version is picked), into the kit's prose styles. Memoized: the
 * README only renders again when it, or where it came from, changes.
 */
export const Markdown = memo(function Markdown({
  children,
  rawBase,
  blobBase,
  renames,
}: MarkdownProps) {
  const context = useMemo(
    () => ({ bases: { raw: rawBase, blob: blobBase }, renames }),
    [rawBase, blobBase, renames],
  );
  return (
    <ReadmeContext value={context}>
      <ReactMarkdown {...README_PLUGINS} components={components}>
        {children}
      </ReactMarkdown>
    </ReadmeContext>
  );
});
