"use client";

import Link from "next/link";
import { ShoppingCart, User, LogOut, ShoppingBag, MapPin, Heart, UserCircle } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/services/auth.service";
import { useEffect, useState } from "react";
import { usePathname, useRouter} from "next/navigation";
export default function Navbar() {
  const { user, role } = useAuthStore();
  const cartItemsCount = useCartStore((state) => state.getTotalItems());
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    
    // Wait for Firebase onAuthStateChanged to update Zustand store
    await new Promise(resolve => setTimeout(resolve, 300));
    
    router.push('/login');
    router.refresh(); // Force re-render to pick up auth state
  };

  const isActive = (path) => pathname === path;

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-glass-bg backdrop-blur-md border-b border-white/20 px-8 py-4 flex justify-between items-center transition-all duration-300">
      {/* Logo */}
      <Link href="/" className="text-2xl font-bold font-sans tracking-wide">
        <span className="text-primary-gold">Golden</span>
        <span className="text-white">Zaika</span>
      </Link>

      {/* Nav Links */}
      <div className="hidden md:flex space-x-8 text-white font-medium">
        <Link
          href="/"
          className={`transition-colors relative group ${
            isActive("/") ? "text-primary-gold" : "hover:text-primary-gold"
          }`}
        >
          Home
          {isActive("/") && (
            <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-primary-gold rounded-full"></span>
          )}
        </Link>
        <Link
          href="/menu"
          className={`transition-colors relative group ${
            isActive("/menu")
              ? "text-primary-gold"
              : "hover:text-primary-gold"
          }`}
        >
          Menu
          {isActive("/menu") && (
            <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-primary-gold rounded-full"></span>
          )}
        </Link>
        <Link
          href="/orders"
          className={`transition-colors relative group ${
            isActive("/orders")
              ? "text-primary-gold"
              : "hover:text-primary-gold"
          }`}
        >
          My Orders
          {isActive("/orders") && (
            <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-primary-gold rounded-full"></span>
          )}
        </Link>
        <Link
          href="/contact"
          className={`transition-colors relative group ${
            isActive("/contact")
              ? "text-primary-gold"
              : "hover:text-primary-gold"
          }`}
        >
          Contact
          {isActive("/contact") && (
            <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-primary-gold rounded-full"></span>
          )}
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-6">
        {/* Cart Icon */}
        <Link href="/cart" className="relative group">
          <ShoppingCart className="w-6 h-6 text-white group-hover:text-primary-gold transition-colors" />
          {/* Badge Placeholder */}
          {mounted && cartItemsCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary-gold text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {cartItemsCount}
            </span>
          )}
        </Link>

        {/* Auth Buttons */}
        {user ? (
          <div className="relative group">
            <button className="flex items-center space-x-2 focus:outline-none">
              <div className="w-10 h-10 rounded-full bg-primary-gold border border-primary-gold flex items-center justify-center text-black shadow-lg hover:bg-yellow-400 transition-all transform hover:scale-105">
                <User size={20} absoluteStrokeWidth={true} strokeWidth={2.5} />
              </div>
            </button>

            {/* Dropdown - Swiggy Style */}
            <div className="absolute right-0 mt-2 w-56 bg-black/95 border border-primary-gold/30 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right overflow-hidden">
              <div className="py-2">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="font-bold text-white truncate">
                    {user.displayName || "User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>

                {/* Profile Links */}
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-primary-gold hover:text-black transition-colors"
                >
                  <UserCircle size={18} />
                  <span className="font-medium">My Profile</span>
                </Link>

                <Link
                  href="/orders"
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-primary-gold hover:text-black transition-colors"
                >
                  <ShoppingBag size={18} />
                  <span className="font-medium">My Orders</span>
                </Link>

                <Link
                  href="/profile/addresses"
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-primary-gold hover:text-black transition-colors"
                >
                  <MapPin size={18} />
                  <span className="font-medium">Addresses</span>
                </Link>

                <Link
                  href="/profile/favorites"
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-primary-gold hover:text-black transition-colors"
                >
                  <Heart size={18} />
                  <span className="font-medium">Favorites</span>
                </Link>

                {/* Admin Panel (if admin) */}
                {role === "admin" && (
                  <>
                    <div className="border-t border-white/10 my-2"></div>
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-3 text-primary-gold hover:bg-primary-gold hover:text-black transition-colors font-semibold"
                    >
                      <User size={18} />
                      <span>Admin Panel</span>
                    </Link>
                  </>
                )}

                {/* Logout */}
                <div className="border-t border-white/10 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <LogOut size={18} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Link
              href="/register"
              className="hidden sm:block px-6 py-2 rounded-full bg-primary-gold text-black font-semibold hover:bg-yellow-500 transition-all"
            >
              Signup
            </Link>
            <Link
              href="/login"
              className="px-6 py-2 rounded-full border border-primary-gold text-primary-gold font-semibold hover:bg-primary-gold hover:text-black transition-all"
            >
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
