import Razorpay from "razorpay";

let razorpayInstance = null;

/**
 * Get or create Razorpay instance
 * Lazy initialization pattern to avoid build-time errors
 */
export const getRazorpay = () => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        "Razorpay credentials are missing in environment variables"
      );
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
};

// Backward compatibility export
export const razorpay = {
  get orders() {
    return getRazorpay().orders;
  },
  get payments() {
    return getRazorpay().payments;
  },
};
