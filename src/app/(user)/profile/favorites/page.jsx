"use client";

import { useEffect, useState } from "react";
import { favoriteService } from "@/services/favorite.service";
import { useAuthStore } from "@/stores/auth.store";
import { useCartStore } from "@/stores/cart.store";
import { Heart, ShoppingBag, Loader2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";


export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuthStore();
  const addToCart = useCartStore((state) => state.addToCart);
  const router = useRouter();
  
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        fetchFavorites();
      }
    }
  }, [user, authLoading, router]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await favoriteService.getMyFavorites();
      if (res.success) {
        setFavorites(res.favorites || []);
      }
    } catch (error) {
      console.error("Fetch favorites error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (e, productId) => {
    e.stopPropagation();
    e.preventDefault();
    try {
        await favoriteService.removeFavorite(productId);
        setFavorites(prev => prev.filter(p => p.id !== productId));
        toast.info("Removed from favorites");
    } catch (error) {
        toast.error("Failed to remove");
    }
  };

  const handleAddToCart = (e, product) => {
      e.stopPropagation();
      e.preventDefault();
      addToCart(product);
      toast.success("Added to cart!");
  };

  if (loading || authLoading) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary-gold animate-spin" />
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

      <div className="relative z-10 pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
            My <span className="text-primary-gold">Favorites</span>
        </h1>

        {favorites.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                <Heart className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">No Favorites Yet</h2>
                <p className="text-gray-400 mb-6">Start exploring our menu and save your favorite dishes!</p>
                <Link href="/menu" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-gold text-black font-bold rounded-full hover:bg-yellow-500 transition-colors">
                    Explore Menu <ArrowRight size={18} />
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favorites.map((product) => (
                    <div key={product.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-primary-gold/50 transition-all flex flex-col">
                        <div className="relative h-48 w-full">
                            <Image 
                                src={product.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <button 
                                onClick={(e) => handleRemove(e, product.id)}
                                className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                            >
                                <Heart size={18} fill="currentColor" />
                            </button>
                        </div>
                        
                        <div className="p-4 flex-1 flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{product.name}</h3>
                            <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-1">{product.description}</p>
                            
                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-xl font-bold text-primary-gold">₹{product.price}</span>
                                <button 
                                    onClick={(e) => handleAddToCart(e, product)}
                                    className="p-3 bg-white/10 rounded-full text-white hover:bg-primary-gold hover:text-black transition-colors"
                                >
                                    <ShoppingBag size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
      </div>
    </div>
  );
}
