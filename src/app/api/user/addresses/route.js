import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash";

export const GET = (req) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    const cacheKey = `user:${user.uid}:addresses`;

    // Try Redis
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, addresses: cached });
      }
    } catch (e) {
      console.warn("Redis GET error", e);
    }

    const snapshot = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("addresses")
      .get();

    // Sort in-memory (small collection, no index needed)
    const addresses = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA; // Newest first
      });

    // Cache in Redis (1 hour)
    try {
      await redis.set(cacheKey, addresses, { ex: 3600 });
    } catch (e) {
      console.warn("Redis SET error", e);
    }

    return NextResponse.json({ success: true, addresses });
  }, req);

export const POST = (req) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    const data = await request.json();
    const { label, street, city, state, zip, phone, isDefault } = data;

    if (!street || !city || !zip || !phone) {
      throw new Error("Missing required fields");
    }

    const addressData = {
      label: label || "Home",
      street,
      city,
      state: state || "",
      zip,
      phone,
      isDefault: !!isDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const batch = adminDb.batch();
    const newAddressRef = adminDb
      .collection("users")
      .doc(user.uid)
      .collection("addresses")
      .doc();

    if (isDefault) {
      const existingDefaults = await adminDb
        .collection("users")
        .doc(user.uid)
        .collection("addresses")
        .where("isDefault", "==", true)
        .get();

      existingDefaults.forEach((doc) => {
        batch.update(doc.ref, { isDefault: false });
      });
    }

    batch.set(newAddressRef, addressData);
    await batch.commit();

    // Invalidate Cache
    try {
      await redis.del(`user:${user.uid}:addresses`);
    } catch (e) {
      console.warn("Redis DEL error", e);
    }

    return NextResponse.json({
      success: true,
      id: newAddressRef.id,
      message: "Address added",
    });
  }, req);
