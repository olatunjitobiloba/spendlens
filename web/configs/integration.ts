// Script for the bank integration simulator on /banks.
// Each beat is one moment of the animation: which screen shows, where the
// cursor points, whether it taps, and what changes on screen afterwards.

export type SimScreen = "home" | "overview" | "protect" | "plan" | "saved";

export type SimState = {
  rent: boolean;
  food: boolean;
  /** Eating-out cut in percent, 0 or 20. */
  cut: number;
};

export type Beat = {
  step: number;
  screen: SimScreen;
  /** data-sim value of the element the cursor moves to. Omitted: cursor stays put. */
  target?: string;
  tap?: boolean;
  /** Changes applied once this beat starts. */
  set?: Partial<SimState>;
  ms: number;
};

export const INITIAL_STATE: SimState = { rent: false, food: false, cut: 0 };

export const BEATS: Beat[] = [
  { step: 0, screen: "home", target: "balance", ms: 1100 },
  { step: 0, screen: "home", target: "insights", ms: 1000 },
  { step: 0, screen: "home", target: "insights", tap: true, ms: 450 },
  { step: 1, screen: "overview", target: "total", ms: 1300 },
  { step: 1, screen: "overview", target: "categories", ms: 1500 },
  { step: 1, screen: "overview", target: "protect-cta", ms: 900 },
  { step: 1, screen: "overview", target: "protect-cta", tap: true, ms: 450 },
  { step: 2, screen: "protect", target: "toggle-rent", ms: 900 },
  { step: 2, screen: "protect", target: "toggle-rent", tap: true, set: { rent: true }, ms: 700 },
  { step: 2, screen: "protect", target: "toggle-food", ms: 700 },
  { step: 2, screen: "protect", target: "toggle-food", tap: true, set: { food: true }, ms: 700 },
  { step: 2, screen: "protect", target: "protect-next", ms: 800 },
  { step: 2, screen: "protect", target: "protect-next", tap: true, ms: 450 },
  { step: 3, screen: "plan", target: "slider-start", ms: 1000 },
  { step: 3, screen: "plan", target: "slider-end", set: { cut: 20 }, ms: 1400 },
  { step: 3, screen: "plan", target: "result", ms: 1500 },
  { step: 3, screen: "plan", target: "save", ms: 800 },
  { step: 3, screen: "plan", target: "save", tap: true, ms: 450 },
  { step: 4, screen: "saved", target: "saved-card", ms: 2600 },
];

/** State at a beat: every `set` up to and including it, applied in order. */
export function stateAt(index: number): SimState {
  return BEATS.slice(0, index + 1).reduce<SimState>((s, b) => ({ ...s, ...b.set }), INITIAL_STATE);
}

export const firstBeatOf = (step: number) => BEATS.findIndex((b) => b.step === step);

export const SIM_STEPS = [
  {
    title: "Add an entry point",
    description: "A tile on the home screen opens Spending insights. It sits next to Transfer and Bills, so customers find it without leaving your app.",
    endpoint: "POST /v1/imports",
  },
  {
    title: "Show where the money went",
    description: "Your app reads the month's analysis and draws it in your own colours and fonts. Every total comes from the API.",
    endpoint: "GET /v1/analysis",
  },
  {
    title: "Let customers protect bills",
    description: "Customers mark the costs they can't cut, like rent and food. No savings plan can touch a protected category.",
    endpoint: "PUT /v1/protections",
  },
  {
    title: "Test a cut on the rest",
    description: "A slider tries a percentage cut on one category. SpendLens works out the result and writes a short explanation.",
    endpoint: "POST /v1/scenarios",
  },
  {
    title: "Save the plan",
    description: "The plan is stored against the customer, ready for a savings goal, a reminder or a check-in next month.",
    endpoint: "GET /v1/scenarios",
  },
] as const;
