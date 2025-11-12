import { describe, it, expect, beforeEach, vi } from "vitest";
import { GscMessageBanner } from "../src/components/message-banner";
import { BannerMessage } from "../src/types";

if (!customElements.get("gsc-message-banner")) {
  customElements.define("gsc-message-banner", GscMessageBanner);
}

describe("gsc-message-banner", () => {
  let el: GscMessageBanner;

  beforeEach(() => {
    el = document.createElement("gsc-message-banner") as GscMessageBanner;
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it("renders nothing by default", () => {
    const msg = el.shadowRoot?.querySelector(".message");
    expect(msg).toBeTruthy();
    expect((msg as HTMLElement).style.display).toBe("none");
  });

  it("shows error message", async () => {
    el.banner = BannerMessage.error("fail!");
    await el.updateComplete;
    const msg = el.shadowRoot?.querySelector(".message");
    expect(msg?.textContent).toContain("fail!");
    expect(msg?.classList.contains("error")).toBe(true);
    expect((msg as HTMLElement | null)?.style.display).toBe("block");
  });

  it("shows success message", async () => {
    el.banner = BannerMessage.success("ok!");
    await el.updateComplete;
    const msg = el.shadowRoot?.querySelector(".message");
    expect(msg?.textContent).toContain("ok!");
    expect(msg?.classList.contains("success")).toBe(true);
    expect((msg as HTMLElement | null)?.style.display).toBe("block");
  });

  it("hides when no message", async () => {
    el.banner = BannerMessage.success("");
    await el.updateComplete;
    const msg = el.shadowRoot?.querySelector(".message");
    expect((msg as HTMLElement | null)?.style.display).toBe("none");
  });
});
