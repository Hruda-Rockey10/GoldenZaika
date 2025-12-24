import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth, verifyAdmin } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { redis } from "@/lib/redis/upstash"; // Import Redis
import { auditService } from "@/services/audit.service";

export const dynamic = "force-dynamic";

export const GET = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    const { params } = context;
    const { id } = await params;

    const orderDoc = await adminDb.collection("orders").doc(id).get();
    if (!orderDoc.exists) {
      throw new Error("Order not found");
    }

    const order = { id: orderDoc.id, ...orderDoc.data() };

    // Security check: Ensure user owns the order (unless admin)
    // Note: If you have verifyAdmin, use it. But for polling, regular users need access.
    // For now assuming user can only see their own orders.
    if (order.userId !== user.uid) {
      // Optional: Check if admin
      // const role = await getUserRole(user.uid);
      // if (role !== 'admin') throw new Error("Unauthorized");
      // Simpler for now:
      // throw new Error("Unauthorized");
    }
    // Actually, let's just allow it if authenticated for now, or match ID.
    if (order.userId !== user.uid) {
      // Ideally check admin role here if we want admins to view it too.
      // But polling is usually for the user who placed it.
      // Let's implement strict check:
      const role = user.role || "user"; // verifyAuth might not return role directly depending on implementation.
      // Let's stick to basic ownership check for safety.
      // If needed by admin, we can add admin check.
      if (user.uid !== order.userId) {
        // Basic ownership check
        // Allow if admin?
        // Since verifyAdmin isn't imported for GET logic yet.
        // Let's just return it for now, assuming poller is owner.
        // Or better: throw if mismatched.
        throw new Error("Unauthorized access to order");
      }
    }

    return NextResponse.json({
      success: true,
      order,
    });
  }, req);

export const PATCH = (req, context) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    await verifyAdmin(user.uid);

    const { params } = context;
    const { id } = await params;
    const { status } = await request.json();

    if (!status) throw new Error("Status is required");

    // We need the userId to invalidate the specific cache.
    // Fetch order first (fast read)
    const orderDoc = await adminDb.collection("orders").doc(id).get();
    if (!orderDoc.exists) throw new Error("Order not found");
    const orderUserId = orderDoc.data().userId;

    await adminDb.collection("orders").doc(id).update({
      status,
      updatedAt: new Date(),
    });

    // Invalidate User Cache
    if (orderUserId) {
      try {
        await redis.del(`orders:user:${orderUserId}`);
      } catch (e) {
        console.warn("Redis DEL error", e);
      }
    }

    await auditService.logAction(user.uid, "UPDATE_ORDER_STATUS", {
      orderId: id,
      status,
    });

    // Invalidate Admin Cache
    try {
      await redis.del("admin:orders:all");
    } catch (e) {
      console.warn("Redis DEL admin orders error", e);
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated",
    });
  }, req);
