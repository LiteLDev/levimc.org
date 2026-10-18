import { useEffect, useId, useState } from "react";
import { PixelIcon } from "../../kit/components";
import { copyText } from "../lib/clipboard";

interface CopyButtonProps {
  text: string;
}

/**
 * Copies `text`. A Minecraft item tooltip (the kit's `mc-tooltip`) says what
 * it does on hover and focus, then that it did. The tooltip lives inside the
 * button, so it never runs into the text next to it.
 */
export function CopyButton({ text }: CopyButtonProps) {
  // Counts copies, so each click restarts the "Copied!" timer.
  const [copies, setCopies] = useState(0);
  const copied = copies > 0;
  const tipId = `pkg-copy-tip-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    if (!copies) return;
    const timer = setTimeout(() => setCopies(0), 2000);
    return () => clearTimeout(timer);
  }, [copies]);

  const handleCopy = async () => {
    // Clipboard errors (e.g. unsupported context) are ignored.
    if (await copyText(text)) setCopies((n) => n + 1);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="mc-icon-btn kit-tooltip-host pkg-copy"
      data-placement="top"
      data-copied={copied ? "" : undefined}
      aria-label={copied ? "Copied" : `Copy "${text}" to clipboard`}
      aria-describedby={tipId}
    >
      <PixelIcon name={copied ? "check" : "copy"} />
      <span role="tooltip" id={tipId} className="mc-tooltip kit-tooltip">
        <span className="mc-tooltip-title">
          {copied ? "Copied!" : "Copy to clipboard"}
        </span>
      </span>
    </button>
  );
}
