import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Notice } from "@/components/ui/notice";
import type { ImportRecord } from "@/types/api";
import { formatRange } from "@/utils/format";

export function DoneView({ record }: { record: ImportRecord }) {
  return (
    <div className="space-y-3">
      <Notice tone="info" title={`${record.row_count} transactions imported`}>
        {record.date_range && <>Covering {formatRange(record.date_range)}. </>}
        Next, check anything SpendLens was unsure about.
      </Notice>
      {record.coverage_warnings.map((w) => (
        <Notice key={w} tone="warn" title="Gap in your data">
          {w}
        </Notice>
      ))}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button asChild size="lg">
          <Link href="/insights/review">
            Review transactions
            <Icon icon={ArrowRight01Icon} />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/insights">See the summary</Link>
        </Button>
      </div>
    </div>
  );
}
