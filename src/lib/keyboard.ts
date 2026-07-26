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
  if (!(target instanceof Element)) return false;

  const field = target.closest(
    'input, select, textarea, [contenteditable="true"], [role="textbox"], [role="searchbox"], [role="combobox"]',
  );
  if (!field) return false;

  // Only text-like inputs conflict; range/checkbox/radio/color ignore letters.
  if (field instanceof HTMLInputElement) {
    return TEXT_ENTRY_INPUT_TYPES.has(field.type);
  }

  return true;
}
