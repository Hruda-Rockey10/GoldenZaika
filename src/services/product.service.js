import { logger } from "../lib/logger/logger";
import { auth } from "../lib/firebase/client";

class ProductService {
  async getToken() {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  }

  async getProducts(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      // Using /api/products route handler
      const res = await fetch(`/api/products?${query}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return await res.json();
    } catch (error) {
      logger.error("ProductService.getProducts error", error);
      throw error;
    }
  }

  async getProductById(id) {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      return await res.json();
    } catch (error) {
      logger.error("ProductService.getProductById error", error);
      throw error;
    }
  }

  // Admin only - protected by API
  async createProduct(data, token = null) {
    try {
      if (!token) token = await this.getToken();

      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create product");
      return await res.json();
    } catch (error) {
      logger.error("ProductService.createProduct error", error);
      throw error;
    }
  }

  // Alias for legacy compatibility
  async addProduct(data) {
    return this.createProduct(data);
  }

  async removeProduct(id) {
    try {
      const token = await this.getToken();
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete product");
      return await res.json();
    } catch (error) {
      logger.error("ProductService.removeProduct error", error);
      throw error;
    }
  }

  async updateProduct(id, data) {
    try {
      const token = await this.getToken();
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return await res.json();
    } catch (error) {
      logger.error("ProductService.updateProduct error", error);
      throw error;
    }
  }

  async getTrashedProducts() {
    try {
      const token = await this.getToken();
      const res = await fetch("/api/products/trash", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch trashed products");
      return await res.json();
    } catch (error) {
      logger.error("ProductService.getTrashedProducts error", error);
      throw error;
    }
  }

  async restoreProduct(id) {
    try {
      const token = await this.getToken();
      const res = await fetch(`/api/products/${id}/restore`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to restore product");
      return await res.json();
    } catch (error) {
      logger.error("ProductService.restoreProduct error", error);
      throw error;
    }
  }

  async permanentDeleteProduct(id) {
    try {
      const token = await this.getToken();
      const res = await fetch(`/api/products/${id}/permanent`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to permanently delete product");
      return await res.json();
    } catch (error) {
      logger.error("ProductService.permanentDeleteProduct error", error);
      throw error;
    }
  }
}

export const productService = new ProductService();
