"use client";

import { useEffect, useState } from "react";
import { Package, RefreshCw, Clock, CheckCircle2, Download, XCircle } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useCartStore } from "@/stores/cart.store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import { toast } from "react-toastify";
import { useOrderPolling } from "@/hooks/useOrderPolling";
import { orderService } from "@/services/order.service";

// Simple, robust date formatter
// Handles Firestore timestamps, Date objects, strings, and nulls
const formatDate = (dateInput) => {
  if (!dateInput) return "Date unavailable";

  try {
    let date;
    
    // Handle Firestore Timestamp (has seconds property)
    if (dateInput.seconds) {
      date = new Date(dateInput.seconds * 1000);
    } 
    // Handle Firestore Timestamp (underscore variant sometimes seen)
    else if (dateInput._seconds) {
      date = new Date(dateInput._seconds * 1000);
    }
    // Handle existing Date objects or strings
    else {
      date = new Date(dateInput);
    }

    // Check if valid
    if (isNaN(date.getTime())) return "Invalid Date";

    return date;
  } catch (error) {
    return new Date(); // Fallback to now
  }
};

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuthStore();
  const addItems = useCartStore(state => state.addItems);
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleReorder = (order) => {
      addItems(order.items);
      toast.success("Items added to cart!");
      router.push("/checkout");
  };

  const handleCancelOrder = async (order) => {
      if (!confirm("Are you sure you want to cancel this order?")) return;
      try {
          await orderService.cancelOrder(order.id, "User requested cancellation");
          toast.success("Order cancelled");
          fetchOrders(); 
      } catch (error) {
          toast.error(error.message || "Failed to cancel");
      }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getMyOrders();
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = (order) => {
    const doc = new jsPDF();
    const orderId = order.id || order._id;
    const orderDate = formatDate(order.createdAt);
    const dateStr = orderDate instanceof Date 
      ? orderDate.toLocaleDateString()
      : "N/A";

    // Header
    doc.setFontSize(24);
    doc.setTextColor(255, 165, 0); // Gold
    doc.setFont("helvetica", "bold");
    doc.text("Golden Zaika", 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.text("INVOICE", 105, 30, { align: "center" });

    doc.setDrawColor(255, 165, 0);
    doc.line(20, 35, 190, 35);

    // Order Info
    doc.setFontSize(10);
    doc.text(`Order ID: ${orderId}`, 14, 45);
    doc.text(`Date: ${dateStr}`, 190, 45, { align: "right" });

    // Customer Address
    doc.setFontSize(10);
    doc.text("Delivery Address:", 14, 55);
    doc.setFontSize(9);
    const addressLines = doc.splitTextToSize(order.address || "N/A", 180);
    doc.text(addressLines, 14, 61);

    // Table Header
    let y = 80;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(218, 165, 32); // Gold
    doc.rect(14, y - 5, 182, 8, "F");
    doc.setTextColor(0);
    doc.text("Item", 20, y);
    doc.text("Qty", 150, y);
    doc.text("Price", 175, y);

    // Table Content
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);

    order.items.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y - 5, 182, 8, "F");
      }

      if (y > 270) {
        doc.addPage();
        y = 30;
      }

      const itemName = doc.splitTextToSize(item.name, 120);
      doc.text(itemName, 20, y);
      doc.text(String(item.quantity), 150, y);
      doc.text(String(item.price || "-"), 175, y);

      y += 10;
    });

    // Total Section
    y += 10;
    doc.line(14, y, 196, y);
    y += 15;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 165, 0);
    doc.text(`Total: Rs. ${(order.totalAmount || order.amount || 0).toFixed(2)}`, 14, y);

    // Footer
    y += 20;
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text("Thank you for ordering from Golden Zaika!", 105, y, { align: "center" });

    const fileName = `GoldenZaika_Invoice_${(orderId || "").slice(-8)}.pdf`;
    const pdfBlob = doc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Polling Logic
  const activeOrder = orders.find(
    (o) => o.status !== "Delivered" && o.status !== "Cancelled"
  );

  const handleStatusChange = (newStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === activeOrder.id || o._id === activeOrder.id
          ? { ...o, status: newStatus }
          : o
      )
    );
  };

  useOrderPolling(
    activeOrder?.id || activeOrder?._id,
    activeOrder?.status,
    handleStatusChange
  );

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchOrders();
      } else {
        router.push("/login");
      }
    }
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-black font-sans">
      <div className="fixed inset-0 z-0">
        <Image
          src="/assets/food-types/biryani.jpg"
          alt="Background"
          fill
          className="object-cover opacity-60"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 pt-28 px-4 md:px-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              My <span className="text-primary-gold">Orders</span>
            </h1>
            <p className="text-gray-400">Track and manage your recent orders.</p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-bold text-primary-gold hover:bg-primary-gold hover:text-black transition-all group"
          >
            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
            Refresh
          </button>
        </div>

        <div className="space-y-6 pb-20">
          {orders.length > 0 ? (
            orders.map((order, index) => {
              const dateObj = formatDate(order.createdAt);
              const isValidDate = dateObj instanceof Date;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary-gold/50 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(255,215,0,0.1)]"
                >
                  {/* Icon */}
                  <div className="hidden md:flex flex-col items-center justify-center w-20 h-20 bg-black/40 rounded-xl border border-white/10 group-hover:border-primary-gold/30 transition-colors">
                    <Package className="w-8 h-8 text-primary-gold mb-1" />
                    <span className="text-[10px] text-gray-500 font-mono">ORDER</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 w-full text-center md:text-left">
                    <div className="text-xs text-gray-500 mb-1 font-mono">
                      <span suppressHydrationWarning>
                        {isValidDate 
                          ? `${dateObj.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })} • ${dateObj.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : "Date unavailable"}
                      </span>
                    </div>

                    <div className="mb-2">
                      <h3 className="text-lg font-bold text-white line-clamp-1">
                        {order.items.map((item) => item.name).join(", ")}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-400">
                      <span className="bg-white/5 px-2 py-1 rounded-md border border-white/10">
                        {order.items.length} Items
                      </span>
                      {order.items.slice(0, 3).map((item, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-primary-gold rounded-full"></span>
                          {item.quantity}x {item.name.split(" ")[0]}
                        </span>
                      ))}
                      {order.items.length > 3 && (
                        <span>+{order.items.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  {/* Status & Price */}
                  <div className="flex flex-col md:flex-row items-center gap-6 md:gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-4 md:pt-0 mt-2 md:mt-0">
                    <div className="flex flex-col items-end mr-4">
                      <span className="text-xs text-gray-500 mb-1">Total Amount</span>
                      <span className="text-2xl font-bold text-primary-gold">
                        ₹{(order.totalAmount || order.amount || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => downloadInvoice(order)}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/10 transition-all"
                        title="Download Invoice"
                      >
                        <Download size={14} />
                      </button>

                      <button
                        onClick={() => handleReorder(order)}
                        className="flex items-center gap-2 px-3 py-2 bg-primary-gold/10 border border-primary-gold/30 rounded-lg text-xs font-bold text-primary-gold hover:bg-primary-gold hover:text-black transition-all"
                        title="Order Again"
                      >
                         <RefreshCw size={14} /> Re-Order
                      </button>

                      {(order.status === "Placed" || order.status === "Pending") && (
                          <button
                            onClick={() => handleCancelOrder(order)}
                            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all"
                            title="Cancel Order"
                          >
                            <XCircle size={14} /> Cancel
                          </button>
                      )}
                    </div>

                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                        order.status === "Delivered"
                          ? "bg-green-500/10 border-green-500/20 text-green-500"
                          : order.status === "Cancelled"
                          ? "bg-red-500/10 border-red-500/20 text-red-500"
                          : "bg-orange-500/10 border-orange-500/20 text-orange-500"
                      }`}
                    >
                      {order.status === "Delivered" ? (
                        <CheckCircle2 size={16} />
                      ) : order.status === "Cancelled" ? (
                        <XCircle size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                      <span className="font-bold text-sm tracking-wide uppercase">
                        {order.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm"
            >
              <Package className="w-20 h-20 mx-auto mb-6 text-white/10" />
              <h2 className="text-2xl font-bold text-white mb-2">No Orders Yet</h2>
              <p className="text-gray-400 mb-8">You haven&apos;t placed any orders yet.</p>
              <Link
                href="/menu"
                className="px-8 py-3 bg-primary-gold text-black font-bold rounded-full hover:bg-yellow-500 transition-colors inline-block"
              >
                Start Ordering
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
