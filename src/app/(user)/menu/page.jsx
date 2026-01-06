"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { productService } from "@/services/product.service";
import { favoriteService } from "@/services/favorite.service";
import { Search, ShoppingCart, Heart, Sparkles, Loader2 } from "lucide-react";
import FoodModal from "@/components/ui/FoodModal";
import { motion } from "framer-motion";
import { foodCategories } from "@/constants/data";
import { toast } from "react-toastify";
import { aiService } from "@/services/ai.service";

export default function MenuPage() {
  const { user } = useAuthStore();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [favorites, setFavorites] = useState(new Set()); // Store IDs
  const [selectedFood, setSelectedFood] = useState(null); // Modal State
  
  const items = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const getQuantity = (id) => {
    const item = items.find((i) => (i.id || i._id) === id);
    return item ? item.quantity : 0;
  };

  // Categories list
  const categories = ["All", ...foodCategories];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, favRes] = await Promise.all([
             productService.getProducts(),
             user ? favoriteService.getMyFavorites() : Promise.resolve({ success: false }) 
        ]);

        if (productRes.success) {
          setFoods(productRes.products);
        }

        if (favRes && favRes.success) {
            setFavorites(new Set(favRes.favorites.map(f => f.id || f._id)));
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const toggleFavorite = async (e, food) => {
      e.stopPropagation();
      e.preventDefault();
      if (!user) {
          toast.error("Please login to save favorites");
          return;
      }
      
      const id = food.id || food._id;
      const isFav = favorites.has(id);
      
      try {
          // Optimistic update
          const newFavs = new Set(favorites);
          if(isFav) newFavs.delete(id);
          else newFavs.add(id);
          setFavorites(newFavs);

          if (isFav) {
              await favoriteService.removeFavorite(id);
              toast.info("Removed from favorites");
          } else {
              await favoriteService.addFavorite(id);
              toast.success("Added to favorites");
          }
      } catch (error) {
          // Revert on error
          setFavorites(new Set(favorites)); 
          toast.error("Failed to update favorite");
      }
  };

  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSmartSearch = async () => {
    if (!searchTerm.trim()) {
       setSearchResults(null);
       return;
    }
    
    setIsSearching(true);
    try {
       const data = await aiService.search(searchTerm);
       
       if (data.success) {
           setSearchResults(data.items);
           if (category !== "All" && data.items.length > 0) setCategory("All");
       }
    } catch (e) {
       console.error(e);
       toast.error("Smart search failed");
    } finally {
       setIsSearching(false);
    }
  };

  const clearSearch = () => {
      setSearchTerm("");
      setSearchResults(null);
      setCategory("All");
  };

  const filteredFoods = searchResults || foods.filter((food) => {
    const matchesSearch = food.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory = category === "All" || food.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen relative bg-black font-sans">
      {/* Background Image with Blur */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/assets/food-types/biryani.jpg" // Fallback or dynamic bg
          alt="Background"
          fill
          className="object-cover opacity-60"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 pt-24 px-4 md:px-12 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Explore Our <span className="text-primary-gold">Menu</span>
            </h1>
            <p className="text-gray-300">
              Discover authentic flavors crafted with passion.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full sm:w-48 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary-gold appearance-none cursor-pointer hover:bg-white/20 transition-colors"
                aria-label="Filter by Category"
              >
                {categories.map((cat) => (
                  <option
                    key={cat}
                    value={cat}
                    className="bg-gray-900 text-white"
                  >
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary-gold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>

            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder='Try "spicy veg dinner"...'
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value === "") setSearchResults(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSmartSearch()}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white pl-12 pr-12 py-3 rounded-xl focus:outline-none focus:border-primary-gold placeholder-gray-400 focus:bg-white/20 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <button 
                onClick={handleSmartSearch}
                disabled={isSearching}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg text-primary-gold transition-colors"
                title="AI Smart Search"
              >
                 {isSearching ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              </button>
              
            </div>
          </div>
        </div>

        {/* Categories Pills (Optional - for quick access visually) */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide mask-fade">
          {categories.slice(1).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full border text-sm whitespace-nowrap transition-all ${
                category === cat
                  ? "bg-primary-gold border-primary-gold text-black font-bold"
                  : "border-white/20 text-gray-300 hover:border-primary-gold hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Food Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-gold"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
            {filteredFoods.length > 0 ? (
              filteredFoods.map((food, index) => {
                const id = food.id || food._id;
                const isFav = favorites.has(id);
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className={`bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-primary-gold/50 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(255,215,0,0.15)] flex flex-col ${!food.isAvailable ? 'grayscale opacity-70' : ''}`}
                    onClick={() => {
                        // Optional: make entire card clickable or just the button
                    }}
                  >
                    <div className="relative h-48 w-full overflow-hidden">
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
                      {/* Rating Badge */}
                      <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-primary-gold px-2 py-1 rounded-full text-xs font-bold border border-primary-gold/30 shadow-lg">
                        ⭐ {food.stars || 4.5}
                      </div>

                      {!food.isAvailable && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                            Out of Stock
                          </span>
                        </div>
                      )}

                      {/* Favorite Button */}
                      <button
                          onClick={(e) => toggleFavorite(e, food)}
                          className={`absolute top-3 left-3 p-2 rounded-full backdrop-blur-sm border transition-all duration-300 ${
                              isFav 
                              ? "bg-red-500 text-white border-red-500 scale-110" 
                              : "bg-black/40 text-gray-300 border-white/10 hover:bg-black/60 hover:text-white"
                          }`}
                      >
                          <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                      </button>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary-gold transition-colors truncate">
                        {food.name}
                      </h3>
                      <p className="text-gray-400 text-xs mb-4 line-clamp-2 grow">
                        {food.description}
                      </p>
                      
                      {/* Read More Link (Replaces View Food button) */}
                       <button
                        onClick={() => setSelectedFood(food)}
                        className="text-sm text-primary-gold hover:text-white transition-colors flex items-center gap-1 font-medium w-fit group/read mb-4"
                      >
                        Read More
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="group-hover/read:translate-x-1 transition-transform"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </button>

                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-2xl font-bold text-primary-gold">
                          ₹{food.price}
                        </span>
                        
                        {!food.isAvailable ? (
                             <button
                             disabled
                             className="px-4 py-2 rounded-xl bg-white/5 text-gray-500 text-sm font-medium cursor-not-allowed border border-white/5"
                           >
                             Unavailable
                           </button>
                        ) : getQuantity(id) > 0 ? (
                          <div className="flex items-center bg-white/10 rounded-full border border-primary-gold/50 overflow-hidden">
                            <button
                              onClick={() =>
                                updateQuantity(id, getQuantity(id) - 1)
                              }
                              className="w-9 h-9 flex items-center justify-center text-white hover:bg-primary-gold hover:text-black transition-colors font-bold text-lg"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-primary-gold font-bold">
                              {getQuantity(id)}
                            </span>
                            <button
                              onClick={() => addToCart(food)}
                              className="w-9 h-9 flex items-center justify-center text-white hover:bg-primary-gold hover:text-black transition-colors font-bold text-lg"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(food)}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary-gold hover:text-black flex items-center justify-center transition-all border border-white/20 hover:border-primary-gold text-white"
                            title="Add to Cart"
                          >
                            <ShoppingCart size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20">
                <p className="text-gray-400 text-xl">
                  No dishes found matching your criteria.
                </p>
                <button
                  onClick={clearSearch}
                  className="mt-4 text-primary-gold hover:underline"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Food Modal for "Read More" */}
      <FoodModal
        food={selectedFood}
        onClose={() => setSelectedFood(null)}
        onAddToCart={addToCart}
        quantity={selectedFood ? getQuantity(selectedFood.id || selectedFood._id) : 0}
        onUpdateQuantity={updateQuantity}
      />
    </div>
  );
}
