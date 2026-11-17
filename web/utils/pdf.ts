// PDF statements are unlocked in the browser with qpdf (compiled to WebAssembly),
// so the password never leaves the device. Only the unlocked file is uploaded.

/** Statements are CSV or PDF. Anything else is turned away before upload. */
export function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * True when a PDF carries an encryption dictionary. A quick local scan;
 * `unlockPdf` is the real check.
 */
export async function isEncryptedPdf(file: File): Promise<boolean> {
  // latin1 keeps one char per byte, so binary streams cannot break the scan.
  const text = new TextDecoder("latin1").decode(await file.arrayBuffer());
  return text.startsWith("%PDF-") && /\/Encrypt\s*(\d+\s+\d+\s+R|<<)/.test(text);
}

/** The password did not open the file. */
export class PdfPasswordError extends Error {
  constructor() {
    super("That password didn't open the file. Check it and try again.");
    this.name = "PdfPasswordError";
  }
}

type Qpdf = {
  callMain: (args: string[]) => number;
  FS: { writeFile: (path: string, data: Uint8Array) => void; readFile: (path: string) => Uint8Array };
};

type CreateQpdf = (opts: { locateFile: () => string }) => Promise<Qpdf>;

/**
 * A fresh qpdf instance plus everything it prints. This build binds
 * console.log/error once, while the factory runs synchronously, and ignores
 * print/printErr. Pointing console at a local buffer for that one call keeps
 * qpdf's output out of the browser console and lets us read its errors.
 */
async function createQpdf(): Promise<{ qpdf: Qpdf; output: string[] }> {
  const { default: createModule } = (await import("@neslinesli93/qpdf-wasm")) as unknown as { default: CreateQpdf };
  // Bundled and served from our own origin, never a CDN.
  const wasmUrl = new URL("@neslinesli93/qpdf-wasm/dist/qpdf.wasm", import.meta.url).href;

  const output: string[] = [];
  const { log, error } = console;
  console.log = console.error = (...args: unknown[]) => void output.push(args.join(" "));
  let pending: Promise<Qpdf>;
  try {
    pending = createModule({ locateFile: () => wasmUrl });
  } finally {
    console.log = log;
    console.error = error;
  }
  return { qpdf: await pending, output };
}

/**
 * Returns an unencrypted copy of `file`. An empty password opens files that
 * only restrict printing or copying. Throws PdfPasswordError on a wrong password.
 *
 * Each call gets its own qpdf instance, dropped when the call ends, so neither
 * the file nor the password outlives it.
 */
export async function unlockPdf(file: File, password: string): Promise<File> {
  const [{ qpdf, output }, input] = await Promise.all([createQpdf(), file.arrayBuffer()]);

  qpdf.FS.writeFile("/in.pdf", new Uint8Array(input));
  // One argument, so a password that starts with "-" can't be read as a flag.
  const code = qpdf.callMain([`--password=${password}`, "--decrypt", "/in.pdf", "/out.pdf"]);

  // 0 = done, 3 = done with warnings (common in bank PDFs). Anything else failed.
  if (code !== 0 && code !== 3) {
    if (output.some((line) => /invalid password/i.test(line))) throw new PdfPasswordError();
    throw new Error("This PDF could not be opened. It may be damaged.");
  }
  const unlocked = qpdf.FS.readFile("/out.pdf");
  return new File([unlocked.slice()], file.name, { type: "application/pdf", lastModified: file.lastModified });
}
