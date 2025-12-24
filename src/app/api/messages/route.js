import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash";

// GET All Messages (Admin)
export const GET = (req) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const cacheKey = "admin:messages:all";

    // Try Redis
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, data: cached });
      }
    } catch (e) {
      console.warn("Redis GET messages error", e);
    }

    const snapshot = await adminDb
      .collection("messages")
      .orderBy("createdAt", "desc")
      .get();

    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      _id: doc.id,
      ...doc.data(),
    }));

    // Cache (5 mins)
    try {
      await redis.set(cacheKey, messages, { ex: 300 });
    } catch (e) {
      console.warn("Redis SET messages error", e);
    }

    return NextResponse.json({ success: true, data: messages });
  }, req);

// POST Message (Public - Contact Form)
export const POST = (req) =>
  apiWrapper(async (request) => {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      throw new Error("Missing fields");
    }

    const newMessage = {
      name,
      email,
      message,
      status: "unread",
      createdAt: new Date(),
    };

    await adminDb.collection("messages").add(newMessage);

    // Invalidate Cache
    try {
      await redis.del("admin:messages:all");
    } catch (e) {
      console.warn("Redis DEL messages error", e);
    }

    return NextResponse.json({ success: true, message: "Message sent" });
  }, req);
