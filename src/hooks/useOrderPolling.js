"use client";

import { useEffect } from "react";
import { orderService } from "@/services/order.service";
import { logger } from "@/lib/logger/logger";
import { toast } from "react-toastify";

export const useOrderPolling = (orderId, currentStatus, onStatusChange) => {
  useEffect(() => {
    if (
      !orderId ||
      currentStatus === "Delivered" ||
      currentStatus === "Cancelled"
    )
      return;

    const intervalId = setInterval(async () => {
      try {
        const order = await orderService.getOrderById(orderId);
        if (order && order.status !== currentStatus) {
          onStatusChange(order.status);
          toast.info(`Order Status updated: ${order.status}`);
        }
      } catch (error) {
        logger.error("Polling error", error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [orderId, currentStatus, onStatusChange]);
};
