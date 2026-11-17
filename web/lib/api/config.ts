// Transport settings for the SpendLens API. The browser calls the API host
// directly (CORS is allowed server side); there is no Next.js proxy in between.

import { API_URL } from "@/configs/env";

export { API_URL };

/** Every versioned route lives under this prefix. Only /health sits outside it. */
export const API_PREFIX = "/v1";

export const TIMEOUTS = {
  /** Free-tier cold starts take 30 to 50 seconds. */
  default: 60_000,
  explanation: 25_000,
  chat: 45_000,
  /** PDF statements are parsed server side and can be slow. */
  upload: 90_000,
} as const;
