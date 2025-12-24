import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash";

const PRODUCTS_CACHE_KEY = "products:all";

// POST Restore Product
export const POST = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const { params } = context;
    const { id } = await params;

    // Restore product - set isActive to true and remove deletedAt
    await adminDb.collection("products").doc(id).update({
      isActive: true,
      deletedAt: null,
      restoredAt: new Date(),
    });

    // Invalidate Cache
    try {
      await redis.del(PRODUCTS_CACHE_KEY);
    } catch (e) {
      console.warn("Redis DEL error", e);
    }

    return NextResponse.json({
      success: true,
      message: "Product restored successfully",
    });
  }, req);
