"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Pencil } from "lucide-react";
import { productService } from "@/services/product.service";

import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function AdminProductsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts();
      if (response.success) {
        setList(response.products || []);
      } else {
        toast.error("Error fetching list");
      }
    } catch (error) {
      toast.error("Server Error");
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Triggered when user clicks "Delete" icon
  const handleDeleteClick = (id) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // 2. Triggered when user confirms in Modal
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    // Optimistic Update
    const originalList = [...list];
    setList(prev => prev.filter(item => (item._id || item.id) !== productToDelete));

    try {
      const response = await productService.removeProduct(productToDelete);
      if (response.success) {
        toast.success("Food Moved to Trash");
      } else {
        toast.error("Failed to delete");
        setList(originalList); // Rollback
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Server Error");
      setList(originalList); // Rollback
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleToggleAvailability = async (product) => {
      try {
          const newStatus = !product.isAvailable;
          const response = await productService.updateProduct(product._id || product.id, { isAvailable: newStatus });
          if(response.success) {
              toast.success(`Product marked ${newStatus ? 'Available' : 'Unavailable'}`);
              // Optimistic update or refresh
              setList(prev => prev.map(p => (p._id || p.id) === (product._id || product.id) ? {...p, isAvailable: newStatus} : p));
          }
      } catch (error) {
          toast.error("Failed to update status");
      }
  };

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  if (loading) {
    return (
      <div className="text-center py-10 text-primary-gold">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Products Management</h2>
        <div className="flex gap-3">
          <Link
            href="/admin/products/trash"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} />
            View Trash
          </Link>
          <Link
            href="/admin/products/add"
            className="px-4 py-2 bg-primary-gold hover:bg-yellow-500 text-black rounded-lg font-semibold transition-colors"
          >
            + Add Product
          </Link>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">All Foods List</h2>
        </div>

        <div className="min-w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="uppercase tracking-wider border-b border-white/10 bg-black/40">
              <tr>
                <th scope="col" className="px-6 py-4 text-primary-gold font-bold">Image</th>
                <th scope="col" className="px-6 py-4 text-primary-gold font-bold">Name</th>
                <th scope="col" className="px-6 py-4 text-primary-gold font-bold">Category</th>
                <th scope="col" className="px-6 py-4 text-primary-gold font-bold">Price</th>
                <th scope="col" className="px-6 py-4 text-primary-gold font-bold">Stock</th>
                <th scope="col" className="px-6 py-4 text-primary-gold font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {list.length > 0 ? list.map((item) => (
                <tr
                  key={item._id || item.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20">
                      <Image
                        src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-200 font-medium">{item.name}</td>
                  <td className="px-6 py-4 text-gray-400">{item.category}</td>
                  <td className="px-6 py-4 text-white">₹{item.price}</td>
                  <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleAvailability(item)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${item.isAvailable !== false ? 'bg-green-500' : 'bg-gray-600'}`}
                      >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${item.isAvailable !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* Edit Button */}
                      <Link
                        href={`/admin/products/edit/${item._id || item.id}`}
                        className="p-2 text-gray-400 hover:text-primary-gold hover:bg-primary-gold/10 rounded-full transition-colors"
                      >
                        <Pencil size={20} />
                      </Link>
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteClick(item._id || item.id)}
                        className="p-2 text-gray-400 hover:text-primary-red hover:bg-primary-red/10 rounded-full transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                 <tr>
                    <td colSpan="6" className="text-center py-6 text-gray-400">No products found.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? It will be moved to Trash."
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
