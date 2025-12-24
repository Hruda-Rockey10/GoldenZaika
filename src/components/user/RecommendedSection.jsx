"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Sparkles } from "lucide-react";
import FoodCard from "@/components/ui/FoodCard";
import { useCartStore } from "@/stores/cart.store";

export default function RecommendedSection() {
  const [recommendations, setRecommendations] = useState([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  const addToCart = useCartStore((state) => state.addToCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const items = useCartStore((state) => state.items);

  const getQuantity = (id) => {
    const item = items.find((i) => (i.id || i._id) === id);
    return item ? item.quantity : 0;
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await axios.post("/api/ai/recommend", {});
        if (res.data.success && res.data.items.length > 0) {
          setRecommendations(res.data.items);
          setReason(res.data.reason);
        }
      } catch (error) {
        // Silently handle rate limit (429) or other errors
        // Just don't show recommendations section
        if (error.response?.status === 429) {
          console.log("AI recommendations rate limited - skipping");
        } else {
          console.error("Failed to fetch recommendations", error);
        }
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
            onSelect={() => {}}
            addToCart={addToCart}
            updateQuantity={updateQuantity}
            quantity={getQuantity(item.id || item._id)}
          />
        ))}
      </div>
    </section>
  );
}
