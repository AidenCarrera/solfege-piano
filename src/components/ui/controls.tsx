import type { ComponentProps, CSSProperties, ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  value,
  action,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  value?: ReactNode;
  action?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const Label = htmlFor ? "label" : "span";
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <div className="flex h-5 items-center justify-between gap-2">
        <Label
          htmlFor={htmlFor}
          className="truncate text-[11px] font-semibold tracking-wider text-ui-muted uppercase"
        >
          {label}
        </Label>
        <div className="flex items-center gap-1.5">
          {action}
          {value !== undefined && <ValueBadge>{value}</ValueBadge>}
        </div>
      </div>
      {children}
      {hint && (
        <p className="text-[11px] leading-snug text-ui-subtle">{hint}</p>
      )}
    </div>
  );
}

export function ValueBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-ui-surface px-1.5 py-px font-mono text-[11px] tabular-nums">
      {children}
    </span>
  );
}

export function Slider({
  value,
  min,
  max,
  className = "",
  style,
  ...props
}: Omit<ComponentProps<"input">, "type" | "value" | "min" | "max"> & {
  value: number;
  min: number;
  max: number;
}) {
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      className={className}
      style={{ "--fill": `${fill}%`, ...style } as CSSProperties}
      {...props}
    />
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  size = "md",
  className = "",
}: {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex rounded-lg border border-ui-border bg-ui-surface p-0.5 ${
        disabled ? "opacity-50" : ""
      } ${className}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            title={option.title}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed ${
              size === "sm"
                ? "h-7 px-2 text-xs"
                : "h-8 px-2.5 text-[13px] sm:px-3"
            } ${
              selected
                ? "bg-accent-solid text-white shadow-sm"
                : "text-ui-muted hover:bg-ui-surface-hover hover:text-ui-fg"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ToggleChip({
  pressed,
  onChange,
  children,
  title,
}: {
  pressed: boolean;
  onChange: (pressed: boolean) => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      title={title}
      onClick={() => onChange(!pressed)}
      className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition-colors ${
        pressed
          ? "border-transparent bg-accent-soft text-ui-fg"
          : "border-ui-border text-ui-muted hover:bg-ui-surface-hover hover:text-ui-fg"
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex size-3.5 items-center justify-center rounded-[4px] border transition-colors ${
          pressed ? "border-accent-solid bg-accent-solid" : "border-ui-subtle"
        }`}
      >
        {pressed && (
          <svg viewBox="0 0 12 12" className="size-2.5 text-white">
            <path
              d="M2.5 6.2 5 8.5l4.5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {children}
    </button>
  );
}

export function IconButton({
  label,
  children,
  className = "",
  ...props
}: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-ui-muted transition-colors hover:bg-ui-surface-hover hover:text-ui-fg ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
