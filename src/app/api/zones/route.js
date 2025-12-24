import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash";

// GET All Zones (Public - for delivery validation)
export const GET = (req) =>
  apiWrapper(async (request) => {
    const cacheKey = "admin:zones:all"; // Reuse Admin Cache Key

    // 1. Try Redis
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({
          success: true,
          zones: cached,
          cached: true,
        });
      }
    } catch (e) {
      console.warn("Redis GET zones error", e);
    }

    const snapshot = await adminDb
      .collection("service_zones")
      .where("isActive", "==", true)
      .get();

    const zones = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 2. Cache (1 hour) - If missed in admin cache, populate it here too
    try {
      await redis.set(cacheKey, zones, { ex: 3600 });
    } catch (e) {
      console.warn("Redis SET zones error", e);
    }

    return NextResponse.json({ success: true, zones });
  }, req);
