import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";

export class DialogOverlay extends LitElement {
  @property({ type: Boolean }) open = false;
  @property({ type: String }) header = "";

  @property({ type: String }) width?: string;

  @property({ type: String }) minWidth?: string;

  @property({ type: String }) maxWidth?: string;

  @property({ type: String }) maxHeight?: string;

  static styles = css`
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.32);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dialog-wrapper {
      min-width: 240px;
      width: var(--dialog-overlay-width, 80vw);
      max-width: 800px;
      max-height: 95vh;
      background: var(--ha-card-background, #fff);
      color: var(--ha-card-text-color, #222);
      border-radius: 12px;
      box-shadow: 0 6px 32px 0 rgba(0, 0, 0, 0.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: inherit;
    }
    .dialog-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px 8px 20px;
      border-bottom: 1px solid #e0e0e0;
    }
    .dialog-header-title {
      font-size: 1.1em;
      font-weight: 600;
      flex: 1 1 auto;
      color: inherit;
      margin: 0;
      padding: 0;
    }
    .dialog-header {
      font-size: 1em;
      color: #666;
      margin-left: 10px;
    }
    .dialog-content {
      padding: 16px 20px 12px 20px;
      flex: 1 1 auto;
      overflow-y: auto;
    }
    .dialog-footer {
      padding: 10px 20px 16px 20px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    @media (max-width: 600px) {
      .dialog-wrapper {
        width: 98vw;
        min-width: 0;
        max-width: 100vw;
      }
    }
  `;

  private _resizeObserver?: ResizeObserver;

  connectedCallback() {
    super.connectedCallback();
    this._resizeObserver = new ResizeObserver(() => {
      this.dispatchEvent(
        new CustomEvent("dialog-resized", { bubbles: true, composed: true }),
      );
    });
    this.updateComplete.then(() => {
      const wrapper = this.shadowRoot?.querySelector(".dialog-wrapper");
      if (wrapper) this._resizeObserver?.observe(wrapper);
    });
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    super.disconnectedCallback();
  }

  render() {
    if (!this.open) return html``;
    // Compose style string from properties or fallback to CSS defaults
    let wrapperStyle = "";
    if (this.minWidth) wrapperStyle += `min-width:${this.minWidth};`;
    if (this.width) wrapperStyle += `width:${this.width};`;
    if (this.maxWidth) wrapperStyle += `max-width:${this.maxWidth};`;
    if (this.maxHeight) wrapperStyle += `max-height:${this.maxHeight};`;
    return html`
      <div class="dialog-backdrop">
        <div class="dialog-wrapper" style="${wrapperStyle}">
          <div class="dialog-header-row">
            <span class="dialog-header-title">
              <slot name="title"></slot>
            </span>
            <span class="dialog-header">
              <slot name="header">${this.header}</slot>
            </span>
          </div>
          <div class="dialog-content">
            <slot></slot>
          </div>
          <div class="dialog-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("gsc-dialog-overlay", DialogOverlay);
