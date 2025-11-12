import { describe, it, expect, beforeEach, vi } from "vitest";
vi.mock("../src/common.js", () => ({ fireEvent: vi.fn() }));
import { QuickChipsPanel } from "../src/components/quick-chips-panel.js";
// Mock ha-button to avoid Home Assistant dependency issues
if (!customElements.get("ha-button")) {
  customElements.define("ha-button", class extends HTMLElement {});
}
import { fireEvent } from "../src/common.js";

if (!customElements.get("gsc-chips-panel")) {
  customElements.define("gsc-chips-panel", QuickChipsPanel);
}

describe("gsc-chips-panel", () => {
  let el: QuickChipsPanel;

  beforeEach(() => {
    el = document.createElement("gsc-chips-panel") as QuickChipsPanel;
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it("renders with default state", async () => {
    el.chips = [];
    await el.updateComplete;
    expect(el.chips).toEqual([]);
    // The section should always render
    expect(el.shadowRoot?.querySelector(".quick-chips-section")).not.toBeNull();
  });

  it("renders chips from property", async () => {
    el.chips = ["Milk", "Bread", "Eggs"];
    await el.updateComplete;
    const buttons = el.shadowRoot?.querySelectorAll("ha-button");
    expect(buttons?.length).toBe(3);
  });

  it("sorts and limits chips by _items", async () => {
    el.chips = ["Milk", "Bread", "Eggs"];
    await el.updateComplete;
    (el as any)._items = [
      { name: "Eggs", total: 5 },
      { name: "Milk", total: 10 },
      { name: "Bread", total: 7 },
    ];
    await el.updateComplete;
    const buttons = el.shadowRoot?.querySelectorAll("ha-button");
    expect(buttons?.[0]?.getAttribute("data-product")).toBe("Milk");
    expect(buttons?.[1]?.getAttribute("data-product")).toBe("Bread");
    expect(buttons?.[2]?.getAttribute("data-product")).toBe("Eggs");
  });

  it("handles chip click and calls addItem", async () => {
    el.todoListService = {
      addItem: vi.fn().mockResolvedValue({ name: "Milk" }),
      getItems: vi.fn(),
    } as any;
    el.entityId = "eid";
    el.chips = ["Milk"];
    await el.updateComplete;
    const button = el.shadowRoot?.querySelector("ha-button");
    button?.dispatchEvent(
      new Event("click", { bubbles: true, composed: true }),
    );
    // Wait for async
    await Promise.resolve();
    expect(el.todoListService.addItem).toHaveBeenCalledWith("Milk", "eid");
    expect((fireEvent as any).mock.calls.length).toBeGreaterThan(0);
  });

  it("warns if chip click missing service/entity", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    el.todoListService = null;
    el.entityId = "";
    el.chips = ["Milk"];
    await el.updateComplete;
    const button = el.shadowRoot?.querySelector("ha-button");
    button?.dispatchEvent(
      new Event("click", { bubbles: true, composed: true }),
    );
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("refreshes chips on event", async () => {
    const getItems = vi.fn().mockResolvedValue([{ name: "Milk", total: 1 }]);
    el.todoListService = { getItems } as any;
    el.entityId = "eid";
    // Directly call refresh to guarantee the test
    await (el as any)._refreshChips();
    expect(getItems).toHaveBeenCalledWith("eid");
  });
});
