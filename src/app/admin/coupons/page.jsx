"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Plus, Edit, Trash2, Tag, Calendar, Percent, DollarSign } from "lucide-react";
import { auth } from "@/lib/firebase/client";

const getAuthHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    type: "percentage",
    value: "",
    minAmount: "",
    maxDiscount: "",
    expiry: "",
    isActive: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/coupons", { headers });
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: Number(formData.value),
        minAmount: Number(formData.minAmount) || 0,
        maxDiscount: formData.type === "percentage" ? Number(formData.maxDiscount) || null : null,
        expiry: formData.expiry ? new Date(formData.expiry).toISOString() : null,
        isActive: formData.isActive,
      };

      const url = editingCoupon
        ? `/api/admin/coupons/${editingCoupon.id}`
        : "/api/admin/coupons";
      const method = editingCoupon ? "PUT" : "POST";

      const headers = await getAuthHeaders();
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingCoupon ? "Coupon updated" : "Coupon created");
        setIsModalOpen(false);
        resetForm();
        fetchCoupons();
      }
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        toast.success("Coupon deleted");
        fetchCoupons();
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleToggle = async (coupon) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ ...coupon, isActive: !coupon.isActive }),
      });
      if (res.ok) {
        toast.success(coupon.isActive ? "Deactivated" : "Activated");
        fetchCoupons();
      }
    } catch (error) {
      toast.error("Failed to toggle");
    }
  };

  const openAdd = () => {
    resetForm();
    setEditingCoupon(null);
    setIsModalOpen(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minAmount: coupon.minAmount || "",
      maxDiscount: coupon.maxDiscount || "",
      expiry: coupon.expiry ? coupon.expiry.split("T")[0] : "",
      isActive: coupon.isActive,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      type: "percentage",
      value: "",
      minAmount: "",
      maxDiscount: "",
      expiry: "",
      isActive: true,
    });
  };

  if (loading) {
    return <div className="text-center py-10 text-white">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          Promo <span className="text-primary-gold">Coupons</span>
        </h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary-gold text-black rounded-lg font-bold hover:bg-yellow-500 transition-colors"
        >
          <Plus size={20} /> Add Coupon
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="uppercase tracking-wider border-b border-white/10 bg-black/40">
            <tr>
              <th className="px-6 py-4 text-primary-gold font-bold">Code</th>
              <th className="px-6 py-4 text-primary-gold font-bold">Type</th>
              <th className="px-6 py-4 text-primary-gold font-bold">Value</th>
              <th className="px-6 py-4 text-primary-gold font-bold">Min Amount</th>
              <th className="px-6 py-4 text-primary-gold font-bold">Expiry</th>
              <th className="px-6 py-4 text-primary-gold font-bold">Status</th>
              <th className="px-6 py-4 text-primary-gold font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-white font-bold">{coupon.code}</td>
                <td className="px-6 py-4 text-gray-400 capitalize">{coupon.type}</td>
                <td className="px-6 py-4 text-white">
                  {coupon.type === "percentage" ? `${coupon.value}%` : `₹${coupon.value}`}
                  {coupon.maxDiscount && <span className="text-xs text-gray-500 ml-1">(max ₹{coupon.maxDiscount})</span>}
                </td>
                <td className="px-6 py-4 text-gray-400">₹{coupon.minAmount || 0}</td>
                <td className="px-6 py-4 text-gray-400 text-xs">
                  {coupon.expiry ? (() => {
                    const date = coupon.expiry.seconds ? new Date(coupon.expiry.seconds * 1000) : new Date(coupon.expiry);
                    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
                  })() : "No expiry"}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggle(coupon)}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      coupon.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {coupon.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(coupon)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && (
          <div className="text-center py-10 text-gray-500">No coupons found. Create one!</div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingCoupon ? "Edit Coupon" : "Add New Coupon"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Coupon Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white outline-none focus:border-primary-gold uppercase"
                  placeholder="SAVE20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white outline-none focus:border-primary-gold"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat Amount</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Value * {formData.type === "percentage" ? "(%)" : "(₹)"}
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white outline-none focus:border-primary-gold"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Min Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white outline-none focus:border-primary-gold"
                    min="0"
                  />
                </div>
                {formData.type === "percentage" && (
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Max Discount (₹)</label>
                    <input
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white outline-none focus:border-primary-gold"
                      min="0"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiry}
                  onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                  className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white outline-none focus:border-primary-gold"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 accent-primary-gold"
                />
                <label htmlFor="isActive" className="text-white cursor-pointer">Active</label>
              </div>

              <div className="flex gap-4 mt-8 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary-gold text-black rounded-lg hover:bg-yellow-500 font-bold transition-colors"
                >
                  {editingCoupon ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
