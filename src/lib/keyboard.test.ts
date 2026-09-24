import { afterEach, describe, expect, it } from "vitest";
import { blurFocusedControl, isTextEntryTarget } from "./keyboard";

function mount<T extends HTMLElement>(element: T): T {
  document.body.append(element);
  return element;
}

function input(type: string): HTMLInputElement {
  const element = document.createElement("input");
  element.type = type;
  return mount(element);
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("isTextEntryTarget", () => {
  it("ignores anything that is not an element", () => {
    expect(isTextEntryTarget(null)).toBe(false);
    expect(isTextEntryTarget(new AbortController().signal)).toBe(false);
  });

  it("claims fields that swallow typed characters", () => {
    expect(isTextEntryTarget(input("text"))).toBe(true);
    expect(isTextEntryTarget(input("search"))).toBe(true);
    expect(isTextEntryTarget(mount(document.createElement("textarea")))).toBe(
      true,
    );
  });

  it("leaves the piano's own controls playable", () => {
    expect(isTextEntryTarget(input("range"))).toBe(false);
    expect(isTextEntryTarget(input("checkbox"))).toBe(false);
    expect(isTextEntryTarget(input("color"))).toBe(false);
    expect(isTextEntryTarget(mount(document.createElement("button")))).toBe(
      false,
    );
    expect(isTextEntryTarget(mount(document.createElement("select")))).toBe(
      false,
    );
  });

  it("claims a target nested inside a text field", () => {
    const editable = mount(document.createElement("div"));
    editable.setAttribute("contenteditable", "true");
    const span = editable.appendChild(document.createElement("span"));

    expect(isTextEntryTarget(span)).toBe(true);
  });
});

describe("blurFocusedControl", () => {
  it("releases a focused control so Spacebar reaches sustain", () => {
    const slider = input("range");
    slider.focus();
    expect(document.activeElement).toBe(slider);

    blurFocusedControl();

    expect(document.activeElement).not.toBe(slider);
  });

  it("leaves a text field focused so typing is not interrupted", () => {
    const field = input("text");
    field.focus();

    blurFocusedControl();

    expect(document.activeElement).toBe(field);
  });

  it("does nothing when focus already rests on the body", () => {
    expect(() => blurFocusedControl()).not.toThrow();
    expect(document.activeElement).toBe(document.body);
  });
});
