"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import { orderService } from "@/services/order.service";
import { favoriteService } from "@/services/favorite.service";
import { addressService } from "@/services/address.service";
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  Heart, 
  Settings, 
  LogOut,
  ChevronRight,
  Package,
  Loader2
} from "lucide-react";
import { toast } from "react-toastify";
import Image from "next/image";

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuthStore();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    ordersCount: 0,
    favoritesCount: 0,
    addressesCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        fetchProfileData();
      }
    }
  }, [user, authLoading, router]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [ordersRes, favoritesRes, addressesRes] = await Promise.all([
        orderService.getMyOrders().catch(() => ({ success: false, orders: [] })),
        favoriteService.getMyFavorites().catch(() => ({ success: false, favorites: [] })),
        addressService.getMyAddresses().catch(() => ({ success: false, addresses: [] })),
      ]);

      setStats({
        ordersCount: ordersRes.orders?.length || 0,
        favoritesCount: favoritesRes.favorites?.length || 0,
        addressesCount: addressesRes.addresses?.length || 0,
      });

      // Get recent 3 orders
      setRecentOrders((ordersRes.orders || []).slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logout();
      toast.success("Logged out successfully");
      router.push("/");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-gold animate-spin" />
      </div>
    );
  }

  const quickActions = [
    {
      icon: ShoppingBag,
      title: "My Orders",
      count: stats.ordersCount,
      href: "/orders",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: MapPin,
      title: "Addresses",
      count: stats.addressesCount,
      href: "/profile/addresses",
      color: "from-green-500 to-green-600",
    },
    {
      icon: Heart,
      title: "Favorites",
      count: stats.favoritesCount,
      href: "/profile/favorites",
      color: "from-red-500 to-red-600",
    },
  ];

  return (
    <div className="min-h-screen relative bg-black font-sans">
      {/* Background Image */}
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
      <div className="max-w-6xl mx-auto">
        {/* User Info Card */}
        <div className="bg-gradient-to-br from-primary-gold/10 to-yellow-600/5 border border-primary-gold/20 rounded-3xl p-8 mb-8">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-primary-gold flex items-center justify-center text-black text-3xl font-bold">
              {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            
            {/* User Details */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-1">
                {user?.displayName || "Guest User"}
              </h1>
              <p className="text-gray-400">{user?.email}</p>
              {user?.phoneNumber && (
                <p className="text-gray-400 text-sm mt-1">📱 {user.phoneNumber}</p>
              )}
            </div>

            {/* Edit Button */}
            <Link
              href="/profile/settings"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Settings size={18} />
              Settings
            </Link>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group bg-white/5 border border-white/10 hover:border-primary-gold/50 rounded-2xl p-6 transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color}`}>
                  <action.icon className="text-white" size={24} />
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-primary-gold transition-colors" size={20} />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1">{action.title}</h3>
              <p className="text-2xl font-bold text-primary-gold">{action.count}</p>
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Orders</h2>
              <Link
                href="/orders"
                className="text-primary-gold hover:underline font-semibold flex items-center gap-1"
              >
                View All <ChevronRight size={18} />
              </Link>
            </div>

            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5 hover:border-primary-gold/30"
                >
                  <div className="p-3 bg-primary-gold/10 rounded-lg">
                    <Package className="text-primary-gold" size={24} />
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      Order #{order.orderId || order.id?.slice(0, 8)}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {order.items?.length || 0} items • ₹{order.total}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                      order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
