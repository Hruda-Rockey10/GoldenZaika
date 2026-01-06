import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { logger } from "@/lib/logger/logger";
import { redis } from "@/lib/redis/upstash"; // Import Redis

import { auditService } from "@/services/audit.service";

const PRODUCTS_CACHE_KEY = "products:all";
const CACHE_TTL = 600; // 10 minutes

export const GET = (req) =>
  apiWrapper(async (request) => {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // If category is specific, we might skip cache or use specific keys.
    // Ideally, cache everything and filter in memory if list is small,
    // OR create specific keys. For now, let's cache the FULL list only if no category
    // or implement simple caching logic. For Golden Zaika menu size,
    // caching the full list and filtering is usually fine and simpler.

    // Strategy: Cache the full "active" product list.
    // If category is present, fetch full list from cache then filter.

    let products = null;

    try {
      const cached = await redis.get(PRODUCTS_CACHE_KEY);
      if (cached) {
        products = cached;
      }
    } catch (e) {
      console.warn("Redis GET error", e);
    }

    if (!products) {
      // Cache miss - fetch from DB
      const query = adminDb.collection("products"); // adminDb.collection("products") gives you a Reference (A Pointer).
      // We fetch ALL to cache ALL
      const snapshot = await query.get();
      products = snapshot.docs
        .map((doc) => ({
          // doc.id = "burger-123"                           {id: "burger-123"
          // doc.data() = { name: "Burger", price: 100 }     name: "Burger", price: 100
          //                                                    }
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (product) => product.isActive !== false // Only filter by isActive (deleted), keep isAvailable (stock) visible
        );

      // You CANNOT do: docs[0].name. (Undefined)
      // You MUST do: docs[0].data().name. (Correct)

      // Set cache
      try {
        await redis.set(PRODUCTS_CACHE_KEY, products, { ex: CACHE_TTL }); //ex = expiry
      } catch (e) {
        console.warn("Redis SET error", e);
      }
    }

    // Filter by category if needed
    if (category && category !== "All") {
      products = products.filter((p) => p.category === category);
    }

    return NextResponse.json({ success: true, products });
    // const products = [ {name: "Burger"}, {name: "Pizza"} ];

    // return NextResponse.json({
    //     success: true,
    //     products
    // });

    //The JSON sent to the frontend is:
    // {
    //   "success": true,
    //   "products": [
    //       { "name": "Burger" },
    //       { "name": "Pizza" }
    //   ]
    // }
  }, req);

export const POST = (req) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const data = await request.json();
    const docRef = await adminDb.collection("products").add({
      ...data,
      isActive: true, // Default to true
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Invalidate Cache
    try {
      await redis.del(PRODUCTS_CACHE_KEY);
    } catch (e) {
      console.warn("Redis DEL error", e);
    }

    logger.info(`Product created: ${docRef.id}`);
    await auditService.logAction(user.uid, "CREATE_PRODUCT", {
      productId: docRef.id,
      name: data.name,
    });

    return NextResponse.json({ success: true, id: docRef.id });
  }, req);

//   NextResponse.json(...) (The Sender)
// Where: Used in the Backend (API Route).
// res.json() (The Receiver)
// Where: Used in the Frontend (fetch in product.service.js).
