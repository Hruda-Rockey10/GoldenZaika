import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { redis } from "@/lib/redis/upstash";
import { logger } from "@/lib/logger/logger";

import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);
  } catch (error) {
    return NextResponse.json(
      { error: "Unauthorized: Admins only" },
      { status: 401 }
    );
  }

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
