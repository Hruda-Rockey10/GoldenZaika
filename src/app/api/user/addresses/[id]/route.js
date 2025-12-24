import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash";

export const PUT = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    const { params } = context;
    const { id } = await params;
    const data = await request.json();

    const addressRef = adminDb
      .collection("users")
      .doc(user.uid)
      .collection("addresses")
      .doc(id);
    const doc = await addressRef.get();

    if (!doc.exists) {
      throw new Error("Address not found");
    }

    const batch = adminDb.batch();

    if (data.isDefault) {
      // Unset others
      const existingDefaults = await adminDb
        .collection("users")
        .doc(user.uid)
        .collection("addresses")
        .where("isDefault", "==", true)
        .get();

      existingDefaults.forEach((d) => {
        if (d.id !== id) {
          batch.update(d.ref, { isDefault: false });
        }
      });
    }

    batch.update(addressRef, {
      ...data,
      updatedAt: new Date(),
    });

    await batch.commit();

    // Invalidate Cache
    try {
      await redis.del(`user:${user.uid}:addresses`);
    } catch (e) {
      console.warn("Redis DEL error", e);
    }

    return NextResponse.json({ success: true, message: "Address updated" });
  }, req);

export const DELETE = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    const { params } = context;
    const { id } = await params;

    await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("addresses")
      .doc(id)
      .delete();

    // Invalidate Cache
    try {
      await redis.del(`user:${user.uid}:addresses`);
    } catch (e) {
      console.warn("Redis DEL error", e);
    }

    return NextResponse.json({ success: true, message: "Address deleted" });
  }, req);
