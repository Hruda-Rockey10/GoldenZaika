import { NextResponse } from "next/server";
import crypto from "crypto";
import { verifyAuth } from "@/lib/auth/server-auth";

import { apiWrapper } from "@/utils/api-wrapper";
import { logger } from "@/lib/logger/logger";

export const POST = (req) =>
  apiWrapper(async (request) => {
    await verifyAuth(request);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Verification successful
      logger.info(`Payment verified: ${razorpay_payment_id}`);

      return NextResponse.json({ success: true, message: "Payment verified" });
    } else {
      logger.error("Payment signature verification failed");
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }
  }, req);
