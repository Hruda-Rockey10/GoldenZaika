"use client";

import { useState, useEffect } from "react";
import { zoneService } from "@/services/zone.service";
import { Trash2, Edit, Plus, MapPin } from "lucide-react";
import { toast } from "react-toastify";

export default function ZonesPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    pincodes: "", // comma separated string for input
    deliveryFee: "",
    minOrderAmount: "",
  });

  const fetchZones = async () => {
    try {
      const res = await zoneService.getAllZones();
      if (res.success) {
        setZones(res.zones);
      }
    } catch (error) {
      toast.error("Failed to fetch zones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        pincodes: formData.pincodes.split(",").map(p => p.trim()).filter(Boolean),
        deliveryFee: Number(formData.deliveryFee),
        minOrderAmount: Number(formData.minOrderAmount),
      };

      if (payload.pincodes.length === 0) {
        toast.error("At least one valid pincode is required");
        return;
      }

      if (editingZone) {
        await zoneService.updateZone(editingZone.id, payload);
        toast.success("Zone updated successfully");
      } else {
        await zoneService.createZone(payload);
        toast.success("Zone created successfully");
      }
      
      setIsModalOpen(false);
      setEditingZone(null);
      setFormData({ name: "", pincodes: "", deliveryFee: "", minOrderAmount: "" });
      fetchZones();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This might affect service availability checks.")) return;
    try {
      await zoneService.deleteZone(id);
      toast.success("Zone deleted");
      fetchZones();
    } catch (error) {
      toast.error("Failed to delete zone");
    }
  };

  const openEdit = (zone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      pincodes: zone.pincodes.join(", "),
      deliveryFee: zone.deliveryFee,
      minOrderAmount: zone.minOrderAmount || 0,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Delivery <span className="text-primary-gold">Zones</span></h1>
        <button 
          onClick={() => {
            setEditingZone(null);
            setFormData({ name: "", pincodes: "", deliveryFee: "", minOrderAmount: "" });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-gold text-black rounded-lg font-bold hover:bg-yellow-500 transition-colors"
        >
          <Plus size={20} /> Add Zone
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
           <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-gold"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map(zone => (
            <div key={zone.id} className="bg-white/5 border border-white/10 p-6 rounded-xl hover:border-primary-gold/50 transition-all">
               <div className="flex justify-between items-start mb-4">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <MapPin size={18} className="text-primary-gold"/> {zone.name}
                 </h3>
                 <div className="flex gap-2">
                    <button onClick={() => openEdit(zone)} className="text-blue-400 hover:text-blue-300 p-1"><Edit size={18}/></button>
                    <button onClick={() => handleDelete(zone.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={18}/></button>
                 </div>
               </div>
               <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>Delivery Fee</span>
                      <span className="text-white font-bold">₹{zone.deliveryFee}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>Min Order</span>
                      <span className="text-white font-bold">₹{zone.minOrderAmount}</span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Covered Pincodes</span>
                      <span className="text-primary-gold number">{zone.pincodes.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {zone.pincodes.slice(0, 5).map(p => (
                            <span key={p} className="px-2 py-1 bg-black/40 border border-white/5 rounded text-xs">{p}</span>
                        ))}
                        {zone.pincodes.length > 5 && <span className="px-2 py-1 bg-black/40 border border-white/5 rounded text-xs">+{zone.pincodes.length - 5}</span>}
                    </div>
                  </div>
               </div>
            </div>
          ))}
          {zones.length === 0 && (
             <div className="col-span-full text-center py-10 text-gray-500">
                No service zones defined. Add one to enable delivery checks.
             </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
            <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
                ✕
            </button>
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                {editingZone ? "Edit Zone" : "Add New Zone"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 font-medium mb-1 block">Zone Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-primary-gold outline-none focus:ring-1 focus:ring-primary-gold/50"
                  placeholder="e.g. Downtown Area"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 font-medium mb-1 block">Delivery Fee (₹)</label>
                    <input 
                      type="number" 
                      value={formData.deliveryFee} 
                      onChange={e => setFormData({...formData, deliveryFee: e.target.value})}
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-primary-gold outline-none focus:ring-1 focus:ring-primary-gold/50"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 font-medium mb-1 block">Min Order (₹)</label>
                    <input 
                      type="number" 
                      value={formData.minOrderAmount} 
                      onChange={e => setFormData({...formData, minOrderAmount: e.target.value})}
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-primary-gold outline-none focus:ring-1 focus:ring-primary-gold/50"
                      min="0"
                      required
                    />
                  </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 font-medium mb-1 block">Pincodes <span className="text-xs opacity-50">(comma separated)</span></label>
                <textarea 
                  value={formData.pincodes} 
                  onChange={e => setFormData({...formData, pincodes: e.target.value})}
                  className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-primary-gold outline-none focus:ring-1 focus:ring-primary-gold/50 h-32 resize-none font-mono text-sm"
                  placeholder="751001, 751002, 751003"
                  required
                />
              </div>
              <div className="flex gap-4 mt-8 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 font-bold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary-gold text-black rounded-lg hover:bg-yellow-500 font-bold transition-colors shadow-lg shadow-yellow-900/20">Save Zone</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
