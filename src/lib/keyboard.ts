const TEXT_ENTRY_INPUT_TYPES = new Set([
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
  "number",
  "date",
  "datetime-local",
  "month",
  "time",
  "week",
]);

export function isTextEntryTarget(target: EventTarget | null) {
  if (typeof Element === "undefined" || !(target instanceof Element)) {
    return false;
  }

  const field = target.closest(
    'input, select, textarea, [contenteditable="true"], [role="textbox"], [role="searchbox"], [role="combobox"]',
  );
  if (!field) return false;

  if (
    typeof HTMLInputElement !== "undefined" &&
    field instanceof HTMLInputElement
  ) {
    return TEXT_ENTRY_INPUT_TYPES.has(field.type);
  }

  return true;
}

export function refocusSustainPedal() {
  if (typeof document === "undefined") return;
  const active = document.activeElement;
  if (active && active instanceof HTMLElement && active !== document.body) {
    if (!isTextEntryTarget(active)) {
      active.blur();
    }
  }
}
