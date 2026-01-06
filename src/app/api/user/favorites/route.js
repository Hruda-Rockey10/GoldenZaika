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
    // This is the actual JavaScript Array containing all the document objects found.
    const favorites = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(), // data inside the document
    }));

    //     [
    //   {
    //     // 1. The document ID (from the list in your image)
    //     id: "00gNRxQm2ngsgnf2rvv8"
    //     // 2. The data INSIDE that document (...doc.data())
    //     productId: "00gNRxQm2ngsgnf2rvv8", // Usually matches the ID in your setup
    //     addedAt: Timestamp // Firebase Timestamp object
    //   }
    //     ]

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

    // Inside the map: When you return { ... }, that specific object becomes the result of that single iteration's Promise.
    // Promise.all: The Promise.all(productPromises) waits for every single one of those returns to finish.
    // Final Array: Once finished, Promise.all creates a new array containing all those returned objects in the exact same order.

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
    const { productId } = await request.json(); //decodes the json

    if (!productId) throw new Error("Product ID is required");

    await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("favorites")
      .doc(productId) // to prevent duplicate favorites
      .set({
        productId,
        addedAt: new Date(),
      });

    //       Goal	Code to use
    // Random ID	.add(data)
    // Custom ID	.doc("custom_id").set(data)
    // Random ID (Manual)	.doc().set(data)

    // Invalidate Cache
    try {
      await redis.del(`user:${user.uid}:favorites`);
    } catch (e) {
      console.warn("Redis DEL error", e);
    }

    return NextResponse.json({ success: true, message: "Added to favorites" });
  }, req);
