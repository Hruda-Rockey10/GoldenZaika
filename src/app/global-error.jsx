"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger/logger";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    logger.error("Root Layout caught error", error);
  }, [error]);

  return (
    <html>
      <body className="bg-black text-white">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-3xl font-bold text-primary-red mb-4">Critical Error</h2>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-3 bg-primary-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
