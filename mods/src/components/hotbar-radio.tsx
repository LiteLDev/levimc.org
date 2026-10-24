import { useRef, type KeyboardEvent, type ReactNode } from "react";

export interface HotbarRadioOption<T extends string | number> {
  value: T;
  label: ReactNode;
  /** Accessible name when `label` is an icon. */
  ariaLabel?: string;
  /** Shown in a Minecraft tooltip (icon-only options). */
  tooltip?: string;
}

interface HotbarRadioProps<T extends string | number> {
  label: string;
  options: readonly HotbarRadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * A segmented control on the kit's hotbar: a WAI-ARIA radio group with a
 * roving tab stop (arrows move and select, Home/End jump to the ends).
 */
export function HotbarRadio<T extends string | number>({ label, options, value, onChange, className }: HotbarRadioProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = options.findIndex((o) => o.value === value);
    let n: number;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % options.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + options.length) % options.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = options.length - 1;
    else return;
    e.preventDefault();
    const next = options[n];
    if (!next) return;
    onChange(next.value);
    ref.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[n]?.focus();
  };
  return (
    <div
      ref={ref}
      className={`hotbar mods-radio${className ? ` ${className}` : ""}`}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {options.map((o, i) => {
        const checked = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={o.ariaLabel}
            tabIndex={checked ? 0 : -1}
            className={`${checked ? "is-active" : ""}${o.tooltip ? " kit-tooltip-host" : ""}` || undefined}
            data-placement={o.tooltip ? "bottom" : undefined}
            // the last slot's tooltip opens leftwards, so it never reaches past the toolbar (sideways scroll on phones)
            data-align={o.tooltip && i === options.length - 1 ? "end" : undefined}
            onClick={() => onChange(o.value)}
          >
            {o.label}
            {o.tooltip ? (
              <span className="mc-tooltip kit-tooltip" aria-hidden="true">
                <span className="mc-tooltip-title">{o.tooltip}</span>
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
