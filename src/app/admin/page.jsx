"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Users, ShoppingBag, CreditCard, Activity, Clock } from "lucide-react";
import { orderService } from "@/services/order.service";
import { authService } from "@/services/auth.service";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingOrders: 0, // New field
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Fetch Order Analytics
      const orderRes = await orderService.getOrderAnalytics();
      let totalOrders = 0;
      let totalRevenue = 0;
      let pendingOrders = 0;

      if (orderRes.success) {
        totalOrders = orderRes.data.totalOrders;
        totalRevenue = orderRes.data.totalRevenue;
        pendingOrders = orderRes.data.pendingOrders || 0; // Get pending
      }
      
      let activeUsers = 0;
      if (orderRes.success && orderRes.data.activeUsers !== undefined) {
         activeUsers = orderRes.data.activeUsers;
      } else {
         const userRes = await authService.getUserStats();
         if (userRes.success) {
            activeUsers = userRes.count;
         }
      }

      setStats({
        totalOrders,
        totalRevenue,
        activeUsers,
        pendingOrders,
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-gold"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8 font-sans">
        Dashboard <span className="text-primary-gold">Overview</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-lg hover:border-primary-gold/50 transition-all group backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
                Total Orders
              </p>
              <h3 className="text-3xl font-bold text-white mt-1 group-hover:text-primary-gold transition-colors">
                {stats.totalOrders}
              </h3>
            </div>
            <div className="p-3 bg-primary-gold/10 rounded-xl text-primary-gold group-hover:bg-primary-gold group-hover:text-black transition-all">
              <ShoppingBag size={24} />
            </div>
          </div>
          <div className="flex items-center text-sm text-green-400">
            <Activity size={16} className="mr-1" />
            <span>Updates live</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-lg hover:border-primary-gold/50 transition-all group backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
                Pending
              </p>
              <h3 className="text-3xl font-bold text-white mt-1 group-hover:text-orange-500 transition-colors">
                {stats.pendingOrders}
              </h3>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500 group-hover:bg-orange-500 group-hover:text-black transition-all">
              <Clock size={24} /> 
            </div>
          </div>
          <div className="flex items-center text-sm text-orange-400">
             <span>Needs Attention</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-lg hover:border-primary-gold/50 transition-all group backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
                Total Revenue
              </p>
              <h3 className="text-3xl font-bold text-white mt-1 group-hover:text-primary-gold transition-colors">
                ₹{stats.totalRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl text-green-500 group-hover:bg-green-500 group-hover:text-black transition-all">
              <CreditCard size={24} />
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <span>Gross metrics</span>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-lg hover:border-primary-gold/50 transition-all group backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
                Total Users
              </p>
              <h3 className="text-3xl font-bold text-white mt-1 group-hover:text-primary-gold transition-colors">
                {stats.activeUsers}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-black transition-all">
              <Users size={24} />
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <span>Registered accounts</span>
          </div>
        </div>
      </div>

      <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl shadow-xl p-8 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <Activity className="mr-2 text-primary-gold" /> System Status
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
            <span className="text-gray-300">Order Service</span>
            <span className="text-green-500 font-semibold px-3 py-1 bg-green-500/10 rounded-full text-sm">
              Operational
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
            <span className="text-gray-300">Auth Service</span>
            <span className="text-green-500 font-semibold px-3 py-1 bg-green-500/10 rounded-full text-sm">
              Operational
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
            <span className="text-gray-300">Database</span>
            <span className="text-green-500 font-semibold px-3 py-1 bg-green-500/10 rounded-full text-sm">
              Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
