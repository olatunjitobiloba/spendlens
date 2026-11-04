// Synthetic sample figures used by the marketing previews. All amounts in kobo.
// They are fixed values (worked out once by hand), never calculated in the UI.

export const sampleMonth = "October 2026";

export const sampleCategories = [
  { name: "Rent", amount: 15_000_000, protected: true },
  { name: "Food and groceries", amount: 8_450_000, protected: true },
  { name: "Eating out", amount: 5_620_000, protected: false },
  { name: "Transport", amount: 4_860_000, protected: false },
  { name: "Other", amount: 4_000_000, protected: false },
  { name: "Subscriptions", amount: 1_890_000, protected: false },
  { name: "Data and airtime", amount: 1_410_000, protected: false },
] as const;

// Share of the month, in percent, used only for bar widths.
export const sampleShares: Record<string, number> = {
  Rent: 36.4,
  "Food and groceries": 20.5,
  "Eating out": 13.6,
  Transport: 11.8,
  Other: 9.7,
  Subscriptions: 4.6,
  "Data and airtime": 3.4,
};

export const sampleScenario = {
  baseline: 41_230_000,
  reduction: 2_177_000,
  result: 39_053_000,
  cuts: [
    { name: "Eating out", percent: 20, amount: 1_124_000 },
    { name: "Subscriptions", percent: 30, amount: 567_000 },
    { name: "Transport", percent: 10, amount: 486_000 },
  ],
} as const;

export const sampleProfiles = {
  customer: { name: "Tolu Adebayo", seed: "tolu-sample", detail: "Partner Bank customer · sample" },
  analyst: { name: "Kemi Okafor", seed: "kemi-sample", detail: "Product lead, Partner Bank · sample" },
} as const;
