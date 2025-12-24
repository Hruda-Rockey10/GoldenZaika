import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash";

// GET All Coupons (Admin)
export const GET = (req) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const cacheKey = "admin:coupons:all";

    // Try Redis
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, coupons: cached });
      }
    } catch (e) {
      console.warn("Redis GET coupons error", e);
    }

    const snapshot = await adminDb.collection("coupons").get();

    const coupons = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Cache (1 hour)
    try {
      await redis.set(cacheKey, coupons, { ex: 3600 });
    } catch (e) {
      console.warn("Redis SET coupons error", e);
    }

    return NextResponse.json({ success: true, coupons });
  }, req);

// POST Create Coupon (Admin)
export const POST = (req) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const data = await request.json();
    const { code, type, value, minAmount, maxDiscount, expiry, isActive } =
      data;

    if (!code || !type || value === undefined) {
      throw new Error("Missing required fields");
    }

    // Check if code already exists
    const existing = await adminDb
      .collection("coupons")
      .where("code", "==", code.toUpperCase())
      .get();

    if (!existing.empty) {
      throw new Error("Coupon code already exists");
    }

    const couponData = {
      code: code.toUpperCase(),
      type,
      value,
      minAmount: minAmount || 0,
      maxDiscount: maxDiscount || null,
      expiry: expiry || null,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("coupons").add(couponData);

    // Invalidate Cache
    try {
      await redis.del("admin:coupons:all");
    } catch (e) {
      console.warn("Redis DEL coupons error", e);
    }

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Coupon created",
    });
  }, req);
