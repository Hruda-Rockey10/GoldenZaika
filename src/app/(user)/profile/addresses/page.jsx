"use client";

import { useState, useEffect } from "react";
import { addressService } from "@/services/address.service";
import { Trash2, Edit, Plus, MapPin, Check, Home, Briefcase } from "lucide-react";
import { toast } from "react-toastify";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AddressesPage() {
  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    label: "Home",
    street: "",
    city: "",
    state: "Odisha", // Default
    zip: "",
    phone: "",
    isDefault: false,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        fetchAddresses();
      }
    }
  }, [user, authLoading, router]);

  const fetchAddresses = async () => {
    try {
      const res = await addressService.getMyAddresses();
      if (res.success) {
        setAddresses(res.addresses);
      }
    } catch (error) {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAddress) {
        await addressService.updateAddress(editingAddress.id, formData);
        toast.success("Address updated");
      } else {
        await addressService.addAddress(formData);
        toast.success("Address added");
      }
      setIsModalOpen(false);
      fetchAddresses();
    } catch (error) {
       toast.error(error.message || "Failed to save address");
    } finally {
       setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Delete this address?")) return;
    try {
        await addressService.deleteAddress(id);
        toast.success("Address deleted");
        fetchAddresses();
    } catch (error) {
        toast.error("Failed to delete");
    }
  };

  const openAdd = () => {
    setEditingAddress(null);
    setFormData({
        label: "Home",
        street: "",
        city: "Bhubaneswar", // Default city
        state: "Odisha",
        zip: "",
        phone: user?.phoneNumber || "",
        isDefault: addresses.length === 0, // Default if first
    });
    setIsModalOpen(true);
  };

  const openEdit = (addr) => {
      setEditingAddress(addr);
      setFormData({
          label: addr.label,
          street: addr.street,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          phone: addr.phone,
          isDefault: addr.isDefault,
      });
      setIsModalOpen(true);
  };

  if (loading || authLoading) return <div className="min-h-screen bg-black pt-24 text-white text-center">Loading...</div>;

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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
            <div>
                <h1 className="text-3xl font-bold text-white">My <span className="text-primary-gold">Addresses</span></h1>
                <p className="text-gray-400 text-sm mt-1">Manage your delivery locations</p>
            </div>
            <button 
                onClick={openAdd}
                className="flex items-center gap-2 px-6 py-3 bg-primary-gold text-black rounded-full font-bold hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-900/20"
            >
                <Plus size={20} /> Add New
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
                <div key={addr.id} className={`bg-white/5 border ${addr.isDefault ? 'border-primary-gold' : 'border-white/10'} p-6 rounded-2xl hover:border-primary-gold/50 transition-all relative group`}>
                    {addr.isDefault && (
                        <div className="absolute top-4 right-4 bg-primary-gold text-black text-xs font-bold px-2 py-1 rounded">Default</div>
                    )}
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-white/10 rounded-full text-primary-gold">
                            {addr.label === 'Work' ? <Briefcase size={20} /> : <Home size={20} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white capitalize">{addr.label}</h3>
                            <p className="text-gray-400 text-sm">{addr.phone}</p>
                        </div>
                    </div>
                    
                    <div className="text-gray-300 text-sm space-y-1 mb-6">
                        <p>{addr.street}</p>
                        <p>{addr.city}, {addr.state} - {addr.zip}</p>
                    </div>

                    <div className="flex gap-3 border-t border-white/10 pt-4">
                        <button 
                            onClick={() => openEdit(addr)}
                            className="flex-1 py-2 bg-white/5 rounded-lg text-sm font-bold text-white hover:bg-white/10 transition-colors"
                        >
                            Edit
                        </button>
                        <button 
                             onClick={() => handleDelete(addr.id)}
                            className="px-4 py-2 bg-red-500/10 rounded-lg text-sm font-bold text-red-500 hover:bg-red-500/20 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            ))}

            {addresses.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                    <MapPin className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-gray-400 mb-6">No saved addresses found.</p>
                    <button onClick={openAdd} className="text-primary-gold font-bold hover:underline">Add your first address</button>
                </div>
            )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl relative overflow-y-auto max-h-[90vh]">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <MapPin className="text-primary-gold" />
                    {editingAddress ? "Edit Address" : "New Address"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-sm text-gray-400 block mb-1">Label</label>
                            <select 
                                value={formData.label}
                                onChange={e => setFormData({...formData, label: e.target.value})}
                                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-primary-gold"
                            >
                                <option value="Home">Home</option>
                                <option value="Work">Work</option>
                                <option value="Other">Other</option>
                            </select>
                         </div>
                         <div>
                            <label className="text-sm text-gray-400 block mb-1">Phone</label>
                            <input 
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-primary-gold"
                                required
                            />
                         </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Street Address</label>
                        <input 
                            type="text"
                            value={formData.street}
                            placeholder="House No, Area, Landmark"
                            onChange={e => setFormData({...formData, street: e.target.value})}
                            className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-primary-gold"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">City</label>
                            <input 
                                type="text"
                                value={formData.city}
                                onChange={e => setFormData({...formData, city: e.target.value})}
                                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-primary-gold"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Pincode</label>
                            <input 
                                type="text"
                                value={formData.zip}
                                onChange={e => setFormData({...formData, zip: e.target.value})}
                                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-primary-gold"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox"
                            id="isDefault"
                            checked={formData.isDefault}
                            onChange={e => setFormData({...formData, isDefault: e.target.checked})}
                            className="w-5 h-5 accent-primary-gold rounded bg-black/40 border-white/20"
                        />
                        <label htmlFor="isDefault" className="text-white cursor-pointer select-none">Set as default address</label>
                    </div>

                    <div className="flex gap-4 mt-8 pt-4 border-t border-white/10">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors">Cancel</button>
                        <button type="submit" disabled={submitting} className="flex-1 py-4 bg-primary-gold text-black rounded-xl font-bold hover:bg-yellow-500 transition-colors shadow-lg">
                            {submitting ? "Saving..." : "Save Address"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
      </div>
    </div>
  );
}
