import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { translate } from '../translations/translations.js';

/**
 * <quick-chips-renderer>
 * Encapsulates the quick add chips for barcode-card
 */
export class QuickChipsPanel extends LitElement {
  @property({ type: Array }) chips: string[] = [];
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) entityId: string = '';
  @property({ type: Object }) todoListService: any = null;

  static styles = css`
    .quick-chips-section {
      margin-bottom: 16px;
      width: 100%;
    }
    .section-header {
      margin-bottom: 8px;
      text-align: center;
    }
    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      width: 100%;
    }
    .quick-chip {
      background: var(--primary-color, #2196f3);
      color: white;
      border: none;
      border-radius: 16px;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .quick-chip:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  private async _handleChipClick(e: Event) {
    const target = e.currentTarget as HTMLElement;
    const productName = target.getAttribute('data-product') || target.textContent || '';
    // Optionally, you could pass barcode or count if available
    const barcode = '';
    const count = 1;
    if (this.todoListService && this.entityId && productName) {
      try {
        await this.todoListService.addItem(productName, this.entityId, { barcode, count });
        this.dispatchEvent(new CustomEvent('shopping-list-refresh', { bubbles: true, composed: true }));
      } catch (error) {
        console.error('[QuickChipsPanel] Exception when handling quick add', { error, productName, entityId: this.entityId });
      }
    } else {
      console.warn('[QuickChipsPanel] Missing todoListService, entityId, or productName', { productName, entityId: this.entityId, hasService: !!this.todoListService });
    }
  }

  render() {
    // Sort chips by total presses (from description) and show top 15
    let sortedChips = this.chips;
    if (this.todoListService && this.entityId) {
      const items = this.todoListService.hass?.states?.[this.entityId]?.attributes?.items || [];
      // Count total for each chip
      const totals = {};
      for (const item of items) {
        const name = item.name;
        const desc = item.description || '';
        let total = 1;
        const totalMatch = desc.match(/total:(\d+)/);
        if (totalMatch) total = parseInt(totalMatch[1], 10);
        totals[name] = (totals[name] || 0) + total;
      }
      sortedChips = [...this.chips].sort((a, b) => (totals[b] || 0) - (totals[a] || 0)).slice(0, 15);
    }
    return html`
      <div class="quick-chips-section">
        <div class="section-header">
          <h3>${translate('quick_add.title') ?? 'Quick Add'}</h3>
        </div>
        <div class="chips-container">
          ${sortedChips.map(item => html`
            <button class="quick-chip" data-product="${item}" @click="${(e: Event) => this._handleChipClick(e)}" ?disabled="${this.disabled}">${item}</button>
          `)}
        </div>
      </div>
    `;
  }
}

customElements.define('sl-quick-chips-panel', QuickChipsPanel);
