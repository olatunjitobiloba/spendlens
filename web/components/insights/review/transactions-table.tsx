import { BankBadge } from "@/components/ui/bank-badge";
import { Money } from "@/components/ui/money";
import { Status } from "@/components/ui/status";
import type { Transaction } from "@/types/api";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";
import { CategorySelect } from "./category-select";

function StateLabel({ t }: { t: Transaction }) {
  if (t.review_state === "duplicate") return <Status tone="neutral">Same payment, not counted</Status>;
  if (t.review_state === "needs_review" || (!t.category && t.direction === "debit"))
    return <Status tone="warn">Needs review</Status>;
  if (t.review_state === "corrected") return <Status tone="positive">Corrected</Status>;
  return (
    <Status tone="neutral" className="text-foreground/80">
      No status
    </Status>
  );
}

export function TransactionsTable({
  items,
  dimmed,
  onSaved,
}: {
  items: Transaction[];
  dimmed: boolean;
  onSaved: (t: Transaction) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" tabIndex={0} aria-label="Transactions table">
      <table className={cn("w-full min-w-190 text-left text-[13px]", dimmed && "opacity-60")}>
        <thead className="text-t3">
          <tr className="border-b border-line">
            <th scope="col" className="py-2 pr-3 font-medium">Date</th>
            <th scope="col" className="py-2 pr-3 font-medium">Bank</th>
            <th scope="col" className="py-2 pr-3 font-medium">Description</th>
            <th scope="col" className="py-2 pr-3 font-medium">Category</th>
            <th scope="col" className="py-2 pr-3 font-medium">Status</th>
            <th scope="col" className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((t) => (
            <tr key={t.id} className={cn(t.review_state === "duplicate" && "text-t4")}>
              <td className="py-2 pr-3 whitespace-nowrap text-t3">
                {formatDate(t.date, { day: "numeric", month: "short" })}
              </td>
              <td className="py-2 pr-3 text-[12.5px] text-t2">
                <BankBadge bank={t.bank} />
              </td>
              <td className="py-2 pr-3">
                {/* Rendered as text, never HTML (technical doc §13). */}
                <span className="block max-w-[18rem] truncate">{t.description}</span>
                <span className="block text-[11.5px] text-t4">{t.account}</span>
              </td>
              <td className="py-2 pr-3">
                <CategorySelect t={t} onSaved={onSaved} />
              </td>
              <td className="py-2 pr-3">
                <StateLabel t={t} />
              </td>
              <td
                className={cn(
                  "py-2 text-right whitespace-nowrap font-mono tabular-nums",
                  t.review_state !== "duplicate" && (t.direction === "credit" ? "text-positive" : "text-destructive"),
                )}
              >
                {t.direction === "credit" ? "+" : "−"}
                <span className="sr-only">{t.direction === "credit" ? "money in " : "money out "}</span>
                <Money kobo={t.amount_kobo} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
