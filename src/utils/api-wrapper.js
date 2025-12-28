import { NextResponse } from "next/server";
import { logger } from "@/lib/logger/logger";
import { v4 as uuidv4 } from "uuid";
import { getRateLimiter } from "@/lib/redis/ratelimit";

export async function apiWrapper(handler, req, context) {
  const requestId = uuidv4();
  const startTime = Date.now();
  const url = new URL(req.url);
  const endpoint = url.pathname;

  // Rate Limiting Logic
  // Check for specialized routes
  let limitType = null;
  if (endpoint.includes("/api/ai")) limitType = "strict";
  if (endpoint.includes("/api/auth")) limitType = "strict";

  // Public Endpoint Protection (Spam/Brute Force)
  if (endpoint.includes("/api/messages") && req.method === "POST")
    limitType = "strict";
  if (endpoint.includes("/api/coupons/apply") && req.method === "POST")
    limitType = "strict";

  if (limitType) {
    try {
      // Use IP for now. Ideally should be User ID if logged in.
      const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
      const { success, limit, remaining, reset } = await getRateLimiter(
        limitType
      ).limit(ip);

      if (!success) {
        logger.warn(`Rate Limit Exceeded`, { ip, endpoint });
        return NextResponse.json(
          { error: "Too Many Requests", success: false, requestId },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          }
        );
      }
    } catch (e) {
      logger.error("Rate Limiter Error", e);
      // Fail open (allow request) if Redis is down
    }
  }

  // Inject requestId into headers for downstream use
  req.headers.set("x-request-id", requestId);

  try {
    const response = await handler(req, context);

    const duration = Date.now() - startTime;
    const status = response.status;

    // Attempt to get userId from header if set by middleware or verifyAuth (not standard here but good practice)
    // Or we just log the request.

    logger.info(`API Request Completed`, {
      endpoint,
      method: req.method,
      duration: `${duration}ms`,
      status,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("API Error", {
      requestId,
      endpoint,
      error: error.message,
      duration: `${duration}ms`,
    });

    const status = error.message.includes("Unauthorized")
      ? 401
      : error.message.includes("Forbidden")
      ? 403
      : 500;

    return NextResponse.json(
      {
        error: error.message || "Internal Server Error",
        success: false,
        requestId,
      },
      { status }
    );
  }
}
