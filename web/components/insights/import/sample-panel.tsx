import { Download04Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import { SAMPLE_CSV_URL } from "@/lib/sample";

export function SamplePanel({ onUseSample, busy }: { onUseSample: () => void; busy: boolean }) {
  return (
    <Section title="No file handy?">
      <p className="text-[13.5px] text-t3">
        Use three months of synthetic transactions. It goes through the same checks as a real file.
      </p>
      <Button className="mt-4 w-full" onClick={onUseSample} disabled={busy}>
        Try with sample data
      </Button>
      <h3 className="mt-6 text-[13px] font-[600]">File format</h3>
      <p className="mt-1 text-[13px] text-t3">One row per transaction, with a header row:</p>
      <code className="mt-2 block overflow-x-auto rounded-lg bg-panel-raised px-3 py-2 font-mono text-[11.5px] text-t2">
        date,description,amount_kobo,direction,account
      </code>
      <p className="mt-2 text-[12.5px] text-t3">
        Dates as YYYY-MM-DD. Amounts in whole kobo (<Money kobo={150000} /> is 150000). Direction is debit or credit.
      </p>
      <a
        href={SAMPLE_CSV_URL}
        download
        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary underline-offset-4 hover:underline"
      >
        <Icon icon={Download04Icon} />
        Download the sample CSV
      </a>
    </Section>
  );
}
