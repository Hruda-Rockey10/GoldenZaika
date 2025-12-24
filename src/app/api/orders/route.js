import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { logger } from "@/lib/logger/logger";
import { redis } from "@/lib/redis/upstash";

export const GET = (req) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const cacheKey = "admin:orders:all";

    // Try Redis
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, orders: cached });
      }
    } catch (e) {
      console.warn("Redis GET orders error", e);
    }

    const snapshot = await adminDb
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Cache (5 mins)
    try {
      await redis.set(cacheKey, orders, { ex: 300 });
    } catch (e) {
      console.warn("Redis SET orders error", e);
    }

    return NextResponse.json({ success: true, orders });
  }, req);

export const POST = (req) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    const data = await request.json();

    if (!data.items || data.items.length === 0) {
      throw new Error("Order items required");
    }

    const orderData = {
      userId: user.uid,
      items: data.items,
      totalAmount: data.totalAmount,
      status: "pending", // pending, paid, processing, completed, cancelled
      paymentStatus: "pending",
      shippingAddress: data.shippingAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("orders").add(orderData);
    logger.info(`Order created: ${docRef.id} by user ${user.uid}`);

    // Invalidate User Cache
    try {
      await redis.del(`orders:user:${user.uid}`);
    } catch (e) {
      console.warn("Redis DEL error", e);
    }

    // Invalidate Admin Cache
    try {
      await redis.del("admin:orders:all");
    } catch (e) {
      console.warn("Redis DEL admin orders error", e);
    }

    return NextResponse.json({ success: true, id: docRef.id });
  }, req);
