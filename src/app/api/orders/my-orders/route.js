import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash"; // Import Redis

export const GET = (req) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);

    const cacheKey = `orders:user:${user.uid}`;

    // 1. Try Cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({
          success: true,
          orders: cached,
          cached: true,
        });
      }
    } catch (e) {
      console.warn("Redis GET error", e);
    }

    // 2. Fetch from DB
    const snapshot = await adminDb
      .collection("orders")
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // 3. Set Cache (5 mins)
    // Short TTL because order status updates are important
    try {
      await redis.set(cacheKey, orders, { ex: 300 });
    } catch (e) {
      console.warn("Redis SET error", e);
    }

    return NextResponse.json({ success: true, orders });
  }, req);
