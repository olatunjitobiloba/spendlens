"use client";

import { Status } from "@/components/ui/status";
import { useMe } from "@/providers/me-provider";
import { formatDate } from "@/utils/format";

export function PlanBadge() {
  const { data } = useMe();
  if (!data) return null;
  if (data.plan !== "pro") return <Status tone="neutral">Free plan</Status>;
  const until = data.pro_expires_at ? ` until ${formatDate(data.pro_expires_at, { day: "numeric", month: "short" })}` : "";
  return <Status tone="brand">Pro{until}</Status>;
}
