import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";
import { fireEvent } from "../common";

/**
 * ActionButton - reusable button for actions in barcode-card
 * Usage:
 * <sl-action-button icon="mdi:camera" label="Scan" @action-click="..." />
 */
export class ActionButton extends LitElement {
  @property({ type: String }) icon = "";
  @property({ type: String }) label = "";
  @property({ type: Boolean }) outlined = false;
  @property({ type: Boolean }) disabled = false;

  static styles = css`
    :host {
      width: 100%;
    }
    .action-bar {
      display: flex;
      width: 100%;
    }
    ha-button {
      flex: 1 1 0;
      border-radius: 0;
      min-width: 0;
      border: none;
      background: none;
      color: var(--ha-primary-color, #1976d2);
      padding: 0 8px;
    }
    .action-bar ha-button:first-child {
      border-top-left-radius: var(--ha-card-border-radius, 12px);
      border-bottom-left-radius: var(--ha-card-border-radius, 12px);
    }
    .action-bar ha-button:last-child {
      border-top-right-radius: var(--ha-card-border-radius, 12px);
      border-bottom-right-radius: var(--ha-card-border-radius, 12px);
    }
    ha-icon {
      --mdc-icon-size: 20px;
      color: var(--ha-primary-color, #1976d2);
    }
  `;
  render() {
    return html`
      <div class="action-bar">
        <ha-button
          class="${this.outlined ? "outlined" : ""}"
          ?disabled=${this.disabled}
          @click=${(e: Event) => fireEvent(this, "action-click", { detail: e })}
        >
          <ha-icon .icon=${this.icon}></ha-icon>
          <span>${this.label}</span>
        </ha-button>
      </div>
    `;
  }
}

customElements.define("sl-action-button", ActionButton);