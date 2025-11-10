import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { translate } from '../translations/translations.js';
import '../components/action-button.js';

/**
 * <actions-renderer>
 * Encapsulates the action buttons for barcode-card
 */
export class ActionsSection extends LitElement {
  @property({ type: Boolean }) disabled = false;

  static styles = css`
    .actions-section {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
  `;

  private _handleScan(e: Event) {
    this.dispatchEvent(new CustomEvent('scan-barcode', { bubbles: true, composed: true }));
  }
  private _handleLookup(e: Event) {
    this.dispatchEvent(new CustomEvent('lookup', { bubbles: true, composed: true }));
  }
  private _handleRefresh(e: Event) {
    this.dispatchEvent(new CustomEvent('refresh-list', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="actions-section">
        <sl-action-button
          icon="mdi:camera"
          .label="${translate('actions.scan_barcode')}"
          @action-click="${this._handleScan}"
          ?disabled="${this.disabled}"
        ></sl-action-button>
        <sl-action-button
          icon="mdi:magnify"
          .label="${translate('actions.lookup') ?? 'Lookup'}"
          outlined
          @action-click="${this._handleLookup}"
          ?disabled="${this.disabled}"
        ></sl-action-button>
        <sl-action-button
          icon="mdi:refresh"
          .label="${translate('actions.refresh')}"
          outlined
          @action-click="${this._handleRefresh}"
          ?disabled="${this.disabled}"
        ></sl-action-button>
      </div>
    `;
  }
}

customElements.define('sl-actions-section', ActionsSection);
