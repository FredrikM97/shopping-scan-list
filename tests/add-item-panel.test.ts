// Mock ha-button and ha-textfield to avoid Home Assistant dependency issues
if (!customElements.get("ha-button")) {
  customElements.define("ha-button", class extends HTMLElement {});
}
if (!customElements.get("ha-textfield")) {
  customElements.define(
    "ha-textfield",
    class extends HTMLElement {
      set value(val) {
        this.setAttribute("value", val);
      }
      get value() {
        return this.getAttribute("value");
      }
    },
  );
}
vi.mock("../src/common.ts", () => ({ fireEvent: vi.fn() }));
import { fireEvent } from "../src/common.ts";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AddItemPanel } from "../src/components/add-item-panel.ts";
import { BannerMessage } from "../src/types.ts";

if (!customElements.get("gsc-add-item-panel")) {
  customElements.define("gsc-add-item-panel", AddItemPanel);
}

describe("gsc-add-item-panel", () => {
  let el: AddItemPanel;

  beforeEach(() => {
    el = document.createElement("gsc-add-item-panel") as AddItemPanel;
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it("renders with default state", () => {
    expect((el as any).inputValue).toBe("");
    expect((el as any).inputCount).toBe(1);
    expect((el as any).banner).toBeNull();
    expect(el.shadowRoot?.querySelector(".add-item-panel")).toBeTruthy();
  });

  it("sets input value via setInputValue", () => {
    el.setInputValue("Milk");
    expect((el as any).inputValue).toBe("Milk");
  });

  it("shows error if required fields missing on add", async () => {
    el.todoListService = null;
    (el as any).inputValue = "";
    el.entityId = "";
    await (el as any)._onAddItem();
    expect((el as any).banner?.message).toMatch(/required/);
  });

  it("calls addItem and closes on success", async () => {
    el.todoListService = { addItem: vi.fn().mockResolvedValue(true) } as any;
    (el as any).inputValue = "Bread";
    (el as any).inputCount = 2;
    el.entityId = "eid";
    const closeSpy = vi.spyOn(el, "closePanel");
    await (el as any)._onAddItem();
    expect(el.todoListService.addItem).toHaveBeenCalledWith("Bread", "eid", {
      name: "Bread",
      count: 2,
    });
    expect(closeSpy).toHaveBeenCalled();
    expect((fireEvent as any).mock.calls.length).toBeGreaterThan(0);
  });

  it("shows error if addItem throws", async () => {
    el.todoListService = {
      addItem: vi.fn().mockRejectedValue(new Error("fail")),
    } as any;
    (el as any).inputValue = "Eggs";
    (el as any).inputCount = 1;
    el.entityId = "eid";
    await (el as any)._onAddItem();
    expect((el as any).banner?.message).toMatch(/fail/);
  });

  it("resets state on closePanel", () => {
    (el as any).inputValue = "Cheese";
    (el as any).inputCount = 5;
    (el as any).banner = BannerMessage.error("err");
    el.closePanel();
    expect((el as any).inputValue).toBe("");
    expect((el as any).inputCount).toBe(1);
    expect((el as any).banner).toBeNull();
  });
});
