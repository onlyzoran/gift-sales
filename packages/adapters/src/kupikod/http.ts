import {
  DEFAULT_USER_AGENT,
  KUPIKOD_RATE_LIMIT_MS,
} from "./constants";

export type FetchHtml = (url: string) => Promise<string>;

export function createRateLimitedFetch(options?: {
  userAgent?: string;
  minIntervalMs?: number;
}): FetchHtml {
  const userAgent = options?.userAgent ?? process.env.GIFT_SALES_USER_AGENT ?? DEFAULT_USER_AGENT;
  const minIntervalMs = options?.minIntervalMs ?? KUPIKOD_RATE_LIMIT_MS;
  let lastRequestAt = 0;

  return async (url: string): Promise<string> => {
    const now = Date.now();
    const waitMs = Math.max(0, minIntervalMs - (now - lastRequestAt));
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    lastRequestAt = Date.now();
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }

    return response.text();
  };
}
