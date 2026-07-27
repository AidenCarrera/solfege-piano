/** Input types that consume printable characters. */
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

/**
 * Checks if an element captures text entry and should suppress keybindings.
 * Non-text controls (buttons, sliders) are excluded so focused UI doesn't block shortcuts.
 *
 * @param target - Event target to check.
 */
export function isTextEntryTarget(target: EventTarget | null) {
  if (typeof Element === "undefined" || !(target instanceof Element)) {
    return false;
  }

  const field = target.closest(
    'input, select, textarea, [contenteditable="true"], [role="textbox"], [role="searchbox"], [role="combobox"]',
  );
  if (!field) return false;

  // Only text-like inputs conflict; range/checkbox/radio/color ignore letters.
  if (
    typeof HTMLInputElement !== "undefined" &&
    field instanceof HTMLInputElement
  ) {
    return TEXT_ENTRY_INPUT_TYPES.has(field.type);
  }

  return true;
}

/**
 * Refocuses the spacebar for sustain pedal use by blurring any active non-text UI control.
 * Called whenever a piano note is played (regardless of input method).
 */
export function refocusSustainPedal() {
  if (typeof document === "undefined") return;
  const active = document.activeElement;
  if (active && active instanceof HTMLElement && active !== document.body) {
    if (!isTextEntryTarget(active)) {
      active.blur();
    }
  }
}

