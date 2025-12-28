"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ShoppingCart, Star, Info, Heart } from "lucide-react";

export default function FoodCard({
  food,
  index,
  onSelect,
  addToCart,
  updateQuantity,
  quantity,
  isFavorite = false,
  onToggleFavorite,
}) {
  const id = food.id || food._id; // Normalize ID

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-primary-gold/50 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(255,215,0,0.15)] flex flex-col ${!food.isAvailable ? 'grayscale opacity-70' : ''}`}
    >
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={
            food.imageUrl ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
          }
          alt={food.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          priority={index < 6}
         
        />
        
        {!food.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
              Out of Stock
            </span>
          </div>
        )}

        {/* Favorite Button (Only if handler is provided) */}
        {onToggleFavorite && (
          <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(e, food);
              }}
              className={`absolute top-3 left-3 p-2 rounded-full backdrop-blur-sm border transition-all duration-300 z-10 ${
                  isFavorite 
                  ? "bg-red-500 text-white border-red-500 scale-110" 
                  : "bg-black/40 text-gray-300 border-white/10 hover:bg-black/60 hover:text-white"
              }`}
          >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-xl font-bold text-white group-hover:text-primary-gold transition-colors truncate w-[70%]">
            {food.name}
          </h3>
          <span className="text-lg font-bold text-primary-gold">
            ₹{food.price}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3 text-sm">
          <div className="flex items-center text-primary-gold gap-1 bg-primary-gold/10 px-2 py-0.5 rounded-full border border-primary-gold/20">
            <Star size={14} fill="currentColor" />
            <span className="font-bold">{food.stars || 4.5}</span>
          </div>
          <span className="text-gray-400">•</span>
          <span className="text-gray-400 font-medium">
            {food.category || "Delicious"}
          </span>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2 grow">
          {food.description}
        </p>

        <div className="mt-auto flex flex-col gap-3">
          <button
            onClick={() => onSelect(food)}
            className="text-sm text-primary-gold hover:text-white transition-colors flex items-center gap-1 font-medium w-fit group/read"
          >
            Read More
            <Info
              size={14}
              className="group-hover/read:translate-x-1 transition-transform"
            />
          </button>

          {!food.isAvailable ? (
            <button
               disabled
               className="w-full py-3 bg-white/5 border border-white/5 text-gray-500 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
            >
               Unavailable
            </button>
          ) : quantity > 0 ? (
            <div className="flex items-center justify-between bg-black/40 rounded-xl p-1 border border-white/10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(id, quantity - 1);
                }}
                className="w-10 h-10 flex items-center justify-center text-white hover:text-primary-gold transition-colors font-bold text-xl"
              >
                −
              </button>
              <span className="text-primary-gold font-bold text-lg">
                {quantity}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(food);
                }}
                className="w-10 h-10 flex items-center justify-center text-white hover:text-primary-gold transition-colors font-bold text-xl"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(food);
              }}
              className="w-full py-3 bg-white/10 border border-white/10 text-white font-bold rounded-xl hover:bg-primary-gold hover:text-black hover:border-primary-gold transition-all flex items-center justify-center gap-2 group/btn"
            >
              <ShoppingCart
                size={18}
                className="group-hover/btn:scale-110 transition-transform"
              />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
