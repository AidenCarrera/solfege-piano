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
  if (!(target instanceof Element)) return false;

  // Dropdowns aren't typed into, so the piano keeps its keys while one has focus.
  const field = target.closest(
    'input, textarea, [contenteditable="true"], [role="textbox"], [role="searchbox"], [role="combobox"]',
  );
  if (!field) return false;

  if (field instanceof HTMLInputElement) {
    return TEXT_ENTRY_INPUT_TYPES.has(field.type);
  }

  return true;
}

/** Frees the Spacebar for sustain, which a focused control would swallow. */
export function blurFocusedControl() {
  const active = document.activeElement;
  if (
    active instanceof HTMLElement &&
    active !== document.body &&
    !isTextEntryTarget(active)
  ) {
    active.blur();
  }
}
