import { loadHaComponents } from "@kipk/load-ha-components";
import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { fireEvent } from "../common";
import { BannerMessage } from "../types";
import "./sl-message-banner";
import { ProductLookup } from "../services/product-service";
import { SUPPORTED_BARCODE_FORMATS } from "../const";
import "./sl-dialog-overlay";

// Add type definition if not available in DOM lib
declare global {
  interface Window {
    BarcodeDetector?: typeof BarcodeDetector;
  }

  class BarcodeDetector {
    constructor(options?: { formats?: string[] });
    detect(source: ImageBitmapSource): Promise<
      Array<{
        boundingBox: DOMRectReadOnly;
        rawValue: string;
        format: string;
        cornerPoints: Array<{ x: number; y: number }>;
      }>
    >;
    static getSupportedFormats(): Promise<string[]>;
  }
}

export class BarcodeScannerDialog extends LitElement {
  private video: HTMLVideoElement | null = null;
  private detector: BarcodeDetector | null = null;
  @state() open = false;
  @state() scanState = { barcode: "", format: "" };
  @state() editState = { name: "", brand: "", barcode: "" };
  @state() apiProduct = null;
  @state() banner: BannerMessage | null = null;

  @property({ type: Object }) serviceState = {
    hass: null,
    todoListService: null,
    entityId: "",
    productLookup: null,
  };

  static styles = css`
    .video-container {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
      margin-right: auto;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: var(--ha-card-border-radius, 8px);
      display: block;
    }
    .button-row {
      display: flex;
      flex-direction: row;
      gap: 12px;
      margin-top: 16px;
      justify-content: center;
    }
    .scanner-inputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 18px 0 0 0;
      align-items: stretch;
    }
    .scanner-inputs ha-textfield {
      width: 100%;
      box-sizing: border-box;
    }
    .scanner-inputs label {
      font-size: 1em;
      color: var(--ha-card-text-color, var(--primary-text-color, #333));
      font-weight: 500;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .scanner-inputs input[type="text"] {
      font-size: 1em;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1.5px solid var(--ha-primary-color, #2196f3);
      background: var(--ha-card-background, var(--card-background-color, #fff));
      color: var(--ha-card-text-color, var(--primary-text-color, #333));
      outline: none;
      transition: border-color 0.18s;
      margin-top: 2px;
    }
    .scanner-inputs input[type="text"]:focus {
      border-color: var(--ha-secondary-color, #1976d2);
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.08);
    }
  `;

  constructor() {
    super();
  }

  createEditProduct(product, barcode) {
    return {
      name: product && product.name ? product.name : "",
      brand: product && product.brand ? product.brand : "",
      barcode: product && product.barcode ? product.barcode : barcode,
    };
  }

  async updated(changed: Map<string, unknown>) {
    if (changed.has("serviceState")) {
      // Defensive: ensure required fields are present
      if (!this.serviceState.todoListService) {
        console.error(
          "[ScannerOverlay] todoListService is null, cannot add item",
        );
      }
      if (!this.serviceState.entityId) {
        console.error("[ScannerOverlay] entityId is null, cannot add item");
      }
      if (!this.serviceState.productLookup) {
        this.serviceState.productLookup = new ProductLookup();
      }
    }
    if (changed.has("open")) {
      if (this.open) await this.startScanner();
      else await this.stopScanner();
    }
  }

  public async openDialog() {
    // Reset state to clear previous scan
    this.scanState = { barcode: "", format: "" };
    this.editState = { name: "", brand: "", barcode: "" };
    this.apiProduct = null;
    this.open = true;
    if (this.open) await this.startScanner();
  }

  public closeDialog() {
    this.stopScanner();
    this.open = false;
  }

  async startScanner() {
    if (!("BarcodeDetector" in window)) {
      console.error("BarcodeDetector not supported in this browser");
      return;
    }
    await this.updateComplete;
    this.video = this.shadowRoot!.querySelector("video") as HTMLVideoElement;
    if (!this.video) {
      console.error("Video element not found");
      return;
    }
    this.video.srcObject = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    try {
      await this.video.play();
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Video play failed", err);
      }
    }
    this.detector = new BarcodeDetector({ formats: SUPPORTED_BARCODE_FORMATS });
    this.detectLoop();
  }

  private async handleBarcode(barcode: string, format: string) {
    this.scanState = { barcode, format };
    try {
      await this.serviceState.productLookup.lookupBarcode(
        barcode,
        (product: any) => {
          this.apiProduct = product;
          this.editState = this.createEditProduct(product, barcode);
        },
        () => {
          this.apiProduct = null;
          this.editState = this.createEditProduct(null, barcode);
        },
      );
    } catch (err) {
      console.error("Product lookup failed", err);
    }
    this.stopScanner();
  }

  private detectLoop = async () => {
    if (!this.open || !this.detector) return;
    try {
      if (this.video.readyState < 2 || !this.video.srcObject) {
        requestAnimationFrame(this.detectLoop);
        return;
      }
      const barcodes = await this.detector.detect(this.video);
      if (!barcodes.length) {
        requestAnimationFrame(this.detectLoop);
        return;
      }
      const { rawValue, format } = barcodes[0];
      if (rawValue === this.scanState.barcode) {
        requestAnimationFrame(this.detectLoop);
        return;
      }
      await this.handleBarcode(rawValue, format);
    } catch (err) {
      console.error("Barcode detection failed", err);
      requestAnimationFrame(this.detectLoop);
    }
  };

  private async _addToList() {
    if (!this.editState.name || !this.editState.brand) {
      this.banner = BannerMessage.error("Name and brand are required.");
      return;
    }
    if (!this.serviceState.todoListService || !this.serviceState.entityId) {
      this.banner = BannerMessage.error("Service or entity ID missing.");
      return;
    }
    try {
      const result = await this.serviceState.todoListService.addItem(
        this.editState.name,
        this.serviceState.entityId,
        this.editState,
      );
      // Item added to todo list
      this.closeDialog();
    } catch (e: any) {
      const msg = e?.message || "Failed to add item";
      this.banner = BannerMessage.error(msg);
    }
  }

  stopScanner() {
    if (this.video && this.video.srcObject) {
      this.video.pause();
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      this.video.srcObject = null;
    }
  }

  // --- Render helpers ---

  private renderVideoView() {
    return html`
      <span slot="title">Scan a Barcode</span>
      <span slot="header"></span>
      <p>Point camera at barcode</p>
      <div class="video-container">
        <video id="video" muted autoplay></video>
      </div>
      <span slot="footer">
        <ha-button type="button" @click=${() => this.closeDialog()}>
          Close
        </ha-button>
      </span>
    `;
  }

  private renderBarcodeInfoView() {
    return html`
      <span slot="title">Product Details</span>
      <span slot="header"
        >Detected: ${this.scanState.barcode} (${this.scanState.format})</span
      >

      <div class="scanner-inputs">
        <ha-textfield
          label="Name"
          value=${this.editState.name}
          @input=${(e: any) => {
            this.editState = { ...this.editState, name: e.target.value };
            this.banner = null;
          }}
        ></ha-textfield>
        <ha-textfield
          label="Brand"
          value=${this.editState.brand}
          @input=${(e: any) => {
            this.editState = { ...this.editState, brand: e.target.value };
            this.banner = null;
          }}
        ></ha-textfield>
      </div>

      <span slot="footer">
        <ha-button type="button" @click=${() => this._addToList()}>
          Add to List
        </ha-button>
        <ha-button type="button" @click=${() => this.closeDialog()}>
          Close
        </ha-button>
      </span>
    `;
  }

  render() {
    const isBarcodeDetected = !!this.scanState.barcode;
    const view = isBarcodeDetected
      ? this.renderBarcodeInfoView()
      : this.renderVideoView();
    return html`
      <sl-dialog-overlay
        .open=${this.open}
        width="400px"
        minWidth="400px"
        maxWidth="400px"
      >
        <sl-message-banner .banner=${this.banner}></sl-message-banner>
        ${view}
      </sl-dialog-overlay>
    `;
  }
}

customElements.define("sl-scanner-overlay", BarcodeScannerDialog);
