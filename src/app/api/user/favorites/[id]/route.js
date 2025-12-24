import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash";

export const DELETE = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    const { params } = context;
    const { id } = await params; // This is productId

    await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("favorites")
      .doc(id)
      .delete();

    // Invalidate Cache
    try {
      await redis.del(`user:${user.uid}:favorites`);
    } catch (e) {
      console.warn("Redis DEL error", e);
    }

    return NextResponse.json({
      success: true,
      message: "Removed from favorites",
    });
  }, req);
