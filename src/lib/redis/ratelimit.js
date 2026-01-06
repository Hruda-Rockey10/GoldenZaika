import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Use the existing Redis URL/Token
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Create a specialized rate limiter
 * @param {'strict'|'moderate'|'loose'} type
 */
export const getRateLimiter = (type = "moderate") => {
  // type = "moderate" is default
  switch (type) {
    case "strict":
      // 15 requests per 60 seconds (For AI/Auth)
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(15, "60 s"),
        prefix: "@upstash/ratelimit:strict",
        // It looks at the last 60 seconds from right now.
        // "Have you made 15 requests between 12:00:05 and 12:01:05?"
        analytics: true,
      });
    case "loose":
      // 50 requests per 10 seconds (For Browsing)
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, "10 s"),
        prefix: "@upstash/ratelimit:loose",
        analytics: true,
      });
    case "moderate":
    default:
      // 20 requests per 60 seconds (General API)
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "60 s"),
        prefix: "@upstash/ratelimit:moderate",
        analytics: true,
      });
  }
};
