import { NextResponse } from "next/server";
import crypto from "crypto";
import { verifyAuth } from "@/lib/auth/server-auth";
import { adminDb } from "@/lib/firebase/admin";
import { apiWrapper } from "@/utils/api-wrapper";
import { logger } from "@/lib/logger/logger";

export const POST = (req) =>
  apiWrapper(async (request) => {
    await verifyAuth(request);
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = await request.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update Order in Firestore
      if (orderId) {
        await adminDb.collection("orders").doc(orderId).update({
          status: "paid",
          paymentStatus: "success",
          paymentId: razorpay_payment_id,
          paymentDetails: {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
          },
          updatedAt: new Date(),
        });
        logger.info(`Payment verified for order: ${orderId}`);
      } else {
        logger.warn("Payment verified but no orderId provided");
      }

      return NextResponse.json({ success: true, message: "Payment verified" });
    } else {
      logger.error("Payment signature verification failed");
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }
  }, req);
