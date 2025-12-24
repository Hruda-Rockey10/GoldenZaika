"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger/logger";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error("Global Error Boundary caught error", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h2 className="text-3xl font-bold text-primary-red mb-4">Something went wrong!</h2>
      <p className="text-gray-400 mb-8 max-w-md text-center">
        We apologize for the inconvenience. Our team has been notified.
      </p>
      <div className="flex space-x-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-primary-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-6 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors border border-white/10"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
