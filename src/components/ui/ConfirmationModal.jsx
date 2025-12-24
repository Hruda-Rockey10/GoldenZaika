"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {isDestructive && <AlertTriangle className="text-red-500" size={24} />}
                  {title}
                </h3>
                <button 
                  onClick={onClose}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-gray-300 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-white/5">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all font-medium disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2
                    ${isDestructive 
                      ? "bg-red-600 hover:bg-red-700 shadow-red-900/20" 
                      : "bg-primary-gold hover:bg-yellow-500 text-black shadow-yellow-900/20"
                    }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
