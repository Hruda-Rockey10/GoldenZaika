import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash"; // Import Redis

export const GET = (req) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const cacheKey = "analytics:admin:stats";

    // 1. Try Cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, data: cached, cached: true });
      }
    } catch (e) {
      console.warn("Redis GET analytics error", e);
    }

    // 2. Fetch & Calculate (Expensive Operation)
    const ordersSnapshot = await adminDb.collection("orders").get();
    let totalOrders = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;

    ordersSnapshot.forEach((doc) => {
      totalOrders++;
      const data = doc.data();
      totalRevenue += data.totalAmount || data.amount || 0;
      if (data.status === "pending" || data.status === "Food Processing") {
        pendingOrders++;
      }
    });

    const usersSnapshot = await adminDb.collection("users").get();
    const activeUsers = usersSnapshot.size;

    const data = {
      totalOrders,
      totalRevenue,
      activeUsers,
      pendingOrders,
    };

    // 3. Set Cache (10 Mins)
    // Analytics don't need to be realtime, 10 min delay is acceptable for this level of load reduction
    try {
      await redis.set(cacheKey, data, { ex: 600 });
    } catch (e) {
      console.warn("Redis SET analytics error", e);
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  }, req);
