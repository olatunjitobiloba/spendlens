export const SAMPLE_CSV_URL = "/fixtures/sample-transactions.csv";

/** The synthetic sample statement as a File, ready for the import endpoints. */
export async function loadSampleFile(): Promise<File> {
  const res = await fetch(SAMPLE_CSV_URL);
  if (!res.ok) throw new Error("Could not load the sample file.");
  const blob = await res.blob();
  return new File([blob], "sample-transactions.csv", { type: "text/csv" });
}
