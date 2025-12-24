import { logger } from "../lib/logger/logger";
import { auth } from "../lib/firebase/client";

class OrderService {
  async getToken() {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  }

  async createOrder(orderData, token = null) {
    try {
      if (!token) token = await this.getToken();

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });
      if (!res.ok) throw new Error("Failed to create order");
      return await res.json();
    } catch (error) {
      logger.error("OrderService.createOrder error", error);
      throw error;
    }
  }

  async getMyOrders(token = null) {
    try {
      if (!token) token = await this.getToken();

      const res = await fetch("/api/orders/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return await res.json();
    } catch (error) {
      logger.error("OrderService.getMyOrders error", error);
      throw error;
    }
  }

  async getOrderById(id) {
    try {
      const token = await this.getToken();
      const res = await fetch(`/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch order");
      const data = await res.json();
      return data.order;
    } catch (error) {
      logger.error("OrderService.getOrderById error", error);
      throw error;
    }
  }

  // Admin Methods
  async getAllOrders(page = 1) {
    try {
      const token = await this.getToken();
      // Pagination not fully implemented in API yet, usually query params
      const res = await fetch(`/api/orders?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    } catch (error) {
      logger.error("OrderService.getAllOrders error", error);
      throw error;
    }
  }

  async updateOrderStatus(id, status) {
    try {
      const token = await this.getToken();
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      return await res.json();
    } catch (error) {
      logger.error("OrderService.updateOrderStatus error", error);
      throw error;
    }
  }

  async getOrderAnalytics() {
    try {
      const token = await this.getToken();
      const res = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    } catch (error) {
      logger.error("OrderService.getOrderAnalytics error", error);
      throw error;
    }
  }

  async cancelOrder(id, reason) {
    try {
      const token = await this.getToken();
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      return await res.json();
    } catch (error) {
      logger.error("OrderService.cancelOrder error", error);
      throw error;
    }
  }
}

export const orderService = new OrderService();
