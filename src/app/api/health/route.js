import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { redis } from "@/lib/redis/upstash";
import { logger } from "@/lib/logger/logger";

export async function GET() {
  const status = {
    firebase: "unknown",
    redis: "unknown",
    timestamp: new Date().toISOString(),
  };

  try {
    await adminDb.listCollections();
    status.firebase = "healthy";
  } catch (e) {
    status.firebase = "unhealthy";
    logger.error("Health Check: Firebase failed", e);
  }

  try {
    await redis.ping();
    status.redis = "healthy";
  } catch (e) {
    status.redis = "unhealthy";
    logger.error("Health Check: Redis failed", e);
  }

  return NextResponse.json(status);
}
