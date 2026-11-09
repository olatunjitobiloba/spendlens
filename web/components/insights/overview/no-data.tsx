import Link from "next/link";
import { FileUploadIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";

/** First visit, or right after "Delete my data". */
export function NoData({ deleted }: { deleted: boolean }) {
  return (
    <>
      {deleted && (
        <Notice tone="positive" className="mb-4" title="Your data was deleted">
          Every import and everything worked out from it has been removed.
        </Notice>
      )}
      <PageHeader
        title="See where your money goes"
        description="Import a statement, protect your essentials, and test what a cut would actually save. Nothing is saved until you confirm."
      />
      <EmptyState
        icon={FileUploadIcon}
        title="No transactions yet"
        action={
          <>
            <Button asChild size="lg">
              <Link href="/insights/import?sample=1">Try with sample data</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/insights/import">Import a CSV</Link>
            </Button>
          </>
        }
      >
        The sample is three months of synthetic transactions. No sign-up, and no real bank details.
      </EmptyState>
    </>
  );
}
