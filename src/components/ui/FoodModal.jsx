"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";

export default function FoodModal({
  food,
  onClose,
  onAddToCart,
  quantity,
  onUpdateQuantity,
}) {
  if (!food) return null;
  const id = food.id || food._id;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-black/90 border border-white/10 rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[600px]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-white/10 text-white rounded-full transition-colors"
          >
            <X size={24} />
          </button>

          {/* Image Section */}
          <div className="relative w-full md:w-1/2 h-64 md:h-auto md:min-h-[400px] bg-zinc-800">
            <Image
              src={
                food.imageUrl ||
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
              }
              alt={food.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Details Section */}
          <div className="flex-1 p-8 md:p-12 flex flex-col overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 bg-primary-gold/10 text-primary-gold text-sm font-bold rounded-full uppercase tracking-wide border border-primary-gold/20">
                  {food.category}
                </span>
                <div className="flex items-center gap-1 text-primary-gold">
                  <Star size={18} fill="currentColor" />
                  <span className="font-bold text-lg">{food.stars || 4.5}</span>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {food.name}
              </h2>
              <span className="text-2xl font-bold text-primary-gold">
                ₹{food.price}
              </span>
            </div>

            <p className="text-gray-300 leading-relaxed mb-8 flex-1">
              {food.description}
            </p>

            {/* Controls */}
            <div className="mt-auto">
              {quantity > 0 ? (
                <div className="flex items-center gap-6">
                  <div className="flex items-center bg-white/5 rounded-xl h-12 border border-white/10">
                    <button
                      onClick={() => onUpdateQuantity(id, quantity - 1)}
                      className="w-12 h-full flex items-center justify-center hover:text-primary-gold hover:bg-white/5 rounded-l-xl transition-colors font-bold text-xl text-white"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-bold text-white text-lg">
                      {quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(id, quantity + 1)}
                      className="w-12 h-full flex items-center justify-center hover:text-primary-gold hover:bg-white/5 rounded-r-xl transition-colors font-bold text-xl text-white"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-gray-400 text-sm">Item in cart</span>
                </div>
              ) : (
                <button
                  onClick={() => onAddToCart(food)}
                  className="w-full md:w-auto px-8 py-4 bg-primary-gold text-black font-bold rounded-xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-900/20"
                >
                  <ShoppingCart size={20} />
                  Add to Cart - ₹{food.price}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
