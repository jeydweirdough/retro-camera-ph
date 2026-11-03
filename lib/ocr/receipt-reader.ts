import { tmpdir } from "node:os";
import { createWorker } from "tesseract.js";

/** Turns a receipt image into text. Swappable for a paid OCR service later. */
export interface ReceiptReader {
  read(image: Uint8Array): Promise<string>;
}

/**
 * Free, open-source OCR. Language data downloads on first use and is
 * cached in the temp folder, so later reads in the same server are faster.
 */
export class TesseractReceiptReader implements ReceiptReader {
  async read(image: Uint8Array) {
    const worker = await createWorker("eng", undefined, { cachePath: tmpdir() });
    try {
      const { data } = await worker.recognize(Buffer.from(image));
      return data.text;
    } finally {
      await worker.terminate();
    }
  }
}
