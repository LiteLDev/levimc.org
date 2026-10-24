import { useEffect, useId, useState } from "react";
import { PixelIcon } from "../kit-ui";
import { useI18n } from "../i18n";
import { copyText } from "../lib/clipboard";

interface CopyButtonProps {
  text: string;
  /** The button's name; default: "Copy "<text>" to clipboard". */
  label?: string;
  className?: string;
}

/**
 * Copies `text`. A Minecraft item tooltip (the kit's `mc-tooltip`) says what
 * it does on hover and focus, then that it did. The tooltip lives inside the
 * button, so it never runs into the text next to it.
 */
export function CopyButton({ text, label, className }: CopyButtonProps) {
  const { t } = useI18n();
  // Counts copies, so each click restarts the "Copied!" timer.
  const [copies, setCopies] = useState(0);
  const copied = copies > 0;
  const tipId = `mods-copy-tip-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

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
      className={`mc-icon-btn kit-tooltip-host mods-copy${className ? ` ${className}` : ""}`}
      data-placement="top"
      data-copied={copied ? "" : undefined}
      aria-label={copied ? t.copiedShort : (label ?? t.copyText(text))}
      aria-describedby={tipId}
    >
      <PixelIcon name={copied ? "check" : "copy"} />
      <span role="tooltip" id={tipId} className="mc-tooltip kit-tooltip">
        <span className="mc-tooltip-title">{copied ? t.copied : t.copyToClipboard}</span>
      </span>
    </button>
  );
}
