"use client";

import { useCartStore } from "@/stores/cart.store";
import Link from "next/link";
import Image from "next/image";
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Download,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import { motion } from "framer-motion";
import NutritionCard from "@/components/user/NutritionCard";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Calculate values only on client side after mount to prevent hydration errors
  const subtotal = getTotalPrice();
  const tax = subtotal * 0.1; // 10% Tax
  const shipping = items.length > 0 ? 10 : 0;
  const total = subtotal + tax + shipping;

  const handleDownloadPDF = () => {
    // Generate Invoice Number safely
    const invoiceNum = Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date().toLocaleDateString();

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(255, 165, 0); // Orange/Gold
    doc.text("Golden Zaika", 105, 20, null, null, "center");

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Authentic Indian Cuisine", 105, 26, null, null, "center");

    doc.setDrawColor(255, 165, 0);
    doc.line(20, 32, 190, 32);

    // Invoice Details
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`INVOICE #${invoiceNum}`, 20, 45);
    doc.setFontSize(10);
    doc.text(`Date: ${dateStr}`, 190, 45, null, null, "right");

    // Table Header
    let y = 60;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Item", 20, y);
    doc.text("Qty", 120, y);
    doc.text("Price", 150, y);
    doc.text("Total", 190, y, null, null, "right");
    doc.line(20, y + 2, 190, y + 2);

    // Table Content
    y += 10;
    doc.setFont("helvetica", "normal");

    items.forEach((item) => {
      const itemTotal = item.price * item.quantity;

      // Handle page break if needed (simple check)
      if (y > 270) {
        doc.addPage();
        y = 30;
      }

      doc.text(doc.splitTextToSize(item.name, 90), 20, y);
      doc.text(String(item.quantity), 120, y);
      doc.text(`Rs.${item.price}`, 150, y);
      doc.text(`Rs.${itemTotal.toFixed(2)}`, 190, y, null, null, "right");

      y += 10;
    });

    // Summary
    y += 10;
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Subtotal:", 140, y);
    doc.text(`Rs.${subtotal.toFixed(2)}`, 190, y, null, null, "right");
    y += 6;

    doc.text("Tax (10%):", 140, y);
    doc.text(`Rs.${tax.toFixed(2)}`, 190, y, null, null, "right");
    y += 6;

    doc.text("Shipping:", 140, y);
    doc.text(`Rs.${shipping.toFixed(2)}`, 190, y, null, null, "right");
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(255, 165, 0);
    doc.text("Total:", 140, y);
    doc.text(`Rs.${total.toFixed(2)}`, 190, y, null, null, "right");

    // Generate PDF with proper filename using manual download link
    const filename = `GoldenZaika_Invoice_${invoiceNum}.pdf`;
    const pdfBlob = doc.output("blob");

    // Create a proper download link to ensure filename is preserved
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen relative bg-black font-sans">
      {/* Background Image with Blur */}
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

      <div className="relative z-10 pt-28 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-white drop-shadow-lg">
            Your <span className="text-primary-gold">Cart</span>
            <span className="text-gray-400 text-lg ml-4 font-normal">
              {items.length} items
            </span>
          </h1>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md shadow-2xl">
              <div className="p-6 bg-white/5 rounded-full mb-6 animate-pulse">
                <ShoppingBag className="w-16 h-16 text-gray-400" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-white">
                Your cart is empty
              </h2>
              <p className="text-gray-400 mb-8 text-center max-w-md text-lg">
                Looks like you haven&apos;t added any delicious items yet.
              </p>
              <Link
                href="/menu"
                className="px-8 py-4 bg-primary-gold text-black font-bold rounded-full hover:bg-yellow-500 transition-all shadow-lg hover:shadow-yellow-500/20"
              >
                Start Ordering
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Cart Items List */}
              <div className="flex-1 space-y-4">
                {items.map((item, index) => {
                  const id = item.id || item._id; // Normalize ID
                  return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group flex flex-col sm:flex-row items-center justify-between p-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl hover:border-primary-gold/50 transition-all shadow-lg"
                  >
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                      {/* Image */}
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden shadow-md">
                        <Image
                          src={
                            item.imageUrl ||
                            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
                          }
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="96px"
                        />
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {item.name}
                        </h3>
                        <p className="text-primary-gold text-sm font-bold bg-primary-gold/10 inline-block px-2 py-1 rounded">
                          {item.category || "General"}
                        </p>
                      </div>
                    </div>

                    {/* Controls & Price */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:mt-0 mt-4">
                      {/* Quantity */}
                      <div className="flex items-center bg-black/40 rounded-xl h-10 border border-white/10">
                        <button
                          onClick={() =>
                            updateQuantity(id, item.quantity - 1)
                          }
                          className="w-10 h-full flex items-center justify-center hover:text-primary-gold hover:bg-white/5 rounded-l-xl transition-colors font-bold text-lg"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(id, item.quantity + 1)
                          }
                          className="w-10 h-full flex items-center justify-center hover:text-primary-gold hover:bg-white/5 rounded-r-xl transition-colors font-bold text-lg"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <span className="text-xl font-bold w-24 text-right text-white">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>

                      {/* Delete */}
                      <button
                        onClick={() => removeFromCart(id)}
                        className="p-3 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                        title="Remove Item"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                )})}

                {/* AI Nutrition Advisor */}
                <NutritionCard items={items} />
              </div>

              {/* Order Summary */}
              <div className="lg:w-[420px]">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl sticky top-28 shadow-2xl">
                  <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">
                    Order Summary
                  </h2>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal</span>
                      <span className="font-medium">
                        ₹{subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Tax (10%)</span>
                      <span className="font-medium">₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Shipping</span>
                      <span className="font-medium">
                        ₹{shipping.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-white/10 mb-8">
                    <span className="text-gray-300 font-bold text-lg">
                      Total
                    </span>
                    <span className="text-3xl font-bold text-primary-gold">
                      ₹{total.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="w-full mb-4 py-3 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all text-sm group"
                  >
                    <Download
                      size={16}
                      className="group-hover:scale-110 transition-transform"
                    />
                    Download Invoice
                  </button>

                  <button
                    onClick={() => router.push("/checkout")}
                    className="w-full py-4 bg-primary-gold text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-900/20 group hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Proceed To Checkout</span>
                    <ArrowRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>

                  <div className="mt-6 flex items-center justify-center text-green-400 gap-2 text-sm font-medium opacity-80">
                    <ShieldCheck size={16} />
                    <span>Secure Checkout Encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
