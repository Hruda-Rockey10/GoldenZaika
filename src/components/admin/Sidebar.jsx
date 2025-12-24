"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, ShoppingBag, LogOut, Mail, Package, MapPin, Ticket } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Orders", href: "/admin/orders", icon: Package },
    { name: "All Products", href: "/admin/products", icon: ShoppingBag },
    { name: "Add Product", href: "/admin/products/add", icon: PlusCircle },
    { name: "Coupons", href: "/admin/coupons", icon: Ticket },
    { name: "Messages", href: "/admin/messages", icon: Mail },
    { name: "Delivery Zones", href: "/admin/zones", icon: MapPin },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="w-64 bg-glass-bg backdrop-blur-md border-r border-white/10 min-h-screen text-white flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold font-sans">
          <span className="text-primary-gold">Admin</span> Panel
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-primary-gold text-black font-bold shadow-lg shadow-yellow-900/20"
                  : "hover:bg-white/10 text-gray-300 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-gray-300 hover:bg-primary-red/20 hover:text-primary-red transition-all"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
