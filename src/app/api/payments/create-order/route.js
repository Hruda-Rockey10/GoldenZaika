import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay/razorpay";
import { verifyAuth } from "@/lib/auth/server-auth";
import { apiWrapper } from "@/utils/api-wrapper";
import { logger } from "@/lib/logger/logger";

export const POST = (req) =>
  apiWrapper(async (request) => {
    const user = await verifyAuth(request);
    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: "INR",
      receipt: `receipt_${Date.now()}_${user.uid.slice(0, 5)}`,
    };

    const order = await razorpay.orders.create(options);
    if (!order) {
      throw new Error("Razorpay order creation failed");
    }

    logger.info(`Razorpay order created: ${order.id}`);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        currency: order.currency,
        amount: order.amount,
      },
    });
  }, req);
