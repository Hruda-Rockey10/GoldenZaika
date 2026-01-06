import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash";

export const DELETE = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    const { params } = context;
    const { id } = await params; // This is productId

    /* context object looks like this: */
    // {
    //    params: {
    //       id: "pizza-123" // The value from the URL
    //            }
    // }
    await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("favorites")
      .doc(id)
      .delete();

    // Invalidate Cache
    try {
      await redis.del(`user:${user.uid}:favorites`);
    } catch (e) {
      console.warn("Redis DEL error", e);
    }

    return NextResponse.json({
      success: true,
      message: "Removed from favorites",
    });
  }, req);

//   1. The Folder Name: Your file is in a folder named [id].
//   The brackets [] tell Next.js:
//  "Whatever value is in this position of the URL, save it into a variable named 'id'."

// 2. The Request: URL: /api/user/favorites/pizza-123

// 3. The Code Extraction: Next.js packs this information into the second argument of your function,
//  often called context (or implicitly handled).
