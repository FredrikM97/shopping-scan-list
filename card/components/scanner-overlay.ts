
import { loadHaComponents } from "@kipk/load-ha-components";
import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { fireEvent } from "../common";

// Add type definition if not available in DOM lib
declare global {
  interface Window {
    BarcodeDetector?: typeof BarcodeDetector;
  }

  class BarcodeDetector {
    constructor(options?: { formats?: string[] });
    detect(source: ImageBitmapSource): Promise<Array<{
      boundingBox: DOMRectReadOnly;
      rawValue: string;
      format: string;
      cornerPoints: Array<{ x: number; y: number }>;
    }>>;
    static getSupportedFormats(): Promise<string[]>;
  }
}

export class BarcodeScannerDialog extends LitElement {
  static styles = css`
    ha-dialog {
      --dialog-max-width: 480px;
    }
    video {
      width: 100%;
      border-radius: 8px;
    }
    p {
      font-size: 1.1em;
      text-align: center;
      margin-top: 8px;
    }
  `;

  @property({ type: Object }) hass?: any;
  @property({ type: Object }) barcode?: any;
  @property({ type: Object }) format?: any;
  
  @state() open = false;
  private stream: MediaStream | null = null;
  private detector: BarcodeDetector | null = null;

  
  async updated(changed: Map<string, unknown>) {
    if (changed.has("open")) {
      if (this.open) await this.startScanner();
      else this.stopScanner();
    }
  }

  public async openDialog() {
    console.log("[ScannerOverlay] openDialog called");
    this.open = true;
    if (this.open) await this.startScanner();
    this.requestUpdate();
  }


  public closeDialog() {
    console.log("[ScannerOverlay] closeDialog called");
    this.stopScanner();
    this.open = false;
    this.requestUpdate();
  }

  async startScanner() {
    console.log("[ScannerOverlay] startScanner called");
    if (!("BarcodeDetector" in window)) {
      console.error("BarcodeDetector not supported in this browser");
      return;
    }

    await this.updateComplete; // Wait for render
    const video = this.shadowRoot!.querySelector("video") as HTMLVideoElement;
    if (!video) {
      console.error("Video element not found");
      return;
    }
    this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = this.stream;
    await video.play();
    console.log("[ScannerOverlay] Video stream started");

    this.detector = new BarcodeDetector({
      formats: ["qr_code", "code_128", "ean_13", "code_39", "upc_a"],
    });

    const detectLoop = async () => {
      if (!this.open || !this.detector) return;
      try {
        const barcodes = await this.detector.detect(video);
        if (barcodes.length > 0) {
          const { rawValue, format } = barcodes[0];
          if (rawValue !== this.barcode) {
            this.barcode = rawValue;
            this.format = format;
            console.log(`[ScannerOverlay] Detected barcode: ${rawValue} (format: ${format})`);
            fireEvent(this, "barcode-detected", { detail: { value: rawValue, format } });
            this.stopScanner();
            this.closeDialog();
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }
      requestAnimationFrame(detectLoop);
    };

    detectLoop();
  }

  stopScanner() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }

  render() {
    console.log("[ScannerOverlay] render called, open:", this.open);
    return html`
      <dialog ?open=${this.open} style="z-index:10000;">
        <h2>Scan a Barcode</h2>
        <video id="video" autoplay></video>
        <p>
          ${this.barcode
            ? `Detected: ${this.barcode} (${this.format})`
            : "Point camera at barcode"}
        </p>
        <ha-button type="button" @click=${() => (this.closeDialog())}>
          Close
        </ha-button>
      </dialog>
    `;
  }
}

customElements.define("sl-scanner-overlay", BarcodeScannerDialog);
