import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';

/**
 * <message-panel>
 * Displays error or success messages
 */
export class MessagePanel extends LitElement {
  @property({ type: String }) error = '';
  @property({ type: String }) success = '';

  static styles = css`
    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 12px;
      border-left: 4px solid #c62828;
      width: 100%;
      text-align: center;
    }
    .success-message {
      background: #e8f5e8;
      color: #2e7d32;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 12px;
      border-left: 4px solid #2e7d32;
      width: 100%;
      text-align: center;
    }
  `;

  render() {
    return html`
      ${this.error ? html`<div class="error-message">${this.error}</div>` : ''}
      ${this.success ? html`<div class="success-message">${this.success}</div>` : ''}
    `;
  }
}

customElements.define('sl-message-panel', MessagePanel);
