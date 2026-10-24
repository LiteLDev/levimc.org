import { Fragment } from "react";
import { commandParts, installCommand } from "../lib/packages";
import { CopyButton } from "./copy-button";

interface InstallCommandProps {
  tooth: string;
  version: string;
  variant: string;
}

/** `lip install …` in the kit's code frame, with a copy button. */
export function InstallCommand({ tooth, version, variant }: InstallCommandProps) {
  const command = installCommand(tooth, variant, version);
  return (
    <div className="kit-code pkg-install-box">
      <code className="pkg-install-command">
        <span className="pkg-install-prompt" aria-hidden="true" />
        <span className="pkg-install-text">
          {commandParts(command).map((part, i) => {
            // a space between parts stays text (inside a part it would collapse at its end)
            const text = part.trimEnd();
            return (
              <Fragment key={i}>
                <span className="pkg-install-part">{text}</span>
                {text.length < part.length ? " " : <wbr />}
              </Fragment>
            );
          })}
        </span>
      </code>
      <CopyButton text={command} />
    </div>
  );
}
