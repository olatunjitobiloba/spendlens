import type { Metadata } from "next";

import { IntegrationSimulator } from "@/components/integration/integration-simulator";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { BANK_APPS } from "@/configs/bank-apps";

export const metadata: Metadata = { title: "Bank integration" };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Bank integration"
        description={`Pick a phone and any of ${BANK_APPS.length} Nigerian banks to see SpendLens inside its app.`}
      />
      <Notice tone="info" className="mt-4" title="Illustrative simulation">
        Shows how a bank could embed the SpendLens API in its app, using synthetic data. SpendLens is not affiliated with or endorsed by any financial institution shown.
      </Notice>
      <div className="mt-8">
        <IntegrationSimulator />
      </div>
    </>
  );
}
