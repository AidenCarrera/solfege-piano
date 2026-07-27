import { describe, expect, it } from "vitest";
import { isTextEntryTarget, refocusSustainPedal } from "./keyboard";

describe("keyboard utilities", () => {
  describe("isTextEntryTarget", () => {
    it("returns false for non-element targets", () => {
      expect(isTextEntryTarget(null)).toBe(false);
      expect(isTextEntryTarget({} as unknown as EventTarget)).toBe(false);
    });

    it("returns true for text input fields", () => {
      class MockInputElement {
        type = "text";
        closest(selector: string) {
          if (selector.includes("input")) return this;
          return null;
        }
      }
      // Set global Element for instanceof check
      const origElement = globalThis.Element;
      const origInput = globalThis.HTMLInputElement;
      try {
        globalThis.Element = MockInputElement as unknown as typeof Element;
        globalThis.HTMLInputElement = MockInputElement as unknown as typeof HTMLInputElement;

        const input = new MockInputElement();
        expect(isTextEntryTarget(input as unknown as EventTarget)).toBe(true);
      } finally {
        globalThis.Element = origElement;
        globalThis.HTMLInputElement = origInput;
      }
    });

    it("returns false for range input fields", () => {
      class MockRangeElement {
        type = "range";
        closest(selector: string) {
          if (selector.includes("input")) return this;
          return null;
        }
      }
      const origElement = globalThis.Element;
      const origInput = globalThis.HTMLInputElement;
      try {
        globalThis.Element = MockRangeElement as unknown as typeof Element;
        globalThis.HTMLInputElement = MockRangeElement as unknown as typeof HTMLInputElement;

        const range = new MockRangeElement();
        expect(isTextEntryTarget(range as unknown as EventTarget)).toBe(false);
      } finally {
        globalThis.Element = origElement;
        globalThis.HTMLInputElement = origInput;
      }
    });
  });

  describe("refocusSustainPedal", () => {
    it("safely handles undefined document in node", () => {
      expect(() => refocusSustainPedal()).not.toThrow();
    });

    it("blurs active element if it is not a text entry target", () => {
      let blurred = false;
      class MockButton {
        blur() {
          blurred = true;
        }
        closest() {
          return null;
        }
      }

      const origDoc = globalThis.document;
      const origElem = globalThis.Element;
      const origHTMLElement = globalThis.HTMLElement;
      try {
        const mockBtn = new MockButton();
        globalThis.Element = MockButton as unknown as typeof Element;
        globalThis.HTMLElement = MockButton as unknown as typeof HTMLElement;
        globalThis.document = {
          activeElement: mockBtn,
          body: {},
        } as unknown as Document;

        refocusSustainPedal();
        expect(blurred).toBe(true);
      } finally {
        globalThis.document = origDoc;
        globalThis.Element = origElem;
        globalThis.HTMLElement = origHTMLElement;
      }
    });
  });
});
