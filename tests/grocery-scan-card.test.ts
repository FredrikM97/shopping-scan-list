import { describe, it, expect, beforeEach, vi } from "vitest";
import { GroceryScanCard } from "../src/main";
import { html, render } from "lit";

if (!customElements.get("grocery-scan-card")) {
  customElements.define("grocery-scan-card", GroceryScanCard);
}

describe("grocery-scan-card", () => {
  let el: GroceryScanCard;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    el = document.createElement("grocery-scan-card") as GroceryScanCard;
    container.appendChild(el);
  });

  afterEach(() => {
    container.remove();
  });

  it("renders overlays and panels", async () => {
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector("gsc-scanner-overlay")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("gsc-add-item-overlay")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("gsc-chips-panel")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("gsc-list-overlay")).toBeTruthy();
  });

  it("opens scanner overlay on button click", async () => {
    const overlay = el.shadowRoot?.querySelector("gsc-scanner-overlay") as any;
    overlay.openDialog = vi.fn();
    const btn = el.shadowRoot?.querySelector(
      'gsc-action-btn[icon="mdi:camera"]',
    );
    btn?.dispatchEvent(new Event("action-click"));
    expect(overlay.openDialog).toHaveBeenCalled();
  });

  it("opens add item overlay on button click", async () => {
    const overlay = el.shadowRoot?.querySelector("gsc-add-item-overlay") as any;
    overlay.openDialog = vi.fn();
    const btn = el.shadowRoot?.querySelector('gsc-action-btn[icon="mdi:plus"]');
    btn?.dispatchEvent(new Event("action-click"));
    expect(overlay.openDialog).toHaveBeenCalled();
  });

  it("opens shopping list overlay on button click", async () => {
    const overlay = el.shadowRoot?.querySelector("gsc-list-overlay") as any;
    overlay.openDialog = vi.fn();
    const btn = el.shadowRoot?.querySelector(
      'gsc-action-btn[icon="mdi:format-list-bulleted"]',
    );
    btn?.dispatchEvent(new Event("action-click"));
    expect(overlay.openDialog).toHaveBeenCalled();
  });

  it("sets config and hass", () => {
    const config = { entity: "todo.test" };
    const hass = { states: { "todo.test": {} } };
    el.setConfig(config as any);
    el.hass = hass;
    expect(el.config).toEqual(config);
    expect(el.todoListService).toBeTruthy();
  });
});
