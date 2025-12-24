"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { productService } from "@/services/product.service";

import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function ProductTrashPage() {
  const router = useRouter();
  const [trashedProducts, setTrashedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [confirmState, setConfirmState] = useState({
      isOpen: false,
      type: null, // "RESTORE" or "DELETE"
      id: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchTrashedProducts = async () => {
    try {
      setLoading(true);
      // Fetch all products including inactive ones
      const response = await productService.getTrashedProducts();
      if (response.success) {
        setTrashedProducts(response.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch trashed products:", error);
      toast.error("Failed to load trash");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashedProducts();
  }, []);

  // 1. Open Modals
  const onRestoreClick = (id) => {
      setConfirmState({ isOpen: true, type: "RESTORE", id });
  };
  
  const onDeleteClick = (id) => {
      setConfirmState({ isOpen: true, type: "DELETE", id });
  };

  // 2. Handle Actions
  const handleConfirmAction = async () => {
      if(!confirmState.id) return;

      setIsProcessing(true);
      const { type, id } = confirmState;
      const originalList = [...trashedProducts];

      // Optimistic Update
      setTrashedProducts(prev => prev.filter(p => (p._id || p.id) !== id));

      try {
          if (type === "RESTORE") {
              const response = await productService.restoreProduct(id);
              if (response.success) {
                  toast.success("Product restored successfully!");
              } else {
                  throw new Error("Failed to restore");
              }
          } else if (type === "DELETE") {
              const response = await productService.permanentDeleteProduct(id);
              if (response.success) {
                  toast.success("Product permanently deleted");
              } else {
                  throw new Error("Failed to delete");
              }
          }
      } catch (error) {
          console.error("Action error:", error);
          toast.error(`Failed to ${type === "RESTORE" ? "restore" : "delete"}`);
          setTrashedProducts(originalList); // Rollback
      } finally {
          setIsProcessing(false);
          setConfirmState({ isOpen: false, type: null, id: null });
      }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-gold"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/products"
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="text-white" size={24} />
        </Link>
        <h1 className="text-3xl font-bold text-white">
          Product <span className="text-primary-gold">Trash</span>
        </h1>
        <span className="px-3 py-1 bg-white/10 text-gray-400 rounded-full text-sm">
          {trashedProducts.length} items
        </span>
      </div>

      {trashedProducts.length === 0 ? (
        <div className="text-center py-20">
          <Trash2 className="mx-auto text-gray-600 mb-4" size={64} />
          <p className="text-gray-400 text-lg">Trash is empty</p>
          <p className="text-gray-500 text-sm mt-2">Deleted products will appear here</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
          <div className="min-w-full overflow-x-auto">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="uppercase tracking-wider border-b border-white/10 bg-black/40">
                <tr>
                  <th scope="col" className="px-6 py-4 text-primary-gold font-bold">Image</th>
                  <th scope="col" className="px-6 py-4 text-primary-gold font-bold">Name</th>
                  <th scope="col" className="px-6 py-4 text-primary-gold font-bold">Category</th>
                  <th scope="col" className="px-6 py-4 text-primary-gold font-bold">Price</th>
                  <th scope="col" className="px-6 py-4 text-primary-gold font-bold">Deleted</th>
                  <th scope="col" className="px-6 py-4 text-primary-gold font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {trashedProducts.map((item) => (
                  <tr
                    key={item._id || item.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20 opacity-60">
                        <Image
                          src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                          alt={item.name}
                          fill
                          className="object-cover grayscale"
                          sizes="48px"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-medium line-through">{item.name}</td>
                    <td className="px-6 py-4 text-gray-500">{item.category}</td>
                    <td className="px-6 py-4 text-gray-500">₹{item.price}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {item.deletedAt ? (() => {
                        const date = item.deletedAt.seconds 
                          ? new Date(item.deletedAt.seconds * 1000)
                          : item.deletedAt._seconds
                          ? new Date(item.deletedAt._seconds * 1000)
                          : new Date(item.deletedAt);
                        return isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
                      })() : "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Restore Button */}
                        <button
                          onClick={() => onRestoreClick(item._id || item.id)}
                          className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-full transition-colors"
                          title="Restore product"
                        >
                          <RotateCcw size={20} />
                        </button>
                        {/* Permanent Delete Button */}
                        <button
                          onClick={() => onDeleteClick(item._id || item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                          title="Delete permanently"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={confirmState.type === "RESTORE" ? "Restore Product?" : "Permanent Delete"}
        message={
            confirmState.type === "RESTORE" 
            ? "This will move the product back to the active list." 
            : "⚠️ Warning: This action cannot be undone. The product will be permanently removed from the database."
        }
        confirmText={confirmState.type === "RESTORE" ? "Restore" : "Delete Permanently"}
        isDestructive={confirmState.type === "DELETE"}
        isLoading={isProcessing}
      />
    </div>
  );
}
