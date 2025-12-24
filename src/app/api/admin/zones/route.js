import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { auditService } from "@/services/audit.service";
import { redis } from "@/lib/redis/upstash";

export const GET = (req) =>
  apiWrapper(async (request) => {
    // Optional: Allow public to fetch zones if needed for pincode check without auth?
    // For now, let's restrict or allow. The checkout might need to check zones publically.
    // But this is admin API. Public check should be separate or allowed here.
    // Let's assume Admin UI lists them.

    // Auth check - allow admin only for full list with details?
    // Or allow authenticated user?
    // For "Admin Zone Management", stick to Admin.
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const cacheKey = "admin:zones:all";

    // Try Redis
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, zones: cached });
      }
    } catch (e) {
      console.warn("Redis GET zones error", e);
    }

    const snapshot = await adminDb
      .collection("service_zones")
      .orderBy("createdAt", "desc")
      .get();
    const zones = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Cache (1 hour)
    try {
      await redis.set(cacheKey, zones, { ex: 3600 });
    } catch (e) {
      console.warn("Redis SET zones error", e);
    }

    return NextResponse.json({ success: true, zones });
  }, req);

export const POST = (req) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const data = await request.json();
    const { name, pincodes, deliveryFee, minOrderAmount } = data;

    if (!name || !pincodes || !Array.isArray(pincodes)) {
      throw new Error("Invalid zone data");
    }

    const docRef = await adminDb.collection("service_zones").add({
      name,
      pincodes,
      deliveryFee: Number(deliveryFee) || 0,
      minOrderAmount: Number(minOrderAmount) || 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await auditService.logAction(user.uid, "CREATE_ZONE", {
      zoneId: docRef.id,
      name,
    });

    // Invalidate Cache
    try {
      await redis.del("admin:zones:all");
    } catch (e) {
      console.warn("Redis DEL zones error", e);
    }

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Zone created",
    });
  }, req);
