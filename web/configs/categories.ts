// The category list the backend accepts on PATCH /v1/transactions/{id}.
// Keep in step with the API; move to an endpoint if the team adds one.
export const CATEGORIES = [
  "Rent",
  "Food and groceries",
  "Eating out",
  "Transport",
  "Utilities",
  "Subscriptions",
  "Data and airtime",
  "Health",
  "Education",
  "Shopping",
  "Transfers",
  "Other",
] as const;

/** Label for spend with no category yet. Matches the API. */
export const UNCATEGORISED = "Uncategorised";
