import { logger } from "../lib/logger/logger";

class PaymentService {
  async createOrder(amount, token) {
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error("Failed to init payment");
      return await res.json(); // Returns Razorpay order ID
    } catch (error) {
      logger.error("PaymentService.createOrder error", error);
      throw error;
    }
  }

  async verifyPayment(paymentData, token) {
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });
      if (!res.ok) throw new Error("Payment verification failed");
      return await res.json();
    } catch (error) {
      logger.error("PaymentService.verifyPayment error", error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
