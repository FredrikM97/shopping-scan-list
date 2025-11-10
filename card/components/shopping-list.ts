import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { translate } from '../translations/translations.js';

/**
 * <shopping-list>
 * Self-contained shopping list component
 */
export class ShoppingList extends LitElement {
  @property({ type: Object }) listManager: any = null;
  @property({ type: String }) entityId: string = '';
  @property({ type: Boolean }) disabled = false;

  @state() private items: any[] = [];
  @state() private errorMessage: string = '';
  @state() private successMessage: string = '';

    updated(changedProps: Map<string, any>) {
      super.updated(changedProps);
      console.log('[ShoppingList] updated', {
        entityId: this.entityId,
        listManager: this.listManager,
        items: this.items,
        errorMessage: this.errorMessage,
        successMessage: this.successMessage,
        changedProps: Array.from(changedProps.entries())
      });
    }

  static styles = css`
    .shopping-list {
      padding: 20px;
      background: var(--card-background-color, #fff);
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      margin-top: 16px;
    }
    .list-header {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 16px;
      width: 100%;
    }
    .list-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--primary-text-color, #333);
      text-align: center;
    }
    .list-items {
      display: flex;
      flex-direction: column;
      gap: 1px;
      background: var(--divider-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
      width: 100%;
    }
    .list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: var(--card-background-color, #fff);
      transition: background-color 0.2s ease;
      width: 100%;
    }
    .item-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }
    .item-checkbox {
      width: 20px;
      height: 20px;
      accent-color: var(--primary-color, #2196f3);
      cursor: pointer;
    }
    .item-name {
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text-color, #333);
      transition: all 0.2s ease;
    }
    .item-name.completed {
      text-decoration: line-through;
      opacity: 0.6;
      color: var(--secondary-text-color, #666);
    }
    .item-actions {
      display: flex;
      gap: 8px;
    }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--divider-color, #e0e0e0);
      color: var(--secondary-text-color, #666);
      padding: 8px;
      font-size: 12px;
      border-radius: 4px;
      min-width: auto;
      cursor: pointer;
    }
    .btn-outline:hover {
      background: var(--error-color-light, #ffebee);
      border-color: var(--error-color, #f44336);
      color: var(--error-color, #f44336);
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


  connectedCallback() {
    super.connectedCallback();
    this._refreshShoppingList();
    this.addEventListener('shopping-list-refresh', () => this.refresh());
  }

  public refresh() {
    this._refreshShoppingList();
  }

  async _refreshShoppingList() {
    if (!this.listManager || !this.entityId) return;
    try {
      const items = await this.listManager.getItems(this.entityId);
      this.items = items;
    } catch (e) {
      this._showError(translate('errors.list_load_failed'));
    }
  }

  async _toggleItem(itemId: string) {
    if (!this.listManager || !this.entityId) return;
    try {
      await this.listManager.toggleComplete(itemId, this.entityId);
      await this._refreshShoppingList();
    } catch (error) {
      this._showError(translate('errors.item_update_failed'));
    }
  }

  async _removeItem(itemId: string) {
    if (!this.listManager || !this.entityId) return;
    try {
      await this.listManager.removeItem(itemId, this.entityId);
      await this._refreshShoppingList();
      this._showSuccess(translate('success.item_removed'));
    } catch (error) {
      this._showError(translate('errors.item_remove_failed'));
    }
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
      <div class="shopping-list">
        <div class="list-header">
          <h3>${translate('shopping_list.title') ?? 'Shopping List'}</h3>
        </div>
        ${this.errorMessage ? html`<div class="message error-message">${this.errorMessage}</div>` : ''}
        ${this.successMessage ? html`<div class="message success-message">${this.successMessage}</div>` : ''}
        <div class="list-items">
          ${((this.items && this.items.length > 0) ? this.items : [
            { id: '1', name: 'Milk', completed: false },
            { id: '2', name: 'Bread', completed: false },
            { id: '3', name: 'Eggs', completed: true }
          ]).map((item: any) => html`
            <div class="list-item">
              <div class="item-content">
                <input type="checkbox" class="item-checkbox" .checked="${item.completed}" @change="${() => this._toggleItem(item.id)}" ?disabled="${this.disabled}">
                <span class="item-name${item.completed ? ' completed' : ''}">${item.name}</span>
              </div>
              <div class="item-actions">
                <button class="btn-outline" @click="${() => this._removeItem(item.id)}" title="Remove item" ?disabled="${this.disabled}">
                  <ha-icon icon="mdi:delete"></ha-icon>
                </button>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

customElements.define('sl-shopping-list', ShoppingList);
