import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash";

export const POST = (req) =>
  apiWrapper(async (request) => {
    const { code, cartTotal } = await request.json();

    if (!code) {
      throw new Error("Coupon code is required");
    }

    const cacheKey = "admin:coupons:all";
    let coupon = null;

    // 1. Try to find in Redis Cache first
    try {
      const cachedCoupons = await redis.get(cacheKey);
      if (cachedCoupons) {
        coupon = cachedCoupons.find(
          (c) => c.code === code && c.isActive === true
        );
      }
    } catch (e) {
      console.warn("Redis GET coupons error", e);
    }

    // 2. Fallback to DB if not found in cache (or cache empty)
    if (!coupon) {
      const snapshot = await adminDb
        .collection("coupons")
        .where("code", "==", code)
        .where("isActive", "==", true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new Error("Invalid or expired coupon code");
      }
      coupon = snapshot.docs[0].data();
    }

    const now = new Date();

    if (coupon.expiry && new Date(coupon.expiry) < now) {
      throw new Error("Coupon has expired");
    }

    if (coupon.minAmount && cartTotal < coupon.minAmount) {
      throw new Error(`Minimum amount of ₹${coupon.minAmount} required`);
    }

    // Calculate Discount
    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = (cartTotal * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.value;
    }

    // Ensure discount doesn't exceed total
    discountAmount = Math.min(discountAmount, cartTotal);

    return NextResponse.json({
      success: true,
      discount: discountAmount,
      couponCode: code,
      message: "Coupon applied successfully",
    });
  }, req);
