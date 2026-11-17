/** Statements are CSV or PDF. Anything else is turned away before upload. */
export function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * True when a PDF carries an encryption dictionary, so it needs a password.
 * Reads the bytes locally; nothing leaves the browser. A false negative is
 * fine: the API answers with a password error and the dialog opens then.
 */
export async function isEncryptedPdf(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  // latin1 keeps one char per byte, so binary streams cannot break the scan.
  const text = new TextDecoder("latin1").decode(bytes);
  if (!text.startsWith("%PDF-")) return false;
  return /\/Encrypt\s*(\d+\s+\d+\s+R|<<)/.test(text);
}
