"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import FoodCard from "@/components/ui/FoodCard";
import { useCartStore } from "@/stores/cart.store";
import { aiService } from "@/services/ai.service";

export default function RecommendedSection({ onSelect }) {
  const [recommendations, setRecommendations] = useState([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const addToCart = useCartStore((state) => state.addToCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const items = useCartStore((state) => state.items);

  const getQuantity = (id) => {
    const item = items.find((i) => (i.id || i._id) === id);
    return item ? item.quantity : 0;
  };

  useEffect(() => {
    if (fetchedRef.current) return; // Prevent 2 times call API causing 429
    fetchedRef.current = true;

    const fetchRecommendations = async () => {
      try {
        const data = await aiService.getRecommendations();

        if (data.success && data.items.length > 0) {
          setRecommendations(data.items);
          setReason(data.reason);
        }
      } catch (error) {
        console.error("Failed to fetch recommendations", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return null;
  if (recommendations.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-gold/10 rounded-full">
            <Sparkles className="text-primary-gold" size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-white">Recommended For You</h2>
            <p className="text-sm text-gray-400 italic">"{reason}"</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((item, index) => (
          <FoodCard 
            key={item.id || item._id} 
            food={item}
            index={index}
            onSelect={onSelect}
            addToCart={addToCart}
            updateQuantity={updateQuantity}
            quantity={getQuantity(item.id || item._id)}
          />
        ))}
      </div>
    </section>
  );
}
