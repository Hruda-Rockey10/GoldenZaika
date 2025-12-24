import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash";

// DELETE Message
export const DELETE = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const { params } = context;
    const { id } = await params;
    await adminDb.collection("messages").doc(id).delete();

    // Invalidate Cache
    try {
      await redis.del("admin:messages:all");
    } catch (e) {
      console.warn("Redis DEL messages error", e);
    }

    return NextResponse.json({ success: true, message: "Message deleted" });
  }, req);

// PATCH Status
export const PATCH = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const { params } = context;
    const { id } = await params;
    const { status } = await request.json();

    await adminDb.collection("messages").doc(id).update({ status });

    // Invalidate Cache
    try {
      await redis.del("admin:messages:all");
    } catch (e) {
      console.warn("Redis DEL messages error", e);
    }

    return NextResponse.json({ success: true, message: "Status updated" });
  }, req);

// PUT Status (alias for PATCH for frontend compatibility)
export const PUT = PATCH;
