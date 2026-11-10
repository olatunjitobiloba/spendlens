import { Calendar03Icon, MoneyReceive01Icon, TaskDone01Icon, Wallet01Icon } from "@hugeicons/core-free-icons";

import { Money } from "@/components/ui/money";
import { StatTile } from "@/components/ui/stat-tile";
import type { Analysis } from "@/types/api";
import { formatRange } from "@/utils/format";

const isGap = (w: string) => w.startsWith("No transactions for");

export function StatTiles({ analysis: a }: { analysis: Analysis | null }) {
  const gaps = a?.coverage_warnings.filter(isGap).length ?? 0;
  const review = a?.needs_review_count ?? 0;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        label="Spent"
        icon={Wallet01Icon}
        value={a ? <Money kobo={a.total_spent_kobo} className="font-sans" /> : null}
        caption={a ? formatRange(a.range) : "No spending recorded"}
      />
      <StatTile
        label="Money in"
        icon={MoneyReceive01Icon}
        value={a ? <Money kobo={a.total_income_kobo} className="font-sans" /> : null}
        caption={a ? "Credits this month" : "None recorded yet"}
      />
      <StatTile
        label="Coverage"
        icon={Calendar03Icon}
        value={a ? `${a.coverage.days_with_data} / ${a.coverage.days_in_range} days` : null}
        caption={!a ? "No dates yet" : gaps ? `${gaps} gap${gaps === 1 ? "" : "s"} in the data` : "No gaps found"}
      />
      <StatTile
        label="Needs review"
        icon={TaskDone01Icon}
        value={a ? review : null}
        caption={!a ? "Nothing to check yet" : review ? "Without a category" : "All categorised"}
      />
    </div>
  );
}
