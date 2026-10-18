import { Fragment } from "react";
import { PixelIcon } from "../../kit/components";
import { CopyButton } from "./copy-button";

interface InstallCommandsProps {
  tooth: string;
  version: string;
  variant: string;
}

function buildInstallCommand(
  tooth: string,
  variant: string,
  version: string,
): string {
  if (variant === "") {
    return `lip install ${tooth}@${version}`;
  }
  return `lip install ${tooth}#${variant}@${version}`;
}

/**
 * The command with line-break opportunities after each `/` and before `@`
 * and `#`, so on a narrow screen it wraps between the parts of the tooth
 * instead of in the middle of a name. `<wbr>` adds no text: what is selected
 * or copied is the command as is.
 */
function withBreaks(command: string) {
  return command.split(/(?<=\/)|(?=[@#])/).map((part, i) => (
    <Fragment key={i}>
      {i > 0 && <wbr />}
      {part}
    </Fragment>
  ));
}

export function InstallCommands({
  tooth,
  version,
  variant,
}: InstallCommandsProps) {
  const command = buildInstallCommand(tooth, variant, version);
  const label = variant === "" ? "(default)" : variant;

  return (
    <section className="px-card pkg-panel" aria-labelledby="pkg-install-title">
      <h2 id="pkg-install-title" className="pkg-panel-title">
        <PixelIcon name="pickaxe" />
        Install
      </h2>
      <div className="pkg-install">
        <div className="pkg-install-label">{label}</div>
        <div className="kit-code pkg-install-box">
          <code className="pkg-install-command">
            <span className="pkg-install-prompt" aria-hidden="true" />
            <span className="pkg-install-text">{withBreaks(command)}</span>
          </code>
          <CopyButton text={command} />
        </div>
      </div>
    </section>
  );
}
