import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash";

export const GET = (req) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    const cacheKey = `user:${user.uid}:favorites`;

    // Try Redis
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, favorites: cached });
      }
    } catch (e) {
      console.warn("Redis GET error", e);
    }

    // Fetch favorites
    const snapshot = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("favorites")
      .get();

    const favorites = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch product details for each favorite
    // Optimization: This solves N+1 problem by caching the enriched result
    const productPromises = favorites.map(async (fav) => {
      const productDoc = await adminDb
        .collection("products")
        .doc(fav.productId)
        .get();
      if (productDoc.exists) {
        return {
          ...productDoc.data(),
          id: productDoc.id,
          favoritedAt: fav.addedAt,
        };
      }
      return null; // Product might be deleted
    });

    const products = (await Promise.all(productPromises)).filter(
      (p) => p !== null
    );

    // Cache the enriched list
    try {
      await redis.set(cacheKey, products, { ex: 3600 });
    } catch (e) {
      console.warn("Redis SET error", e);
    }

    return NextResponse.json({ success: true, favorites: products });
  }, req);

export const POST = (req) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    const { productId } = await request.json();

    if (!productId) throw new Error("Product ID is required");

    await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("favorites")
      .doc(productId)
      .set({
        productId,
        addedAt: new Date(),
      });

    // Invalidate Cache
    try {
      await redis.del(`user:${user.uid}:favorites`);
    } catch (e) {
      console.warn("Redis DEL error", e);
    }

    return NextResponse.json({ success: true, message: "Added to favorites" });
  }, req);
