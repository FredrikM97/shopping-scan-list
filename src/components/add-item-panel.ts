import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { SHOPPING_LIST_REFRESH_EVENT } from "../const.js";
import { translate } from "../translations/translations.js";
import { ShoppingListService } from "../services/item-service.js";
import { fireEvent } from "../common.js";
import type { ShoppingListItem } from "../types.js";
import { BannerMessage } from "../types.js";
import "./sl-message-banner.js";

/**
 * <add-item-panel>
 * Centralized add-item logic for barcode, manual, and quick add
 */
export class AddItemPanel extends LitElement {
  @property({ type: Object }) todoListService: ShoppingListService = null;
  @property({ type: String }) entityId: string = "";
  @state() private inputValue: string = "";
  @state() private inputCount: number = 1;
  @state() private banner: BannerMessage | null = null;

  static styles = css`
    .add-item-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      margin-bottom: 16px;
      padding: 16px 0;
      background: var(--card-background-color, #fff);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    }
    .input-container {
      display: flex;
      flex-direction: row;
      gap: 8px;
      width: 100%;
      justify-content: center;
      align-items: center;
      margin-top: 8px;
      padding: 0 8px;
    }
    ha-button {
      height: 40px;
      align-self: center;
      /* Match the height of ha-textfield for vertical alignment */
    }
  `;

  constructor() {
    super();
  }

  public setInputValue(value: string) {
    this.inputValue = value;
  }

  async _onAddItem() {
    if (!this.todoListService || !this.inputValue || !this.entityId) {
      this.banner = BannerMessage.error("Name is required.");
      return;
    }
    try {
      const item: Partial<ShoppingListItem> = {
        name: this.inputValue,
        count: this.inputCount,
      };
      await this.todoListService.addItem(this.inputValue, this.entityId, item);
      this.closePanel();
      fireEvent(this, SHOPPING_LIST_REFRESH_EVENT);
    } catch (e: any) {
      const msg = e?.message || "Failed to add item";
      this.banner = BannerMessage.error(msg);
    }
  }

  closePanel() {
    this.inputValue = "";
    this.inputCount = 1;
    this.banner = null;
  }

  render() {
    return html`
      <div class="add-item-panel">
        <sl-message-banner .banner=${this.banner}></sl-message-banner>
        <div class="input-container">
          <ha-textfield
            label="${translate("shopping_list.add_item") ?? "Add item"}"
            .value=${this.inputValue}
            @input=${(e: any) => {
              this.inputValue = e.target.value;
              this.banner = null;
            }}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") this._onAddItem();
            }}
          ></ha-textfield>
          <ha-textfield
            label="${translate("shopping_list.count") ?? "Count"}"
            type="number"
            min="1"
            .value=${String(this.inputCount)}
            @input=${(e: any) => {
              this.inputCount = Number(e.target.value);
              this.banner = null;
            }}
            style="width: 60px;"
          ></ha-textfield>
          <ha-button @click=${this._onAddItem}>
            ${translate("shopping_list.add") ?? "Add"}
          </ha-button>
        </div>
      </div>
    `;
  }
}

customElements.define("sl-add-item-panel", AddItemPanel);
