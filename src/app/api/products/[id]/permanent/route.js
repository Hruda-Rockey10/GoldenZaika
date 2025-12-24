import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash";
import { auditService } from "@/services/audit.service";

const PRODUCTS_CACHE_KEY = "products:all";

// DELETE Permanently
export const DELETE = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const { params } = context;
    const { id } = await params;

    // Get product details for audit log before deleting
    const productDoc = await adminDb.collection("products").doc(id).get();
    const productData = productDoc.data();

    // Hard delete - actually remove from database
    await adminDb.collection("products").doc(id).delete();

    // Invalidate Cache
    try {
      await redis.del(PRODUCTS_CACHE_KEY);
    } catch (e) {
      console.warn("Redis DEL error", e);
    }

    // Log permanent deletion
    await auditService.logAction(user.uid, "PERMANENT_DELETE_PRODUCT", {
      productId: id,
      productName: productData?.name,
    });

    return NextResponse.json({
      success: true,
      message: "Product permanently deleted",
    });
  }, req);
