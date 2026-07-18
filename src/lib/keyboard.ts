/** Returns true when a global shortcut should defer to the focused control. */
export function isInteractiveKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      'button, input, select, textarea, [contenteditable="true"], [role="button"], [role="slider"], [role="textbox"]',
    ),
  );
}
