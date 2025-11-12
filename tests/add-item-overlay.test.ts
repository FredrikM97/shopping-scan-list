import { describe, it, expect, beforeEach, vi, afterAll } from "vitest";
import { AddItemOverlay } from "../src/components/add-item-overlay";
import { BannerMessage } from "../src/types";
import * as translations from "../src/translations/translations";

if (!customElements.get("gsc-add-item-overlay")) {
  customElements.define("gsc-add-item-overlay", AddItemOverlay);
}

function createElement() {
  return new Promise<AddItemOverlay>((resolve) => {
    const el = document.createElement("gsc-add-item-overlay") as AddItemOverlay;
    document.body.appendChild(el);
    setTimeout(() => resolve(el), 0);
  });
}

describe("gsc-add-item-overlay", () => {
  let el: AddItemOverlay;

  beforeEach(async () => {
    el = await createElement();
  });

  it("renders translated title if available", async () => {
    const spy = vi
      .spyOn(translations, "translate")
      .mockImplementation(() => "Test Title");
    el.requestUpdate();
    await el.updateComplete;
    const title = el.shadowRoot?.querySelector('span[slot="title"]');
    expect(title?.textContent).toContain("Test Title");
    spy.mockRestore();
  });

  it("shows error banner if addItem returns error object", async () => {
    el.todoListService = {
      addItem: vi.fn().mockResolvedValue({ error: { message: "failObj" } }),
    } as any;
    el.entityId = "eid";
    el.name = "foo";
    await el._addDevice();
    expect(el.banner?.message).toMatch(/failObj/);
  });

  it("updates state on input", async () => {
    el.openDialog();
    await el.updateComplete;
    const nameInput = el.shadowRoot?.querySelector(
      'ha-textfield[label="Name"]',
    ) as HTMLInputElement | null;
    const barcodeInput = el.shadowRoot?.querySelector(
      'ha-textfield[label="Barcode"]',
    ) as HTMLInputElement | null;
    const brandInput = el.shadowRoot?.querySelector(
      'ha-textfield[label="Brand"]',
    ) as HTMLInputElement | null;
    // Simulate input events
    if (nameInput) {
      nameInput.value = "n";
      nameInput.dispatchEvent(new Event("input"));
    }
    if (barcodeInput) {
      barcodeInput.value = "b";
      barcodeInput.dispatchEvent(new Event("input"));
    }
    if (brandInput) {
      brandInput.value = "br";
      brandInput.dispatchEvent(new Event("input"));
    }
    expect(el.name).toBe("n");
    expect(el.barcode).toBe("b");
    expect(el.brand).toBe("br");
  });

  it("renders with pre-filled values", async () => {
    el.name = "foo";
    el.barcode = "123";
    el.brand = "bar";
    el.openDialog();
    await el.updateComplete;
    const nameInput = el.shadowRoot?.querySelector(
      'ha-textfield[label="Name"]',
    );
    const barcodeInput = el.shadowRoot?.querySelector(
      'ha-textfield[label="Barcode"]',
    );
    const brandInput = el.shadowRoot?.querySelector(
      'ha-textfield[label="Brand"]',
    );
    expect(nameInput?.getAttribute("value")).toBe("foo");
    expect(barcodeInput?.getAttribute("value")).toBe("123");
    expect(brandInput?.getAttribute("value")).toBe("bar");
  });

  it("closes dialog on Cancel button click", async () => {
    el.openDialog();
    await el.updateComplete;
    const cancelBtn = Array.from(
      el.shadowRoot?.querySelectorAll("ha-button") || [],
    ).find((btn) => btn.textContent?.match(/cancel/i)) as
      | HTMLElement
      | undefined;
    expect(cancelBtn).toBeTruthy();
    cancelBtn?.click();
    await el.updateComplete;
    expect(el.open).toBe(false);
  });

  it("renders dialog closed by default", () => {
    expect(el.open).toBe(false);
    expect(
      el.shadowRoot?.querySelector("gsc-dialog-overlay")?.getAttribute("open"),
    ).toBeNull();
  });

  it("opens dialog and clears banner", () => {
    el.banner = BannerMessage.error("err");
    el.openDialog();
    expect(el.open).toBe(true);
    expect(el.banner).toBeNull();
  });

  it("closes dialog and clears fields", () => {
    el.name = "foo";
    el.barcode = "123";
    el.brand = "bar";
    el.banner = BannerMessage.error("err");
    el.open = true;
    el.closeDialog();
    expect(el.open).toBe(false);
    expect(el.name).toBe("");
    expect(el.barcode).toBe("");
    expect(el.brand).toBe("");
    expect(el.banner).toBeNull();
  });

  it("shows error if required fields missing on add", async () => {
    el.todoListService = null;
    el.entityId = "";
    el.name = "";
    await el._addDevice();
    expect(el.banner?.message).toMatch(/required/);
  });

  it("calls addItem and closes on success", async () => {
    el.todoListService = { addItem: vi.fn().mockResolvedValue(true) } as any;
    el.entityId = "eid";
    el.name = "foo";
    el.barcode = "123";
    el.brand = "bar";
    const closeSpy = vi.spyOn(el, "closeDialog");
    await el._addDevice();
    expect(el.todoListService?.addItem).toHaveBeenCalledWith("foo", "eid", {
      name: "foo",
      barcode: "123",
      brand: "bar",
    });
    expect(closeSpy).toHaveBeenCalled();
  });

  it("shows error if addItem throws", async () => {
    el.todoListService = {
      addItem: vi.fn().mockRejectedValue(new Error("fail")),
    } as any;
    el.entityId = "eid";
    el.name = "foo";
    await el._addDevice();
    expect(el.banner?.message).toMatch(/fail/);
  });

  afterEach(() => {
    el.remove();
  });
});
