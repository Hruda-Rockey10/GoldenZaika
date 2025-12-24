import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { auditService } from "@/services/audit.service";
import { redis } from "@/lib/redis/upstash";

export const PUT = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const { params } = context;
    const { id } = await params;
    const data = await request.json();

    await adminDb
      .collection("service_zones")
      .doc(id)
      .update({
        ...data,
        updatedAt: new Date(),
      });

    await auditService.logAction(user.uid, "UPDATE_ZONE", {
      zoneId: id,
      updates: data,
    });

    // Invalidate Cache
    try {
      await redis.del("admin:zones:all");
    } catch (e) {
      console.warn("Redis DEL zones error", e);
    }

    return NextResponse.json({ success: true, message: "Zone updated" });
  }, req);

export const DELETE = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const { params } = context;
    const { id } = await params;

    // Check if zone is used? Implementation detail. For now just delete.
    await adminDb.collection("service_zones").doc(id).delete();

    await auditService.logAction(user.uid, "DELETE_ZONE", { zoneId: id });

    // Invalidate Cache
    try {
      await redis.del("admin:zones:all");
    } catch (e) {
      console.warn("Redis DEL zones error", e);
    }

    return NextResponse.json({ success: true, message: "Zone deleted" });
  }, req);
