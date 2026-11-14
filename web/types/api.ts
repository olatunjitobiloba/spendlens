// API shapes for the SpendLens module. Written by hand from the frontend
// technical doc and ai/schemas.py until the backend OpenAPI file lands.
// Money is integer kobo everywhere. The UI only displays these values.

export type DateRange = { start: string; end: string };

export type Direction = "debit" | "credit";
export type ReviewState = "ok" | "needs_review" | "corrected" | "duplicate";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount_kobo: number;
  direction: Direction;
  account: string;
  /** Bank slug, name or CBN code (see configs/banks.ts). Null when unknown. */
  bank?: string | null;
  category: string | null;
  review_state: ReviewState;
  import_id: string;
};

export type Page<T> = { items: T[]; total: number; page: number; page_size: number };

export type TransactionQuery = {
  page?: number;
  page_size?: number;
  category?: string;
  review_state?: ReviewState;
  q?: string;
  ids?: string[];
  start?: string;
  end?: string;
};

// Imports

export type RowError = { line: number; message: string };

export type ImportPreview = {
  filename: string;
  row_count: number;
  valid_count: number;
  date_range: DateRange | null;
  accounts: string[];
  errors: RowError[];
  sample_rows: Omit<Transaction, "id" | "review_state" | "import_id">[];
  coverage_warnings: string[];
};

export type ImportRecord = {
  id: string;
  filename: string;
  row_count: number;
  date_range: DateRange | null;
  created_at: string;
  coverage_warnings: string[];
};

// Analysis

export type CategoryTotal = {
  category: string;
  total_kobo: number;
  /** Share of spend, one decimal. Used for bar widths only. */
  share_pct: number;
  txn_count: number;
  protected: boolean;
};

export type CategoryChange = {
  category: string;
  current_kobo: number;
  previous_kobo: number;
  change_kobo: number;
  /** null when the previous month had no spend in this category. */
  change_pct: number | null;
};

export type Comparison = {
  previous_range: DateRange;
  previous_total_kobo: number;
  change_kobo: number;
  categories: CategoryChange[];
};

export type ReconciliationCandidate = {
  id: string;
  reason: string;
  a: Transaction;
  b: Transaction;
};

export type MonthTotal = {
  month: string; // "2026-10"
  total_kobo: number;
  /** Height against the largest month, one decimal. For bar heights only. */
  pct_of_max: number;
};

export type Analysis = {
  range: DateRange;
  data_range: DateRange | null;
  available_months: string[]; // "2026-10"
  /** Spend per month across all data, oldest first. */
  monthly_totals: MonthTotal[];
  total_spent_kobo: number;
  total_income_kobo: number;
  txn_count: number;
  categories: CategoryTotal[];
  coverage: { days_with_data: number; days_in_range: number };
  coverage_warnings: string[];
  needs_review_count: number;
  reconciliation_candidates: ReconciliationCandidate[];
  imports: ImportRecord[];
  comparison: Comparison | null;
};

// Plan

export type Protections = { categories: string[] };

export type ScenarioCut = { category: string; percent: number };

export type ScenarioRequest = {
  range: DateRange;
  cuts: ScenarioCut[];
  save?: boolean;
  name?: string;
};

/** Mirrors ai/schemas.py ScenarioResult, plus id and saved metadata. */
export type Scenario = {
  id: string;
  data_revision: string;
  range: DateRange;
  baseline_kobo: number;
  categories: { category: string; total_kobo: number; percent: number; reduction_kobo: number }[];
  total_reduction_kobo: number;
  remaining_kobo: number;
  protected_categories: string[];
  coverage_warnings: string[];
  evidence_txn_ids: string[];
  saved: boolean;
  name: string | null;
  created_at: string;
};

export type Explanation = {
  text: string;
  numbers_used: number[];
  source: "model" | "template";
};

// Account and billing

export type Me = {
  plan: "free" | "pro";
  pro_expires_at: string | null;
  pro_price_kobo: number;
  pro_days: number;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "underpaid"
  | "overpaid"
  | "failed"
  | "cancelled"
  | "expired";

export type Order = {
  id: string;
  reference: string;
  /** As the backend hands it to Kora. The backend owns the unit. */
  amount: number;
  /** Always kobo, for display. */
  amount_kobo: number;
  amount_paid_kobo: number | null;
  currency: "NGN";
  notification_url: string;
  status: OrderStatus;
};

// Forecast and recurring (v2)

export type ForecastRow = {
  category: string;
  point_kobo: number | null;
  low_kobo: number | null;
  high_kobo: number | null;
  method: string;
  months_of_data: number;
  abstained: boolean;
  reason: string | null;
};

export type Forecast = { month: string; categories: ForecastRow[] };

export type RecurringCandidate = {
  merchant_key: string;
  amount_kobo: number;
  period_days: number;
  next_due: string;
  occurrences: number;
  confidence: number;
  category: string | null;
  txn_ids: string[];
};

export type Health = { status: "ok" | "degraded"; database: "ok" | "down" };

export type GoalInput = {
  goal_name: string;
  target_kobo: number;
  saved_kobo: number;
  monthly_saving_kobo: number;
  annual_rate_pct?: number;
};

export type GoalProjection = {
  goal_name: string;
  months_to_goal: number | null;
  final_balance_kobo: number;
  annual_rate_pct: number;
  note: string;
};

// Chat

export type ChatRole = "user" | "assistant";

/** One prior turn sent back for context. The API keeps the last six. */
export type ChatTurn = { role: ChatRole; text: string };

export type ChatRequest = { message: string; history: ChatTurn[] };

export type ChatReply = {
  answer: string;
  /** "refusal" when the model could not ground an answer in the user's figures. */
  source: "model" | "refusal";
  tool_calls: number;
};

export type Transcription = { text: string };
