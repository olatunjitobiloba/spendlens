import type { Health } from "@/types/api";
import { rootHttp } from "../client";

/** GET /health. Outside the /v1 prefix, so it uses the root instance. */
export const healthService = {
  check: (signal?: AbortSignal) => rootHttp.get<Health>("/health", { signal }).then((r) => r.data),
};
