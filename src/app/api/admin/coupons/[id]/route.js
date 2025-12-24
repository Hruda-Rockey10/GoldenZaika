import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash";

// PUT Update Coupon (Admin)
export const PUT = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const { params } = context;
    const { id } = await params;
    const data = await request.json();

    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    // Remove fields that shouldn't be in update
    delete updateData.createdAt;
    delete updateData.id;

    await adminDb.collection("coupons").doc(id).update(updateData);

    // Invalidate Cache
    try {
      await redis.del("admin:coupons:all");
    } catch (e) {
      console.warn("Redis DEL coupons error", e);
    }

    return NextResponse.json({
      success: true,
      message: "Coupon updated",
    });
  }, req);

// DELETE Coupon (Admin)
export const DELETE = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const { params } = context;
    const { id } = await params;

    await adminDb.collection("coupons").doc(id).delete();

    // Invalidate Cache
    try {
      await redis.del("admin:coupons:all");
    } catch (e) {
      console.warn("Redis DEL coupons error", e);
    }

    return NextResponse.json({
      success: true,
      message: "Coupon deleted",
    });
  }, req);
