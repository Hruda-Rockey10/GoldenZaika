import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash"; // Import Redis

const PRODUCTS_CACHE_KEY = "products:all";

export const GET = (req, context) =>
  apiWrapper(async (request) => {
    const { params } = context;
    const { id } = await params;
    const docSnap = await adminDb.collection("products").doc(id).get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: { id: docSnap.id, ...docSnap.data() },
    });
  }, req);

import { auditService } from "@/services/audit.service";

export const PUT = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const { params } = context;
    const { id } = await params;
    const data = await request.json();

    await adminDb
      .collection("products")
      .doc(id)
      .update({
        ...data,
        updatedAt: new Date(),
      });

    // Invalidate Cache
    try {
      await redis.del(PRODUCTS_CACHE_KEY);
    } catch (e) {
      console.warn("Redis DEL error", e);
    }

    await auditService.logAction(user.uid, "UPDATE_PRODUCT", {
      productId: id,
      updates: data,
    });

    return NextResponse.json({ success: true });
  }, req);

export const DELETE = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const { params } = context;
    const { id } = await params;
    // Soft delete
    await adminDb.collection("products").doc(id).update({
      isActive: false,
      deletedAt: new Date(),
    });

    // Invalidate Cache
    try {
      await redis.del(PRODUCTS_CACHE_KEY);
    } catch (e) {
      console.warn("Redis DEL error", e);
    }

    await auditService.logAction(user.uid, "DELETE_PRODUCT", { productId: id });

    return NextResponse.json({
      success: true,
      message: "Product soft deleted",
    });
  }, req);
