import { describe, it, expect, vi } from "vitest";
import { addOpenOnEventListener, fireEvent, HA_CARD_REQUIRED_HA_COMPONENTS } from "../src/common";

describe("common utilities", () => {
  it("addOpenOnEventListener sets open property on event", () => {
    const node = document.createElement("div");
    (node as any).open = false;
    addOpenOnEventListener(node, "test-open");
    node.dispatchEvent(new Event("test-open"));
    expect((node as any).open).toBe(true);
  });

  it("addOpenOnEventListener uses custom openProp", () => {
    const node = document.createElement("div");
    (node as any).shown = false;
    addOpenOnEventListener(node, "show", "shown");
    node.dispatchEvent(new Event("show"));
    expect((node as any).shown).toBe(true);
  });

  it("fireEvent dispatches custom event with detail", () => {
    const node = document.createElement("div");
    const handler = vi.fn();
    node.addEventListener("my-event", handler);
    fireEvent(node, "my-event", { foo: 123 });
    expect(handler).toHaveBeenCalled();
    const event = handler.mock.calls[0][0];
    expect(event.detail).toEqual({ foo: 123 });
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it("HA_CARD_REQUIRED_HA_COMPONENTS contains required components", () => {
    expect(Array.isArray(HA_CARD_REQUIRED_HA_COMPONENTS)).toBe(true);
    expect(HA_CARD_REQUIRED_HA_COMPONENTS).toContain("ha-entity-picker");
  });
});
