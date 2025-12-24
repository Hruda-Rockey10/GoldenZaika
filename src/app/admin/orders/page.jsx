"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Package } from "lucide-react";
import { orderService } from "@/services/order.service";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders();
      if (response.success) {
        setOrders(response.orders || []);
      } else {
        toast.error("Error fetching orders");
      }
    } catch (error) {
      toast.error("Server Error");
    } finally {
      setLoading(false);
    }
  }, []);

  const statusHandler = async (event, orderId) => {
    try {
      const response = await orderService.updateOrderStatus(orderId, event.target.value);
      if (response.success) {
        toast.success("Status Updated");
        await fetchAllOrders();
      } else {
        toast.error("Error updating status");
      }
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  // Robust date parser
  const toDate = (dateInput) => {
    if (!dateInput) return new Date();
    if (dateInput.seconds) return new Date(dateInput.seconds * 1000);
    if (dateInput._seconds) return new Date(dateInput._seconds * 1000);
    if (dateInput instanceof Date) return dateInput;
    return new Date(dateInput);
  };

  const getElapsedMinutes = (dateInput) => {
      const start = toDate(dateInput);
      if (isNaN(start.getTime())) return 0;
      
      const now = new Date();
      const diff = now - start;
      return Math.floor(diff / 60000); // Minutes
  };

  const getSLAColor = (minutes) => {
      if (minutes < 30) return "text-green-400"; // Good
      if (minutes < 60) return "text-orange-400"; // Warning
      return "text-red-500 font-bold"; // Critical
  };

  const formatDate = (dateInput) => {
    const date = toDate(dateInput);
    if (isNaN(date.getTime())) return "N/A";
    
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Food Processing":
        return "text-orange-400 font-medium";
      case "Out for delivery":
        return "text-blue-400 font-medium";
      case "Delivered":
        return "text-green-400 font-medium";
      default:
        return "text-white";
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  if (loading) {
    return (
      <div className="text-center py-10 text-primary-gold">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        Order <span className="text-primary-gold">Management</span>
      </h2>

      {orders.length === 0 ? (
        <div className="text-center text-gray-400 py-12 bg-white/5 border border-white/10 rounded-2xl shadow backdrop-blur-sm">
          No orders found.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const id = order.id || order._id;
            const address = order.shippingAddress || order.address || "N/A";

            return (
            <div
              key={id}
              className="bg-white/5 rounded-xl shadow-lg border border-white/10 p-6 grid grid-cols-1 lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-6 items-start hover:border-primary-gold/50 transition-all backdrop-blur-sm"
            >
              {/* Icon */}
              <div className="flex justify-center pt-1">
                <Package className="w-10 h-10 text-primary-gold" />
              </div>

              {/* Items & Address */}
              <div>
                <p className="font-bold text-gray-200 mb-2">
                  {order.items.map((item, index) => {
                    if (index === order.items.length - 1) {
                      return item.name + " x " + item.quantity;
                    } else {
                      return item.name + " x " + item.quantity + ", ";
                    }
                  })}
                </p>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p className="font-semibold text-gray-300">
                      {address.split(",")[0]}{" "}
                    </p>
                    <p>{address}</p>
                    {order.instructions && (
                      <p className="text-amber-400 text-xs mt-1 border-l-2 border-amber-400 pl-2">
                        Note: {order.instructions}
                      </p>
                    )}
                  </div>
                {/* Order Date */}
                <p className="text-xs text-gray-500 mt-2">
                  Placed on: {formatDate(order.createdAt)}
                </p>
              </div>

              {/* Items Count */}
              <div className="text-gray-400 text-center lg:text-left">
                Items: {order.items.length}
              </div>

              {/* Amount */}
              <div className="font-bold text-primary-gold">
                ₹{(order.totalAmount || order.amount || 0).toFixed(2)}
              </div>

              {/* Status & SLA */}
              <div className="flex flex-col gap-2">
                <select
                  onChange={(event) => statusHandler(event, id)}
                  value={order.status}
                  className={`w-full bg-black/40 border border-white/20 text-sm rounded-lg focus:ring-primary-gold focus:border-primary-gold block p-2.5 outline-none cursor-pointer hover:bg-white/10 transition-colors ${getStatusColor(
                    order.status
                  )}`}
                >
                  <option
                    value="pending"
                    className="bg-gray-900 text-gray-400"
                  >
                    Pending
                  </option>
                  <option
                    value="Food Processing"
                    className="bg-gray-900 text-orange-400"
                  >
                    Food Processing
                  </option>
                  <option
                    value="Out for delivery"
                    className="bg-gray-900 text-blue-400"
                  >
                    Out for delivery
                  </option>
                  <option
                    value="Delivered"
                    className="bg-gray-900 text-green-400"
                  >
                    Delivered
                  </option>
                   <option
                    value="Cancelled"
                    className="bg-gray-900 text-red-500"
                  >
                    Cancelled
                  </option>
                </select>
                
                {order.status !== "Delivered" && order.status !== "Cancelled" && (
                    <div className={`text-xs text-center font-mono mt-1 ${getSLAColor(getElapsedMinutes(order.createdAt))}`}>
                        ⏱ {getElapsedMinutes(order.createdAt)}m elapsed
                    </div>
                )}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
