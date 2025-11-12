import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import type { ShoppingListService } from "../services/item-service.js";
import "./sl-dialog-overlay.js";
import "./sl-message-banner.js";

import { translate } from "../translations/translations.js";
import { BannerMessage } from "../types.js";

export class AddItemOverlay extends LitElement {
  @property({ type: Object }) todoListService: ShoppingListService | null =
    null;
  @property({ type: String }) entityId: string = "";

  @state() open = false;
  @state() name: string = "";
  @state() barcode: string = "";
  @state() brand: string = "";
  @state() banner: BannerMessage | null = null;

  static styles = css`
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 8px 0 0 0;
    }
    label {
      font-size: 1em;
      color: var(--ha-card-text-color, var(--primary-text-color, #333));
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-weight: 500;
    }
    ha-textfield {
      width: 100%;
      box-sizing: border-box;
    }
    ha-button {
      min-width: 100px;
    }
  `;

  openDialog() {
    this.open = true;
    this.banner = null;
  }

  closeDialog() {
    this.open = false;
    this.banner = null;
  }

  async _addDevice() {
    if (!this.todoListService || !this.entityId || !this.name) {
      console.log(
        "AddItemOverlay _addDevice missing info:",
        this.entityId,
        this.name,
        this.todoListService,
      );
      this.banner = BannerMessage.error(
        "Todo list service, entity ID, and name are required.",
      );
      return;
    }
    const item = {
      name: this.name,
      barcode: this.barcode,
      brand: this.brand,
    };
    try {
      const result = await this.todoListService.addItem(
        this.name,
        this.entityId,
        item,
      );
      if (result && typeof result === "object") {
        this.banner = BannerMessage.error(
          (result as any).error?.message || "Failed to add item",
        );
        return;
      }
      this.closeDialog();
    } catch (e: any) {
      const msg = e?.message || "Failed to add item";
      console.log("AddItemOverlay _addDevice error:", msg);
      this.banner = BannerMessage.error(msg);
    }
  }

  render() {
    return html`
      <sl-dialog-overlay
        .open=${this.open}
        width="400px"
        minWidth="400px"
        maxWidth="400px"
      >
        <span slot="title"
          >${translate("add_item.title") ?? "Add Item Manually"}</span
        >
        <div class="dialog-content">
          <sl-message-banner .banner=${this.banner}></sl-message-banner>
          <ha-textfield
            label="Name"
            value=${this.name}
            @input=${(e: any) => (this.name = e.target.value)}
          ></ha-textfield>
          <ha-textfield
            label="Barcode"
            value=${this.barcode}
            @input=${(e: any) => (this.barcode = e.target.value)}
          ></ha-textfield>
          <ha-textfield
            label="Brand"
            value=${this.brand}
            @input=${(e: any) => (this.brand = e.target.value)}
          ></ha-textfield>
        </div>
        <span slot="footer">
          <ha-button type="button" @click=${() => this._addDevice()}>
            Add Item
          </ha-button>
          <ha-button type="button" @click=${() => this.closeDialog()}>
            Cancel
          </ha-button>
        </span>
      </sl-dialog-overlay>
    `;
  }
}

customElements.define("sl-add-item-overlay", AddItemOverlay);
