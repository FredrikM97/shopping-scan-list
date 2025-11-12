import { describe, it, expect, beforeEach, vi } from "vitest";
import { ShoppingListOverlay } from "../src/components/shopping-list-overlay";
import { ShoppingListStatus } from "../src/types";

if (!customElements.get("gsc-list-overlay")) {
  customElements.define("gsc-list-overlay", ShoppingListOverlay);
}

describe("gsc-list-overlay", () => {
  let el: ShoppingListOverlay;
  let listManager: any;

  beforeEach(() => {
    el = document.createElement("gsc-list-overlay") as ShoppingListOverlay;
    listManager = {
      getItems: vi.fn().mockResolvedValue([
        { id: "1", name: "Milk", status: ShoppingListStatus.NeedsAction },
        { id: "2", name: "Eggs", status: ShoppingListStatus.NeedsAction },
      ]),
      toggleComplete: vi.fn().mockResolvedValue(true),
      removeItem: vi.fn().mockResolvedValue(true),
    };
    el.listManager = listManager;
    el.entityId = "eid";
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it("renders nothing when closed", () => {
    expect(el["open"]).toBe(false);
    // Should not render dialog overlay when closed
    expect(el.shadowRoot?.querySelector("gsc-dialog-overlay")).toBeNull();
  });

  it("opens dialog and loads items", async () => {
    el.openDialog();
    await el.updateComplete;
    expect(el["open"]).toBe(true);
    expect(listManager.getItems).toHaveBeenCalledWith("eid");
    expect(el["items"].length).toBe(2);
    const table = el.shadowRoot?.querySelector("ha-data-table");
    expect(table).toBeTruthy();
  });

  it("closes dialog", () => {
    el.openDialog();
    el.closeDialog();
    expect(el["open"]).toBe(false);
  });

  it("shows error banner if loading items fails", async () => {
    el.listManager.getItems = vi.fn().mockRejectedValue(new Error("fail"));
    const spy = vi.spyOn(el, "dispatchEvent");
    el.openDialog();
    await el.updateComplete;
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "show-banner-message" }),
    );
  });

  it("toggles item complete and reloads items", async () => {
    el.openDialog();
    await el.updateComplete;
    await el._toggleItem("1");
    expect(listManager.toggleComplete).toHaveBeenCalledWith("1", "eid");
    expect(listManager.getItems).toHaveBeenCalledTimes(2); // initial + after toggle
  });

  it("shows error banner if toggle fails", async () => {
    el.openDialog();
    await el.updateComplete;
    listManager.toggleComplete = vi.fn().mockRejectedValue(new Error("fail"));
    const spy = vi.spyOn(el, "dispatchEvent");
    await el._toggleItem("1");
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "show-banner-message" }),
    );
  });

  it("removes item and reloads items", async () => {
    el.openDialog();
    await el.updateComplete;
    await el._removeItem("1");
    expect(listManager.removeItem).toHaveBeenCalledWith("1", "eid");
    expect(listManager.getItems).toHaveBeenCalledTimes(2); // initial + after remove
  });

  it("shows error banner if remove fails", async () => {
    el.openDialog();
    await el.updateComplete;
    listManager.removeItem = vi.fn().mockRejectedValue(new Error("fail"));
    const spy = vi.spyOn(el, "dispatchEvent");
    await el._removeItem("1");
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "show-banner-message" }),
    );
  });

  it("calls resize on dialog resize", async () => {
    el.openDialog();
    await el.updateComplete;
    const table = { resize: vi.fn() };
    el.renderRoot.querySelector = vi.fn().mockReturnValue(table);
    (el as any)._onDialogResized();
    expect(table.resize).toHaveBeenCalled();
  });
});
