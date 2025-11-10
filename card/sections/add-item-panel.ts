import { LitElement, html, css } from 'lit';
import { ProductLookup } from '../services/product-lookup';
import { property, state } from 'lit/decorators.js';
import { translate } from '../translations/translations.js';
import { ShoppingListService } from '../services/shopping-list-service';

/**
 * <add-item-panel>
 * Centralized add-item logic for barcode, manual, and quick add
 */
export class AddItemPanel extends LitElement {
 
  
  static styles = css`
    .add-item-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      margin-bottom: 16px;
    }
    .message {
      padding: 12px 16px;
      border-radius: 8px;
      margin: 8px 0;
      font-size: 14px;
      font-weight: 500;
      width: 100%;
      text-align: center;
    }
    .error-message {
      background: #ffebee;
      color: #c62828;
    }
    .success-message {
      background: #e8f5e8;
      color: #2e7d32;
    }
  `;

  @property({ type: Object }) hass: any = null;
  @property({ type: Object }) todoListService: ShoppingListService = null;
  private productLookup: ProductLookup;
  @property({ type: String }) entityId: string = '';
  @state() private currentProduct: any = { name: '', count: 1 };
  @state() private errorMessage: string = '';
  @state() private successMessage: string = '';


  constructor() {
    super();
    console.log('[AddItemPanel] constructor called', { instance: this });
    this.productLookup = new ProductLookup();
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('barcode-scanned', (e: any) => this._onBarcodeScanned(e.detail.barcode));
    this.addEventListener('manual-add', (e: any) => {
      console.log('[AddItemPanel] manual-add event received', { input: e.detail.input });
      this._onManualAdd(e.detail.input);
    });
    this.addEventListener('confirm-add', () => {
      console.log('[AddItemPanel] confirm-add event received', { currentProduct: this.currentProduct });
      if (this.currentProduct && this.currentProduct.name) {
        this._onAddItem(this.currentProduct.name);
      } else {
        this._showError('No product selected to add.');
      }
    });
  }

  async _onBarcodeScanned(barcode: string) {
    this.currentProduct = { barcode, name: '', brand: '', source: 'scanned' };
    if (this.productLookup) {
      await this.productLookup.lookupBarcode(
        barcode,
        (product: any) => {
          this.currentProduct = product;
        },
        (barcode: string) => this._showManualAddOption(barcode)
      );
    }
  }

  async _onAddItem(productName: string) {
    console.log('[AddItemPanel] _onAddItem called', { productName, entityId: this.entityId, hasService: !!this.todoListService });
    if (!this.todoListService || !productName || !this.entityId) {
      console.warn('[AddItemPanel] Missing todoListService, entityId, or productName', { productName, entityId: this.entityId, hasService: !!this.todoListService });
      this._showError('No todo list integration or product name.');
      return;
    }
    try {
      const barcode = this.currentProduct?.barcode || '';
      const count = this.currentProduct?.count || 1;
      const description = `barcode:${barcode};count:${count}`;
      // Use ShoppingListService.addItem to handle count/total logic
      const result = await this.todoListService.addItem(productName, this.entityId, description);
      if (result) {
        this._showSuccess(`Added "${productName}" to todo list`);
        this.dispatchEvent(new CustomEvent('shopping-list-refresh', { bubbles: true, composed: true }));
        console.log('[AddItemPanel] shopping-list-refresh dispatched');
      } else {
        this._showError('Failed to add item to todo list');
      }
    } catch (error) {
      console.error('[AddItemPanel] Exception when adding item', { error, productName, entityId: this.entityId });
      this._showError('Failed to add item to todo list');
    }
  }

  async _onManualAdd(input: string) {
    if (!input) {
      this._showError(translate('errors.empty_input'));
      return;
    }
    if (/^\d{8,13}$/.test(input) && this.productLookup) {
      await this.productLookup.lookupBarcode(
        input,
        (product: any) => this._handleProductFound(product),
        (barcode: string) => this._showManualAddOption(barcode)
      );
      return;
    }
    // Add as manual item
    await this._onAddItem(input);
  }

  _handleProductFound(product: any) {
    this.currentProduct = product;
    // Do not add automatically, wait for user confirmation
  }

  _showManualAddOption(barcode: string) {
    this.currentProduct = {
      barcode: barcode,
      name: `Product ${barcode}`,
      brand: '',
      source: 'manual'
    };
  }

  _showError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
  }
  _showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
  }

  render() {
    return html`
      <div class="add-item-panel">
        ${this.errorMessage ? html`<div class="message error-message">${this.errorMessage}</div>` : ''}
        ${this.successMessage ? html`<div class="message success-message">${this.successMessage}</div>` : ''}
        <div class="input-container">
          <input
            type="text"
            class="add-item-input"
            .value="${this.currentProduct?.name || ''}"
            placeholder="${translate('add_item.placeholder') ?? 'Enter product name'}"
            @input="${(e: any) => { this.currentProduct = { ...this.currentProduct, name: e.target.value }; }}"
          >
          <input
            type="number"
            min="1"
            class="add-item-count"
            .value="${this.currentProduct?.count || 1}"
            placeholder="Count"
            @input="${(e: any) => { this.currentProduct = { ...this.currentProduct, count: Number(e.target.value) }; }}"
          >
          <button
            class="btn btn-primary"
            @click="${() => this.dispatchEvent(new CustomEvent('confirm-add', { bubbles: true, composed: true }))}"
            ?disabled="${!this.currentProduct?.name}"
          >
            <span class="btn-text">${translate('add_item.add_button') ?? 'Add'}</span>
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define('sl-add-item-panel', AddItemPanel);
