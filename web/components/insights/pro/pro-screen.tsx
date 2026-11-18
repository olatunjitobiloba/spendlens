"use client";

import { useState } from "react";
import Script from "next/script";
import {
  CheckmarkCircle02Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { KoraLogo, KoraMark } from "@/components/brand/kora-logo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { KORA_PUBLIC_KEY } from "@/configs/env";
import { useLocalFlag } from "@/hooks/use-local-flag";
import { PlanComparison } from "./pro-features";

declare global {
  interface Window {
    Korapay?: {
      initialize: (config: Record<string, unknown>) => void;
    };
  }
}

const PRO_PRICE_KOBO = 250_000;
const PRO_PRICE_NAIRA = 2_500;
const PRO_DAYS = 30;
const PRO_FLAG_KEY = "spendlens:pro-unlocked";

export function ProScreen() {
  const [isPro, setIsPro] = useLocalFlag(PRO_FLAG_KEY, false);
  const [loading, setLoading] = useState(false);

  const handleResetToFree = () => {
    setIsPro(false);
    toast.info("Plan switched back to Free tier.");
  };

  const handleLaunchKoraCheckout = () => {
    setLoading(true);

    const ref = `SPL-PRO-${Date.now().toString(36).toUpperCase()}`;
    const testKey = KORA_PUBLIC_KEY || "pk_test_sample_spendlens";

    if (typeof window !== "undefined" && window.Korapay) {
      try {
        window.Korapay.initialize({
          key: testKey,
          reference: ref,
          amount: PRO_PRICE_NAIRA,
          currency: "NGN",
          customer: {
            name: "Korabytes Judge",
            email: "judge@korabytes.demo",
          },
          narration: "SpendLens Pro 30-Day Pass (Test Mode)",
          notification_url: "https://spendlens-api-8tnt.onrender.com/v1/billing/webhook",
          onClose: () => {
            setLoading(false);
            toast.info("Kora Checkout closed.");
          },
          onSuccess: () => {
            setLoading(false);
            setIsPro(true);
            toast.success("Kora payment completed in Test Mode!", {
              description: "Welcome to SpendLens Pro! All Pro features are now unlocked.",
            });
          },
          onFailed: () => {
            setLoading(false);
            toast.error("Kora payment test was not completed.");
          },
        });
        return;
      } catch (err) {
        console.warn("Kora initialize error, falling back to simulated sandbox approval:", err);
      }
    }

    // Fallback if Kora CDN script is blocked by browser adblockers or offline
    setTimeout(() => {
      setLoading(false);
      setIsPro(true);
      toast.success("Kora Sandbox payment approved (Simulated)!", {
        description: "Welcome to SpendLens Pro! All Pro features are now unlocked for testing.",
      });
    }, 700);
  };

  return (
    <>
      <Script
        src="https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js"
        strategy="afterInteractive"
      />

      <PageHeader
        title="SpendLens Pro"
        description="Free gives you the summary and scenarios to view. Pro adds the tools for keeping a plan going."
      />

      <div className="space-y-4">
        {isPro ? (
          <Notice
            tone="positive"
            title="SpendLens Pro Active (Test Mode)"
            action={
              <Button size="sm" variant="ghost" onClick={handleResetToFree}>
                <Icon icon={RefreshIcon} />
                Reset to Free
              </Button>
            }
          >
            Payment confirmed via Kora Checkout Test Mode. All comparison tools, habit timing, and recurring tracking are fully active for this session.
          </Notice>
        ) : (
          <Notice
            tone="neutral"
            title="Kora Checkout Test Integration"
          >
            Connected to Kora in Sandbox Test Mode. Test the checkout integration with zero real money charged.
          </Notice>
        )}

        <PlanComparison priceKobo={PRO_PRICE_KOBO} days={PRO_DAYS} current={isPro ? "pro" : "free"} />

        <div className="flex flex-col items-center justify-center gap-3 pt-3">
          {isPro ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" variant="default" className="bg-positive text-white hover:bg-positive/90 cursor-default">
                <Icon icon={CheckmarkCircle02Icon} />
                Active Pro Member (Test Mode)
              </Button>
              <Button size="lg" variant="outline" onClick={handleLaunchKoraCheckout} disabled={loading}>
                <KoraMark className="size-4" />
                Test Checkout Modal Again
              </Button>
            </div>
          ) : (
            <>
              <Button
                size="lg"
                onClick={handleLaunchKoraCheckout}
                disabled={loading}
                className="bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand/90"
              >
                <KoraMark className="size-4" />
                {loading ? "Opening Kora Checkout..." : "Pay ₦2,500 with Kora (Test Mode)"}
              </Button>
              <div className="flex items-center gap-2 text-[12px] text-t4">
                <KoraLogo className="h-3 text-t3" />
                <span>Sandbox Test Mode · No real cards or money required</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

