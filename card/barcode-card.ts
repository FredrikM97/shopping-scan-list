import './barcode-card-editor';
/**
 * Shopping List Barcode Card
 * Clean, modular implementation with separated concerns
 */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ProductLookup } from './services/product-lookup';
import { ShoppingListService } from './services/shopping-list-service';
import './sections/actions-section';
import './sections/quick-chips-panel';
import './components/scanner-overlay';
import { AddItemPanel } from './sections/add-item-panel';
import type { BarcodeCardConfig, Product } from './types';

@customElement('barcode-card')
export class BarcodeCard extends LitElement {
    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('add-item', (e: CustomEvent) => this._handleAddItem(e));
    }
    set hass(hass: any) {
        this._hass = hass;
        this.todoListService = new ShoppingListService(hass);
        this.requestUpdate();
    }
    

    static styles = css`
        .card-container {
            background: var(--card-background-color, #fff);
            border-radius: 12px;
            padding: 0;
            box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.1));
            color: var(--primary-text-color, #333);
            font-family: var(--paper-font-body1_-_font-family, system-ui);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
        }
        @media (max-width: 600px) {
            .card-container {
                padding: 12px;
            }
        }
    `;

    
    @property({ type: Object }) config?: BarcodeCardConfig;
    @state() isLoading: boolean = false;
    @state() currentProduct: Product | null = null;

    productLookup: ProductLookup | null = null;
    todoListService: ShoppingListService | null = null;
    private _hass: any | null = null;

    constructor() {
        super();
        this.productLookup = new ProductLookup();
    this.todoListService = new ShoppingListService(this._hass);
    }

    setConfig(config: BarcodeCardConfig) {
        this.config = config;
    }

    static getConfigElement() {
        return document.createElement('barcode-card-editor');
    }

    render() {
        return html`
            <div class="card-container">
                <!-- Scanner Overlay -->
                <sl-scanner-overlay></sl-scanner-overlay>
                <!-- Actions Section -->
                <sl-actions-section
                    .disabled="${this.isLoading}"
                    @scan-barcode="${() => this.dispatchEvent(new CustomEvent('enable-scanner', { bubbles: true, composed: true }))}"
                ></sl-actions-section>

                <!-- Add Item Panel (handles both manual and barcode input) -->
                <sl-add-item-panel
                    .entityId="${this.config?.entity}"
                    .todoListService="${this.todoListService}"
                ></sl-add-item-panel>

                <!-- Quick Chips Section -->
                <sl-quick-chips-panel
                    .chips="${['Milk', 'Bread', 'Eggs', 'Butter', 'Cheese']}"
                    .entityId="${this.config?.entity}"
                    .todoListService="${this.todoListService}"
                ></sl-quick-chips-panel>

                <!-- Shopping List Section -->
                <sl-shopping-list
                    .listManager="${this.todoListService}"
                    .entityId="${this.config?.entity}"
                    .disabled="${this.isLoading}"
                ></sl-shopping-list>
            </div>
        `;
    }

    async _handleAddItem(e: CustomEvent) {
        const { productName, entityId, description } = e.detail;
        if (this.todoListService && productName && entityId) {
            await this.todoListService.addItem(productName, entityId, description);
        }
    }
    }
