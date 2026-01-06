"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store"; // Import Auth
import { productService } from "@/services/product.service";
import { favoriteService } from "@/services/favorite.service"; // Import Favorite Service
import FoodModal from "@/components/ui/FoodModal";
import FoodCard from "@/components/ui/FoodCard";
import Loading from "@/components/ui/Loading";
import { motion } from "framer-motion";
import RecommendedSection from "@/components/user/RecommendedSection";
import { toast } from "react-toastify";
import Link from "next/link"; // Import Toast

export default function Home() {
  const { user } = useAuthStore(); // Get User
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [selectedFood, setSelectedFood] = useState(null);
  const [favorites, setFavorites] = useState(new Set()); // Favorites State

  const items = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const getQuantity = (id) => {
    // Normalize ID for check
    const item = items.find((i) => (i.id || i._id) === id);
    return item ? item.quantity : 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        //await Promise.all([promise1, promise2, promise3]);
        // Promise.all() is used to wait for multiple promises to resolve.
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

  const toggleFavorite = async (food) => {
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

  // Filter Logic
  const filteredFoods =
    category === "All"
      ? foods
      : foods.filter((item) => item.category === category);

  if (loading) return <Loading />; // Optional: show full loading state initially

  return (
    <main className="min-h-screen bg-black font-sans relative">
      {/* Global Standard Background (Visible in non-video sections) */}
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

      {/* Hero Section - Stays on top of fixed background */}
      <section className="relative h-[650px] flex items-center justify-center overflow-hidden z-10">
        {/* Background Video - Need to ensure asset exists, otherwise fallback image */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/assets/videos/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-0"></div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-4 max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg font-sans leading-tight">
            Taste the <span className="text-primary-gold">Golden</span> Era
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            Experience authentic flavors delivered straight to your doorstep.
            Premium quality, unforgettable taste.
          </p>
          <Link
            href="#menu"
            scroll={true}
            className="px-8 py-4 bg-primary-gold text-black font-bold rounded-full text-lg hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-900/40 transform hover:scale-105 inline-block"
          >
            Order Now
          </Link>
        </motion.div>

        {/* Gradient Fade at bottom to blend into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/50 to-transparent z-20"></div>
      </section>

      {/* Explore Menu Categories */}
      <div className="relative z-10">
        <motion.section
          className="py-20 px-4 md:px-12 max-w-7xl mx-auto relative group/section"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.2 }}  // "Play only once". &&  Trigger when 20% visible".
        >
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-4xl font-bold mb-2 font-sans text-white">
                Explore Our <span className="text-primary-gold">Menu</span>
              </h2>
              <p className="text-gray-400">
                Curated lists of dishes from around the world.
              </p>
            </div>

            {/* Navigation Arrows */}
            <div className="hidden md:flex gap-4">
              <button
                className="w-12 h-12 rounded-full border border-primary-gold text-primary-gold flex items-center justify-center hover:bg-primary-gold hover:text-black transition-all"
                onClick={() => {
                  const container = document.getElementById("menu-slider");
                  container.scrollBy({ left: -320, behavior: "smooth" });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                className="w-12 h-12 rounded-full border border-primary-gold text-primary-gold flex items-center justify-center hover:bg-primary-gold hover:text-black transition-all"
                onClick={() => {
                  const container = document.getElementById("menu-slider");
                  // It searches the entire HTML document for the one single element that has the attribute id="menu-slider"
                  container.scrollBy({ left: 320, behavior: "smooth" });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Slider Container */}
          <div
            id="menu-slider"
            className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {[
              { name: "Pizza", img: "/assets/food-types/pizza.jpg" },
              { name: "Burger", img: "/assets/food-types/burger.jpg" },
              { name: "Sandwich", img: "/assets/food-types/sandwich.jpg" },
              { name: "Rolls", img: "/assets/food-types/rolls.jpg" },
              { name: "Biryani", img: "/assets/food-types/biryani.jpg" },
              { name: "Sweets", img: "/assets/food-types/sweets.jpg" },
              { name: "Drinks", img: "/assets/food-types/bubbleTea.jpg" },
              { name: "Ice Cream", img: "/assets/food-types/icecream.jpg" },
              {
                name: "Butter Chicken",
                img: "/assets/food-types/butterChicken.jpg",
              },
              { name: "Salad", img: "/assets/food-types/salad.webp" },
              { name: "Samosa", img: "/assets/food-types/samosa.webp" },
            ].map((item, index) => (   // Index= This is the position number (counter)
              <motion.div
                key={index} // It is used to uniquely identify each element in the array.
                className={`min-w-[280px] md:min-w-[320px] snap-start group cursor-pointer border rounded-3xl p-3 transition-all ${
                  category === item.name
                    ? "border-primary-gold bg-white/10"
                    : "border-white/10 bg-black/40 hover:border-white/30"
                }`}
                //  ` ${} ` It allows you to inject dynamic JavaScript variables or logic directly into a string. 
                // You must use backticks (`) for this to work,
                onClick={() =>
                  setCategory((prev) => //puts the current state value into the prev variable.
                    prev === item.name ? "All" : item.name
                  )
                }
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="relative h-48 w-full rounded-2xl overflow-hidden mb-4">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 transition-opacity group-hover:opacity-0"></div>
                  <Image
                    src={item.img}
                    alt={item.name}
                    fill
                    className="object-cover transform group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 320px"
                    priority={index < 4} //Load these specific images IMMEDIATELY, even before the rest of the page finishes processing."
                  />
                </div>

                <div className="flex justify-between items-center px-2 pb-2">
                  <h3
                    className={`text-xl font-bold transition-colors ${
                      category === item.name
                        ? "text-primary-gold"
                        : "text-white"
                    }`}
                  >
                    {item.name}
                  </h3>
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      category === item.name
                        ? "bg-primary-gold text-black"
                        : "bg-white/10 text-white group-hover:bg-primary-gold group-hover:text-black"
                    }`}
                  >
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
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Menu Section */}
        <section id="menu" className="pb-20 px-4 md:px-12 max-w-7xl mx-auto">
          {/* AI Recommendations */}
          <RecommendedSection onSelect={setSelectedFood} />

          <h2 className="text-4xl font-bold text-center mb-12 text-white">
            Delicious <span className="text-primary-gold">Delights</span>
          </h2>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            layout
          >
            {filteredFoods.length > 0 ? (
              filteredFoods.slice(0, 16).map((food, index) => (
                <FoodCard
                  key={food.id || food._id}
                  food={food}
                  index={index}
                  onSelect={setSelectedFood}
                  addToCart={addToCart}
                  updateQuantity={updateQuantity}
                  quantity={getQuantity(food.id || food._id)}
                  isFavorite={favorites.has(food.id || food._id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-400 py-10">
                No items found. Check back later!
              </div>
            )}
          </motion.div>
        </section>
      </div>
      <FoodModal
        food={selectedFood}
        onClose={() => setSelectedFood(null)}
        onAddToCart={addToCart}
        quantity={selectedFood ? getQuantity(selectedFood.id || selectedFood._id) : 0}
        onUpdateQuantity={updateQuantity}
      />
    </main>
  );
}
