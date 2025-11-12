import { LitElement, html, css } from "lit";
import { BannerMessage } from "../types";
import { customElement, property } from "lit/decorators.js";

@customElement("gsc-message-banner")
export class GscMessageBanner extends LitElement {
  @property({ type: Object }) banner: BannerMessage | null = null;

  static styles = css`
    .message {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 10px;
      border-radius: 6px;
      margin: 8px 0;
      text-align: center;
      font-size: 1em;
      display: block;
    }
    .error {
      background: #ffebee;
      color: #c62828;
    }
    .success {
      background: #e8f5e8;
      color: #2e7d32;
    }
  `;

  render() {
    return html`
      <div
        class="message ${this.banner?.type ?? "error"}"
        style="display:${this.banner?.message ? "block" : "none"}"
      >
        ${this.banner?.message ?? ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gsc-message-banner": GscMessageBanner;
  }
}
// File renamed from gsc-message-banner.ts to message-banner.ts
